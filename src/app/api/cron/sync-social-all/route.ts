import { NextRequest, NextResponse } from 'next/server';
import {
  syncPlatformMentions,
  SocialPlatform,
  SyncResult,
} from '@/lib/social-sync';
import { sendPlatformDisconnectedEmail } from '@/lib/email-service';

/**
 * Cron endpoint: sincroniza menciones de las 4 redes para TODOS los usuarios conectados.
 *
 * Invocación:
 *   - pg_cron → net.http_post cada 30 minutos (ver migración sync_social_cron.sql)
 *   - Manual: POST con Authorization: Bearer CRON_SECRET_KEY
 *
 * Solo procesa filas con:
 *   - connected=true
 *   - access_token presente
 *   - last_sync NULL o > 25 min (para evitar colisión con refresh-tokens)
 *
 * Serializa por usuario pero procesa plataformas en paralelo para cada uno.
 * Si una plataforma falla, no interrumpe las otras.
 */
const SUPPORTED_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'x', 'youtube'];
const MAX_USERS_PER_RUN = 50;

function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET_KEY;
  return secret && secret.trim().length > 0 ? secret : null;
}

interface CronSocialRow {
  id: string;
  user_id: string;
  platform: string;
  access_token: string | null;
  last_sync: string | null;
}

export async function POST(request: NextRequest) {
  const startAt = Date.now();

  // 1. Auth
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET_KEY no configurado en el servidor' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const platformFilter = body.platform as SocialPlatform | undefined;
  const userFilter = body.userId as string | undefined;

  try {
    const { supabase } = await import('@/lib/supabase-server');

    // 2. Consultar conexiones elegibles
    let query = supabase
      .from('social_media')
      .select('id, user_id, platform, access_token, last_sync')
      .eq('connected', true)
      .not('access_token', 'is', null);

    if (platformFilter) query = query.eq('platform', platformFilter);
    if (userFilter) query = query.eq('user_id', userFilter);

    const { data: rows, error: selectErr } = await query.limit(MAX_USERS_PER_RUN * 4);
    if (selectErr) {
      throw new Error(`Error consultando social_media: ${selectErr.message}`);
    }

    const now = Date.now();
    const eligible = (rows || []).filter((r: CronSocialRow) => {
      if (!r.access_token) return false;
      if (!SUPPORTED_PLATFORMS.includes(r.platform as SocialPlatform)) return false;
      if (!r.last_sync) return true;
      const lastMs = new Date(r.last_sync).getTime();
      return now - lastMs >= 25 * 60 * 1000;
    });

    // 3. Agrupar por user_id para correr plataformas del mismo user en paralelo
    const byUser = new Map<string, CronSocialRow[]>();
    for (const row of eligible) {
      const arr = byUser.get(row.user_id) || [];
      arr.push(row);
      byUser.set(row.user_id, arr);
    }

    const allResults: Array<SyncResult & { user_id: string }> = [];
    let usersProcessed = 0;

    for (const [uid, userRows] of Array.from(byUser.entries()).slice(0, MAX_USERS_PER_RUN)) {
      const platformResults = await Promise.allSettled(
        userRows.map((r) =>
          syncPlatformMentions(r.platform as SocialPlatform, uid, r.access_token!, {
            maxPosts: 20,
            maxCommentsPerPost: 25,
            lookbackDays: 7,
            maxExternalMentions: 25,
            // Escribir métricas SOLO en esta fila (soporta varias cuentas por red).
            socialAccountId: r.id,
          })
        )
      );
      for (let i = 0; i < platformResults.length; i++) {
        const settled = platformResults[i];
        if (settled.status === 'fulfilled') {
          allResults.push({ ...settled.value, user_id: uid });
        } else {
          allResults.push({
            platform: userRows[i].platform as SocialPlatform,
            user_id: uid,
            success: false,
            posts_processed: 0,
            comments_processed: 0,
            mentions_created: 0,
            external_mentions_created: 0,
            error: String(settled.reason),
            duration_ms: 0,
          });
        }
      }
      usersProcessed++;
    }

    // 4. Marcar plataformas con fallo repetido como desconectadas
    //    (captura 401/403 para forzar al token-refresh-job o re-auth del usuario)
    const failed401 = allResults.filter(
      (r) => !r.success && /401|403|unauthorized|forbidden|invalid.*token/i.test(r.error || '')
    );
    // Avisar por correo SOLO en la transición conectado->desconectado (sin spam por corrida).
    const seenDisc = new Set<string>();
    for (const f of failed401) {
      const key = `${f.user_id}|${f.platform}`;
      if (seenDisc.has(key)) continue;
      seenDisc.add(key);

      const { data: wasConnected } = await supabase
        .from('social_media')
        .select('id')
        .eq('user_id', f.user_id)
        .eq('platform', f.platform)
        .eq('connected', true)
        .limit(1);

      await supabase
        .from('social_media')
        .update({ connected: false })
        .eq('user_id', f.user_id)
        .eq('platform', f.platform);

      if (wasConnected && wasConnected.length > 0) {
        try {
          const { data: u } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', f.user_id)
            .single();
          if (u?.email) {
            await sendPlatformDisconnectedEmail(u.email, u.name || 'Usuario', {
              platform: f.platform,
              reason: 'Tu token de acceso expiró o fue revocado. Reconecta tu cuenta para seguir monitoreando.',
            });
          }
        } catch (e) {
          console.error('CRON sync-social-all: fallo enviando aviso de desconexión:', e);
        }
      }
    }

    // 5. Log a system_logs
    const summary = {
      users_eligible: byUser.size,
      users_processed: usersProcessed,
      rows_eligible: eligible.length,
      total_runs: allResults.length,
      successful: allResults.filter((r) => r.success).length,
      failed: allResults.filter((r) => !r.success).length,
      mentions_created: allResults.reduce((s, r) => s + r.mentions_created, 0),
      external_mentions_created: allResults.reduce((s, r) => s + r.external_mentions_created, 0),
      by_platform: SUPPORTED_PLATFORMS.reduce((acc, p) => {
        const pr = allResults.filter((r) => r.platform === p);
        acc[p] = {
          runs: pr.length,
          successful: pr.filter((r) => r.success).length,
          mentions: pr.reduce((s, r) => s + r.mentions_created + r.external_mentions_created, 0),
        };
        return acc;
      }, {} as Record<string, { runs: number; successful: number; mentions: number }>),
      disconnected_for_auth: failed401.length,
    };

    await supabase.from('system_logs').insert({
      event_type: 'social_sync_cron',
      details: {
        ...summary,
        trigger: body.trigger || 'manual',
        duration_ms: Date.now() - startAt,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      duration_ms: Date.now() - startAt,
    });
  } catch (err: any) {
    const { supabase } = await import('@/lib/supabase-server');
    await supabase.from('system_logs').insert({
      event_type: 'social_sync_cron_error',
      details: { error: err?.message || String(err), duration_ms: Date.now() - startAt },
    });
    return NextResponse.json(
      { success: false, error: err?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET_KEY no configurado en el servidor' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization');
  if (authHeader?.replace('Bearer ', '') !== cronSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/cron/sync-social-all',
    method: 'POST',
    description: 'Sync automático de menciones de Facebook/Instagram/X/YouTube',
  });
}
