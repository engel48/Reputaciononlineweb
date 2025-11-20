import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helper';

/**
 * Consolidated Social Media Analytics - Datos REALES de todas las plataformas
 *
 * ✅ ARQUITECTURA UNIFICADA WEB + MÓVIL
 * GET /api/social-media/consolidated
 *
 * Headers: Authorization: Bearer {token}
 * Response: Métricas consolidadas de TODAS las plataformas conectadas
 */

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Consolidated Analytics: Generando métricas reales...');

    // ✅ Autenticar usando Bearer token
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error 401
    }

    const { userId } = authResult;

    const { supabase } = await import('@/lib/supabase-server');

    // 1. Obtener TODAS las plataformas conectadas del usuario
    const { data: connectedPlatforms, error: platformsError } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId)
      .eq('connected', true);

    if (platformsError) {
      console.error('Error obteniendo plataformas:', platformsError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener plataformas' },
        { status: 500 }
      );
    }

    const platforms = connectedPlatforms || [];

    // 2. Obtener TODAS las menciones de TODAS las plataformas
    const { data: allMentions, error: mentionsError } = await supabase
      .from('mentions')
      .select('*')
      .eq('user_id', userId)
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 7 días

    if (mentionsError) {
      console.error('Error obteniendo menciones:', mentionsError);
    }

    const mentions = allMentions || [];

    // 3. CALCULAR MÉTRICAS REALES

    // Engagement Total Real = suma de likes + comments + shares de todas las menciones
    const totalLikes = mentions.reduce((sum: number, m: any) => sum + (m.likes || 0), 0);
    const totalComments = mentions.reduce((sum: number, m: any) => sum + (m.comments || 0), 0);
    const totalShares = mentions.reduce((sum: number, m: any) => sum + (m.shares || 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;

    // Tasa de Engagement Real = (engagement total / seguidores totales) * 100
    const totalFollowers = platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0);
    const engagementRate = totalFollowers > 0
      ? ((totalEngagement / totalFollowers) * 100).toFixed(2)
      : '0.00';

    // Alcance Semanal Real = suma de seguidores de todas las plataformas
    const weeklyReach = totalFollowers;

    // Índice de Viralidad Real = (shares / menciones totales) * 100
    const viralityIndex = mentions.length > 0
      ? ((totalShares / mentions.length) * 100).toFixed(1)
      : '0.0';

    // 4. Engagement por plataforma (REAL)
    const platformEngagement: Record<string, any> = {};

    for (const platform of platforms) {
      const platformMentions = mentions.filter((m: any) => m.platform === platform.platform);

      const platformLikes = platformMentions.reduce((sum: number, m: any) => sum + (m.likes || 0), 0);
      const platformComments = platformMentions.reduce((sum: number, m: any) => sum + (m.comments || 0), 0);
      const platformShares = platformMentions.reduce((sum: number, m: any) => sum + (m.shares || 0), 0);
      const platformTotalEngagement = platformLikes + platformComments + platformShares;

      const platformEngagementRate = platform.followers > 0
        ? ((platformTotalEngagement / platform.followers) * 100).toFixed(1)
        : '0.0';

      platformEngagement[platform.platform] = {
        name: platform.display_name || platform.platform,
        followers: platform.followers || 0,
        mentions: platformMentions.length,
        engagement: platformTotalEngagement,
        engagementRate: parseFloat(platformEngagementRate),
        likes: platformLikes,
        comments: platformComments,
        shares: platformShares
      };
    }

    // 5. Top contenido por engagement
    const topContent = mentions
      .sort((a: any, b: any) => {
        const engagementA = (a.likes || 0) + (a.comments || 0) + (a.shares || 0);
        const engagementB = (b.likes || 0) + (b.comments || 0) + (b.shares || 0);
        return engagementB - engagementA;
      })
      .slice(0, 3)
      .map((m: any) => ({
        content: m.content,
        author: m.author_name,
        platform: m.platform,
        likes: m.likes || 0,
        shares: m.shares || 0,
        engagement: (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
      }));

    // 6. Construir respuesta con datos 100% REALES
    const analytics = {
      success: true,
      data: {
        overview: {
          totalEngagement,
          engagementRate: parseFloat(engagementRate),
          weeklyReach,
          viralityIndex: parseFloat(viralityIndex),
          totalMentions: mentions.length,
          totalPlatforms: platforms.length,
          connectedPlatforms: platforms.map((p: any) => p.platform)
        },
        breakdown: {
          totalLikes,
          totalComments,
          totalShares,
          totalFollowers
        },
        platformEngagement,
        topContent,
        generatedAt: new Date().toISOString()
      }
    };

    console.log('✅ Métricas consolidadas generadas (100% reales)');

    return NextResponse.json(analytics);

  } catch (error: any) {
    console.error('❌ Error generando analytics consolidados:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
