import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { syncYoutubeMentions } from '@/lib/social-sync/youtube';
import { aggregateSyncResults } from '@/lib/social-sync';

/**
 * POST /api/youtube/sync
 * Delega a src/lib/social-sync/youtube.ts (activa searchMentions).
 *
 * GET: retorna el estado de la última sincronización.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const body = await request.json().catch(() => ({}));

    const { supabase } = await import('@/lib/supabase-server');
    const { data: rows } = await supabase
      .from('social_media')
      .select('id, access_token')
      .eq('user_id', userId)
      .eq('platform', 'youtube');

    const accounts = (rows || []).filter((r) => r.access_token);
    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'YouTube no está conectado' },
        { status: 400 }
      );
    }

    // Sincronizar TODAS las cuentas de YouTube del usuario (varias por plan).
    const results: Awaited<ReturnType<typeof syncYoutubeMentions>>[] = [];
    for (const acc of accounts) {
      results.push(
        await syncYoutubeMentions(userId, acc.access_token!, {
          maxPosts: body.maxVideos ?? body.maxPosts,
          maxCommentsPerPost: body.maxCommentsPerVideo ?? body.maxCommentsPerPost,
          lookbackDays: body.lookbackDays,
          maxExternalMentions: body.maxExternalMentions,
          socialAccountId: acc.id,
        })
      );
    }
    const result = aggregateSyncResults(results);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, data: result },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Sincronización exitosa: ${result.mentions_created} comentarios + ${result.external_mentions_created} menciones externas`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/youtube/sync - estado de la última sincronización
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth-token')?.value;
    if (!authToken) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    const { supabase } = await import('@/lib/supabase-server');
    const [socialRes, statsRes, mentionsRes] = await Promise.all([
      supabase.from('social_media').select('*').eq('user_id', userId).eq('platform', 'youtube').maybeSingle(),
      supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('mentions')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'youtube')
        .order('published_at', { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        connected: socialRes.data?.connected || false,
        last_sync: socialRes.data?.last_sync || null,
        stats: statsRes.data || null,
        recent_mentions: mentionsRes.data || [],
        total_mentions: mentionsRes.data?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
