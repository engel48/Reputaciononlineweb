import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 USERS API PUT: Iniciando actualización de usuario...');
    console.log('🔍 USERS API PUT: DATABASE_URL configurada:', !!process.env.DATABASE_URL);
    console.log('🔍 USERS API PUT: Usando engine:', process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'SQLite');
    
    const body = await request.json();
    const { userId, ...updates } = body;

    console.log('🔍 USERS API PUT: Datos recibidos:', { userId, updates });

    if (!userId) {
      console.log('❌ USERS API PUT: Falta userId');
      return NextResponse.json(
        { success: false, message: 'ID de usuario requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    console.log('🔍 USERS API PUT: Verificando si usuario existe...');
    const existingUser = await userService.findById(userId);
    if (!existingUser) {
      console.log('❌ USERS API PUT: Usuario no encontrado:', userId);
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ USERS API PUT: Usuario existe, procediendo con actualización');
    console.log('📝 USERS API PUT: Datos a actualizar:', updates);

    // Actualizar usuario en la base de datos
    const success = await userService.update(userId, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (success) {
      // Obtener el usuario actualizado
      const updatedUser = await userService.findById(userId);
      
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
    const user = await userService.findById(userId);
    
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