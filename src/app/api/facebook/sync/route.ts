import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { syncFacebookMentions } from '@/lib/social-sync/facebook';
import { syncFailureResponse } from '@/lib/social-sync/sync-response';

/**
 * POST /api/facebook/sync
 *
 * Delega la sincronización a src/lib/social-sync/facebook.ts.
 * El mismo path lo usa el cron automático /api/cron/sync-social-all.
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
    const { data: social, error: socialErr } = await supabase
      .from('social_media')
      .select('access_token')
      .eq('user_id', userId)
      .eq('platform', 'facebook')
      .single();

    if (socialErr || !social?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Facebook no está conectado' },
        { status: 400 }
      );
    }

    const result = await syncFacebookMentions(userId, social.access_token, {
      maxPosts: body.maxPosts,
      maxCommentsPerPost: body.maxCommentsPerPost,
      lookbackDays: body.lookbackDays,
      maxExternalMentions: body.maxExternalMentions,
    });

    if (!result.success) {
      // Falla por configuración/permisos (p. ej. "no hay páginas vinculadas")
      // → 200 con mensaje claro; error real → 500. (ver sync-response.ts)
      return syncFailureResponse(result.error, result);
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Sincronización exitosa: ${result.mentions_created} comentarios + ${result.external_mentions_created} menciones externas`,
    });
  } catch (error: any) {
    return syncFailureResponse(error?.message);
  }
}
