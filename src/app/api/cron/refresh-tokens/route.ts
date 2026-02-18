/**
 * API Endpoint: Renovación Automática de Tokens OAuth
 *
 * Este endpoint ejecuta el proceso de renovación de tokens
 * para mantener las conexiones OAuth activas.
 *
 * Uso:
 * 1. Cron Job: Ejecutar cada 6 horas
 * 2. Manual: POST /api/cron/refresh-tokens
 *
 * Headers requeridos:
 * - Authorization: Bearer CRON_SECRET_KEY (para seguridad)
 *
 * Respuesta:
 * {
 *   "success": true,
 *   "refreshed": 2,
 *   "failed": 1,
 *   "results": [...]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { tokenRefreshService } from '@/lib/oauth/token-refresh-service';

// Clave secreta para autorizar cron jobs (configurar en .env.local)
const CRON_SECRET = process.env.CRON_SECRET_KEY || 'dev-cron-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    console.log('\n🚀 ===== INICIO: Proceso de Renovación de Tokens OAuth =====');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    // Ejecutar renovación de tokens que expiran en 24h
    const results = await tokenRefreshService.refreshExpiringTokens(24);

    // Calcular estadísticas
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log('\n✅ ===== FIN: Proceso Completado =====\n');

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        tokens_checked: results.length,
        tokens_refreshed: successful,
        tokens_failed: failed
      },
      results: results.map(r => ({
        platform: r.platform,
        success: r.success,
        error: r.error,
        new_expiry: r.new_expiry
      }))
    });

  } catch (error: any) {
    console.error('❌ Error en cron job de refresh:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para verificar que el endpoint está activo
export async function GET(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: 'active',
    endpoint: '/api/cron/refresh-tokens',
    method: 'POST',
    description: 'Renovación automática de tokens OAuth'
  });
}
