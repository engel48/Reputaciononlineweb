import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/system/status - Iniciando...');
    
    // Importar dinámicamente para evitar problemas de inicialización
    const { systemSettingsService } = await import('@/lib/database-adapter');
    console.log('✅ Importación exitosa');
    
    // Obtener configuración del motor de búsqueda
    console.log('🔍 Obteniendo configuración search_engine_enabled...');
    const searchEnabled = await systemSettingsService.get('search_engine_enabled');
    console.log('🔍 searchEnabled:', searchEnabled);
    
    console.log('🔍 Obteniendo configuración maintenance_message...');
    const maintenanceMessage = await systemSettingsService.get('maintenance_message');
    console.log('🔍 maintenanceMessage:', maintenanceMessage);

    const result = {
      success: true,
      searchEngineEnabled: searchEnabled?.value === 'true' || searchEnabled?.value === undefined, // Por defecto habilitado
      maintenanceMessage: maintenanceMessage?.value || 'El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.'
    };
    
    console.log('✅ Resultado final:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error obteniendo estado del sistema:', error);
    const fallbackResult = {
      success: true,
      searchEngineEnabled: true, // Por defecto habilitado en caso de error
      maintenanceMessage: 'El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.'
    };
    console.log('🔄 Enviando resultado fallback:', fallbackResult);
    return NextResponse.json(fallbackResult);
  }
}