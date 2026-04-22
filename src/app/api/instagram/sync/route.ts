import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { syncInstagramMentions } from '@/lib/social-sync/instagram';

/**
 * POST /api/instagram/sync
 * Delega a src/lib/social-sync/instagram.ts.
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
      .eq('platform', 'instagram')
      .single();

    if (socialErr || !social?.access_token) {
      return NextResponse.json(
        { success: false, error: 'Instagram no está conectado' },
        { status: 400 }
      );
    }

    const result = await syncInstagramMentions(userId, social.access_token, {
      maxPosts: body.maxPosts,
      maxCommentsPerPost: body.maxCommentsPerPost,
      lookbackDays: body.lookbackDays,
      maxExternalMentions: body.maxExternalMentions,
    });

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
