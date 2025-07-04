import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 ADMIN API: Iniciando búsqueda de usuarios...');
    console.log('🔍 ADMIN API: NODE_ENV:', process.env.NODE_ENV);
    console.log('🔍 ADMIN API: DATABASE_URL configurada:', process.env.DATABASE_URL ? 'Sí' : 'No');
    console.log('🔍 ADMIN API: DATABASE_URL tipo:', process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Otro');
    
    // Verificar que estamos usando PostgreSQL
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
    const usePostgres = isProduction && hasPostgresUrl;
    
    console.log('🔍 ADMIN API: Configuración DB:', {
      isProduction,
      hasPostgresUrl,
      usePostgres,
      databaseEngine: usePostgres ? 'PostgreSQL' : 'SQLite'
    });
    
    // Obtener todos los usuarios desde la base de datos
    console.log('🔍 ADMIN API: Llamando userService.findAll()...');
    const users = await userService.findAll();
    
    console.log(`✅ ADMIN API: Usuarios obtenidos: ${users ? users.length : 'null/undefined'}`);
    
    if (users && users.length > 0) {
      console.log('🔍 ADMIN API: Primer usuario:', {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        plan: users[0].plan
      });
    }
    
    return NextResponse.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('❌ ADMIN API Error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}