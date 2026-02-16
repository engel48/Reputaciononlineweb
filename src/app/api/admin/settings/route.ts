import { NextRequest, NextResponse } from 'next/server';
import { systemSettingsService } from '@/lib/database-adapter';
import { requireRole } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    console.log('🔍 ADMIN SETTINGS API: Iniciando obtención de configuraciones...');
    console.log('🔍 ADMIN SETTINGS API: NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 ADMIN SETTINGS API: DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sí' : 'No');
    console.log('🔍 ADMIN SETTINGS API: DATABASE_URL tipo:', process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Otro');
    
    // Verificar que estamos usando PostgreSQL
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
    const usePostgres = isProduction && hasPostgresUrl;
    
    console.log('🔍 ADMIN SETTINGS API: Configuración DB:', {
      isProduction,
      hasPostgresUrl,
      usePostgres,
      databaseEngine: usePostgres ? 'PostgreSQL' : 'SQLite'
    });
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      console.log('🔍 ADMIN SETTINGS API: Obteniendo configuración específica:', key);
      // Obtener una configuración específica
      const setting = await systemSettingsService.get(key);
      console.log('✅ ADMIN SETTINGS API: Configuración obtenida:', setting ? 'Encontrada' : 'No encontrada');
      return NextResponse.json({
        success: true,
        setting
      });
    } else {
      console.log('🔍 ADMIN SETTINGS API: Obteniendo todas las configuraciones...');
      // Obtener todas las configuraciones
      const settings = await systemSettingsService.getAll();
      console.log(`✅ ADMIN SETTINGS API: Configuraciones obtenidas: ${settings ? settings.length : 'null/undefined'}`);
      
      if (settings && settings.length > 0) {
        console.log('🔍 ADMIN SETTINGS API: Primera configuración:', {
          key: settings[0].key,
          value: settings[0].value
        });
      }
      
      return NextResponse.json({
        success: true,
        settings: settings || []
      });
    }
  } catch (error) {
    console.error('❌ ADMIN SETTINGS API Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    console.log('🔍 ADMIN SETTINGS POST: Guardando configuración...');
    const body = await request.json();
    const { key, value, description } = body;

    console.log('🔍 ADMIN SETTINGS POST: Datos recibidos:', { key, value, description });

    if (!key || value === undefined) {
      console.log('❌ ADMIN SETTINGS POST: Datos incompletos');
      return NextResponse.json(
        { success: false, message: 'Clave y valor son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 ADMIN SETTINGS POST: Llamando systemSettingsService.set...');
    await systemSettingsService.set(key, value, description, 'admin');
    console.log('✅ ADMIN SETTINGS POST: Configuración guardada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });
  } catch (error) {
    console.error('❌ ADMIN SETTINGS POST Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación y rol admin
    const admin = await requireRole(request, 'admin');
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Clave requerida' },
        { status: 400 }
      );
    }

    const deleted = await systemSettingsService.delete(key);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Configuración eliminada exitosamente'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Configuración no encontrada' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error eliminando configuración:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}