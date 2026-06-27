/**
 * GET /api/app/config?version=1.0.0&platform=android
 * Configuración remota de la app móvil (app gate): versión mínima/última,
 * mantenimiento, feature flags y anuncios. Público: la app lo consulta al
 * arrancar, incluso antes del login.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { compareVersions } from '@/lib/version-compare';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version') || '0.0.0';
    const platform = (searchParams.get('platform') || 'android').toLowerCase();

    const { data: config, error } = await supabase
      .from('app_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('[app/config] error:', error);
      return NextResponse.json({ success: false, error: 'No se pudo cargar la configuración' }, { status: 500 });
    }

    const cfg = config || {};
    const minSupported = cfg.min_supported_version || '1.0.0';
    const latest = cfg.latest_version || '1.0.0';

    const belowMinimum = compareVersions(version, minSupported) < 0;
    const updateAvailable = compareVersions(version, latest) < 0;
    const forceUpdate = (cfg.force_update === true) || belowMinimum;

    const updateUrl =
      platform === 'ios' ? (cfg.update_url_ios || '') : (cfg.update_url_android || '');

    return NextResponse.json({
      success: true,
      data: {
        minSupportedVersion: minSupported,
        latestVersion: latest,
        forceUpdate,
        updateAvailable,
        maintenanceMode: cfg.maintenance_mode === true,
        maintenanceMessage: cfg.maintenance_message || '',
        updateUrl,
        featureFlags: cfg.feature_flags || {},
        announcements: cfg.announcements || [],
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error interno' }, { status: 500 });
  }
}
