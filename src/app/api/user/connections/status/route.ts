/**
 * API Endpoint: Estado de Conexiones Sociales del Usuario
 *
 * Retorna el estado actual de todas las conexiones OAuth
 * incluyendo validez de tokens y tiempo hasta expiración.
 *
 * GET /api/user/connections/status
 *
 * Headers requeridos:
 * - Cookie: authToken (JWT del usuario)
 *
 * Respuesta:
 * {
 *   "connections": [
 *     {
 *       "platform": "youtube",
 *       "username": "canal_123",
 *       "connected": true,
 *       "token_valid": false,
 *       "days_until_expiry": -3,
 *       "needs_reconnection": true
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-helper';
import { tokenRefreshService } from '@/lib/oauth/token-refresh-service';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await verifyAuthToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    // Obtener estado de conexiones
    const connections = await tokenRefreshService.getUserConnectionsStatus(userId);

    // Enriquecer con información adicional
    const enrichedConnections = connections.map(conn => ({
      ...conn,
      needs_reconnection: !conn.token_valid || (conn.days_until_expiry !== null && conn.days_until_expiry < 7),
      status: conn.token_valid
        ? (conn.days_until_expiry !== null && conn.days_until_expiry < 7 ? 'expiring_soon' : 'active')
        : 'expired',
      icon: getPlatformIcon(conn.platform),
      display_name: getPlatformDisplayName(conn.platform)
    }));

    return NextResponse.json({
      success: true,
      user_id: userId,
      connections: enrichedConnections,
      summary: {
        total: enrichedConnections.length,
        active: enrichedConnections.filter(c => c.connected && c.token_valid).length,
        expired: enrichedConnections.filter(c => !c.token_valid).length,
        expiring_soon: enrichedConnections.filter(c =>
          c.token_valid && c.days_until_expiry !== null && c.days_until_expiry < 7
        ).length
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo estado de conexiones:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * Refresh manual de tokens de un usuario
 * POST /api/user/connections/status
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await verifyAuthToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const userId = user.userId;

    console.log(`🔄 Usuario ${userId} solicitó renovación manual de tokens`);

    // Ejecutar refresh para este usuario
    const results = await tokenRefreshService.refreshUserTokens(userId);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: 'Proceso de renovación completado',
      refreshed: successful,
      failed: failed,
      results: results.map(r => ({
        platform: r.platform,
        success: r.success,
        error: r.error
      }))
    });

  } catch (error: any) {
    console.error('Error en refresh manual:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// Utilidades
function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    youtube: '🎥',
    facebook: '📘',
    instagram: '📸',
    x: '🐦',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '📱',
    threads: '🧵'
  };
  return icons[platform] || '🔗';
}

function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    youtube: 'YouTube',
    facebook: 'Facebook',
    instagram: 'Instagram',
    x: 'X (Twitter)',
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    threads: 'Threads'
  };
  return names[platform] || platform;
}
