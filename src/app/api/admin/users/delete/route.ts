import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

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

    // Prevenir eliminación de usuarios admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { success: false, message: 'No se pueden eliminar usuarios administradores' },
        { status: 403 }
      );
    }

    // Eliminar usuario
    const success = userService.delete(userId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al eliminar usuario' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}