import { NextRequest, NextResponse } from 'next/server';
import { systemSettingsService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Obtener una configuración específica
      const setting = await systemSettingsService.get(key);
      return NextResponse.json({
        success: true,
        setting
      });
    } else {
      // Obtener todas las configuraciones
      const settings = await systemSettingsService.getAll();
      return NextResponse.json({
        success: true,
        settings
      });
    }
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, description } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: 'Clave y valor son requeridos' },
        { status: 400 }
      );
    }

    await systemSettingsService.set(key, value, description, 'admin');

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });
  } catch (error) {
    console.error('Error guardando configuración:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
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