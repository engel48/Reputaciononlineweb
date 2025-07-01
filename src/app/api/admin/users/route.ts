import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Obtener todos los usuarios desde la base de datos local
    const users = await userService.findAll();
    
    console.log(`✅ Admin API: Usuarios obtenidos: ${users.length}`);
    
    return NextResponse.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('❌ Error en API admin/users:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}