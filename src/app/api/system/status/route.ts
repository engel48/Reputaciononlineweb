import { NextRequest, NextResponse } from 'next/server';
import { systemSettingsService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    // Obtener configuración del motor de búsqueda
    const searchEnabled = await systemSettingsService.get('search_engine_enabled');
    const maintenanceMessage = await systemSettingsService.get('maintenance_message');

    return NextResponse.json({
      success: true,
      searchEngineEnabled: searchEnabled?.value === 'true' || searchEnabled?.value === undefined, // Por defecto habilitado
      maintenanceMessage: maintenanceMessage?.value || 'El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.'
    });
  } catch (error) {
    console.error('Error obteniendo estado del sistema:', error);
    return NextResponse.json({
      success: true,
      searchEngineEnabled: true, // Por defecto habilitado en caso de error
      maintenanceMessage: 'El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.'
    });
  }
}