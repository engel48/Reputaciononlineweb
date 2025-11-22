/**
 * GET /api/news-monitoring/cron
 * Endpoint para ejecutar el procesamiento de cola desde un cron job externo
 * Se puede llamar desde Vercel Cron, Railway Cron, o cualquier scheduler externo
 */

import { NextRequest, NextResponse } from 'next/server';
import { processQueue, getQueueStats, cleanupOldJobs } from '@/lib/news-monitoring/queue-processor';

export async function GET(request: NextRequest) {
  try {
    // Verificar cron secret para seguridad
    const cronSecret = request.headers.get('x-cron-secret');

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Cron secret inválido',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting scheduled queue processing...');

    const startTime = Date.now();

    // Ejecutar procesamiento de cola
    await processQueue();

    const duration = Date.now() - startTime;

    // Obtener estadísticas
    const stats = await getQueueStats();

    // Limpiar jobs antiguos una vez al día (si es necesario)
    const hour = new Date().getHours();
    if (hour === 2) { // A las 2 AM
      console.log('[CRON] Running cleanup of old jobs...');
      await cleanupOldJobs();
    }

    console.log(`[CRON] ✓ Queue processing completed in ${duration}ms`);

    return NextResponse.json(
      {
        success: true,
        data: {
          duration: `${duration}ms`,
          stats,
        },
        message: 'Queue processing completed successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[CRON] Error in cron job:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRON_ERROR',
          message: 'Error en procesamiento de cron',
          details: error.message,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Configuración de runtime para Vercel
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos
