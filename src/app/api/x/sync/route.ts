import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { syncTwitterMentions } from '@/lib/social-sync/twitter';
import { aggregateSyncResults } from '@/lib/social-sync';

/**
 * POST /api/x/sync
 * Delega a src/lib/social-sync/twitter.ts (usa el endpoint oficial de mentions).
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
      .eq('platform', 'x');

    const accounts = (rows || []).filter((r) => r.access_token);
    if (accounts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'X/Twitter no está conectado' },
        { status: 400 }
      );
    }

    // Sincronizar TODAS las cuentas de X del usuario (varias por plan).
    const results: Awaited<ReturnType<typeof syncTwitterMentions>>[] = [];
    for (const acc of accounts) {
      results.push(
        await syncTwitterMentions(userId, acc.access_token!, {
          maxPosts: body.maxPosts,
          maxCommentsPerPost: body.maxCommentsPerPost,
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
      message: `Sincronización exitosa: ${result.external_mentions_created} menciones externas`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
