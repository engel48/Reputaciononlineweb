import { NextRequest, NextResponse } from 'next/server';
import { socialOAuthManager, SocialPlatform } from '@/lib/oauth/manager';
import { requireAuth } from '@/lib/auth-helper';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con JWT (verify, no decode)
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const userId = user.userId;
    console.log(`✅ SOCIAL-CONNECT POST: Usuario autenticado: ${userId}`);

    const { platform, action, accessToken, refreshToken, expiresAt, accountId } = await request.json();

    // `disconnect_account` no requiere platform (usa accountId directamente)
    if (action !== 'disconnect_account') {
      if (!platform || !['facebook', 'instagram', 'x', 'youtube'].includes(platform)) {
        return NextResponse.json({ error: 'Plataforma no válida' }, { status: 400 });
      }
    }

    if (action === 'connect') {
      if (accessToken) {
        // Respetar el limite del plan tambien en esta ruta (mismo helper
        // que usan los callbacks OAuth) para que no sea un bypass.
        const { checkSocialAccountLimit } = await import('@/lib/plan-limits');
        const limitCheck = await checkSocialAccountLimit(userId, platform);
        if (!limitCheck.allowed) {
          return NextResponse.json(
            {
              error: limitCheck.reason || 'Limite de cuentas alcanzado',
              plan: limitCheck.plan,
              current: limitCheck.current,
              limit: limitCheck.limit,
            },
            { status: 403 }
          );
        }

        // Conectar con token existente (callback de OAuth)
        const { saveOAuthConnection } = await import('@/lib/oauth-storage');
        const saved = await saveOAuthConnection({
          userId,
          platform,
          accessToken,
          refreshToken,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          profile: { id: 'manual', username: platform }
        });

        if (saved) {
          return NextResponse.json({
            success: true,
            message: `${platform} conectado exitosamente`
          });
        } else {
          return NextResponse.json({
            error: `Error al conectar ${platform}`
          }, { status: 500 });
        }
      } else {
        // Generar URL de autorización OAuth
        const authUrl = generateOAuthUrl(platform);

        return NextResponse.json({
          success: true,
          authUrl,
          message: `Redirigiendo a ${platform} para autorización...`
        });
      }
    }

    if (action === 'disconnect') {
      const success = await socialOAuthManager.disconnectSocialNetwork(
        userId,
        platform as SocialPlatform
      );

      if (success) {
        return NextResponse.json({
          success: true,
          message: `${platform} desconectado exitosamente`
        });
      } else {
        return NextResponse.json({
          error: `Error al desconectar ${platform}`
        }, { status: 500 });
      }
    }

    // Desconecta una cuenta específica por id (para planes con múltiples cuentas)
    if (action === 'disconnect_account') {
      if (!accountId) {
        return NextResponse.json({ error: 'accountId requerido' }, { status: 400 });
      }

      const { disconnectAccountById } = await import('@/lib/oauth-storage');
      const success = await disconnectAccountById(userId, accountId);

      if (success) {
        return NextResponse.json({
          success: true,
          message: 'Cuenta desconectada exitosamente',
        });
      }
      return NextResponse.json({ error: 'Error al desconectar cuenta' }, { status: 500 });
    }

    if (action === 'sync') {
      // Sincronizar datos de la plataforma
      const success = await socialOAuthManager.syncAllConnections(userId);
      
      return NextResponse.json({ 
        success, 
        message: success ? 'Datos sincronizados exitosamente' : 'Error al sincronizar datos' 
      });
    }

    if (action === 'validate') {
      // Validar tokens de todas las plataformas
      const validationResults = await socialOAuthManager.validateUserTokens(userId);
      
      return NextResponse.json({ 
        success: true, 
        validationResults,
        message: 'Validación de tokens completada' 
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error en social-connect:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación con JWT (verify, no decode)
    const user = await requireAuth(request);
    if (user instanceof NextResponse) return user;

    const userId = user.userId;
    console.log(`✅ SOCIAL-CONNECT GET: Usuario autenticado: ${userId}`);

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'summary') {
      // Obtener resumen de conexiones
      const summary = await socialOAuthManager.getConnectionSummary(userId);
      return NextResponse.json({
        success: true,
        summary,
        message: 'Resumen de conexiones obtenido exitosamente'
      });
    }

    if (action === 'list_accounts') {
      const platformFilter = url.searchParams.get('platform') || undefined;
      const { listConnectedAccounts } = await import('@/lib/oauth-storage');
      const accounts = await listConnectedAccounts(userId, platformFilter);
      return NextResponse.json({ success: true, accounts });
    }

    // Obtener estado de conexiones de redes sociales del usuario (AHORA DE SUPABASE)
    const connections = await socialOAuthManager.getUserConnections(userId);

    // Transformar para compatibilidad con el frontend
    const socialConnections = Object.fromEntries(
      Object.entries(connections).map(([platform, connection]) => [
        platform,
        {
          connected: connection.connected,
          username: connection.username || '',
          displayName: connection.displayName || '',
          followers: connection.followers || 0,
          profileImage: connection.profileImage || '',
          lastSync: connection.lastSync || null,
          metrics: connection.metrics || { posts: 0, engagement: 0, reach: 0 }
        }
      ])
    );

    return NextResponse.json({ 
      success: true,
      socialConnections,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo conexiones sociales:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

function generateOAuthUrl(platform: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/dashboard/redes-sociales?connect=${platform}`;
  
  switch (platform) {
    case 'facebook':
      return `${baseUrl}/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    case 'x':
    case 'twitter':
      return `${baseUrl}/api/auth/signin/twitter?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    case 'instagram':
      // Instagram usa Facebook Login con scopes específicos
      return `${baseUrl}/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(callbackUrl)}&scope=instagram_basic`;

    case 'youtube':
      // YouTube usa Google OAuth con scopes específicos
      return `${baseUrl}/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}&scope=https://www.googleapis.com/auth/youtube.readonly`;

    default:
      return `${baseUrl}/dashboard/redes-sociales?error=platform_not_supported`;
  }
}
