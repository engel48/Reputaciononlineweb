import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, plan, credits, profileType } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const user = await userService.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (plan) updateData.plan = plan;
    if (credits !== undefined) updateData.credits = parseInt(credits);
    if (profileType) updateData.profileType = profileType;

    // Actualizar usuario
    const success = await userService.update(userId, updateData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Usuario actualizado exitosamente'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}