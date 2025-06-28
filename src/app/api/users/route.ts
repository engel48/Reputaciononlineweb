import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const existingUser = userService.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('📝 Actualizando usuario:', userId, 'con datos:', updates);

    // Actualizar usuario en la base de datos
    const success = userService.update(userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (success) {
      // Obtener el usuario actualizado
      const updatedUser = userService.findById(userId);
      
      console.log('✅ Usuario actualizado exitosamente:', updatedUser?.plan);
      
      return NextResponse.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: updatedUser
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Error al actualizar usuario' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error en API users:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = userService.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}