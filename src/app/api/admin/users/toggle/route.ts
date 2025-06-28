import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database';

export async function PUT(request: NextRequest) {
  try {
    const { userId, isActive } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = userService.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // No permitir deshabilitar usuarios admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'No se puede deshabilitar un usuario administrador' },
        { status: 403 }
      );
    }

    // Actualizar el estado del usuario
    const updated = userService.update(userId, { 
      isActive: isActive ? 1 : 0,
      updatedAt: new Date().toISOString()
    });

    if (updated) {
      console.log(`✅ Usuario ${isActive ? 'habilitado' : 'deshabilitado'}: ${userId}`);
      return NextResponse.json({
        success: true,
        message: `Usuario ${isActive ? 'habilitado' : 'deshabilitado'} exitosamente`
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error actualizando usuario' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error en API admin/users/toggle:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}