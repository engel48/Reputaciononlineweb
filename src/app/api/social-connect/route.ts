import { NextRequest, NextResponse } from 'next/server';
import { socialOAuthManager, SocialPlatform } from '@/lib/oauth/manager';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación con JWT custom
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ SOCIAL-CONNECT POST: No auth token found');
      return NextResponse.json({ error: 'No autorizado - No hay token' }, { status: 401 });
    }

    // Decodificar JWT para obtener userId
    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      console.error('❌ SOCIAL-CONNECT POST: Invalid token');
      return NextResponse.json({ error: 'No autorizado - Token inválido' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log(`✅ SOCIAL-CONNECT POST: Usuario autenticado: ${userId}`);

    const { platform, action, accessToken, refreshToken, expiresAt } = await request.json();

    if (!platform || !['facebook', 'instagram', 'x', 'youtube'].includes(platform)) {
      return NextResponse.json({ error: 'Plataforma no válida' }, { status: 400 });
    }

    if (action === 'connect') {
      if (accessToken) {
        // Conectar con token existente (callback de OAuth)
        const success = await socialOAuthManager.connectSocialNetwork(
          userId,
          platform as SocialPlatform,
          accessToken,
          refreshToken,
          expiresAt
        );

        if (success) {
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
    // Verificar autenticación con JWT custom
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth-token')?.value;

    if (!authToken) {
      console.error('❌ SOCIAL-CONNECT GET: No auth token found');
      return NextResponse.json({ error: 'No autorizado - No hay token' }, { status: 401 });
    }

    // Decodificar JWT para obtener userId
    const decoded = jwt.decode(authToken) as { userId: string } | null;
    if (!decoded || !decoded.userId) {
      console.error('❌ SOCIAL-CONNECT GET: Invalid token');
      return NextResponse.json({ error: 'No autorizado - Token inválido' }, { status: 401 });
    }

    const userId = decoded.userId;
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
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3002';
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
