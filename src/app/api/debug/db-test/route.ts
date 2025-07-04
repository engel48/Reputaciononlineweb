import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DB TEST: Verificando conexión de base de datos...');
    
    // Información del entorno
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set',
    };
    
    console.log('🔍 DB TEST: Environment:', envInfo);
    
    // Información del adaptador
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
    const usePostgres = isProduction && hasPostgresUrl;
    
    const adapterInfo = {
      isProduction,
      hasPostgresUrl,
      usePostgres,
      databaseEngine: usePostgres ? 'PostgreSQL' : 'SQLite'
    };
    
    console.log('🔍 DB TEST: Adapter info:', adapterInfo);
    
    // Probar userService.findAll()
    console.log('🔍 DB TEST: Llamando userService.findAll()...');
    const users = await userService.findAll();
    console.log(`🔍 DB TEST: Usuarios encontrados: ${users ? users.length : 'null/undefined'}`);
    
    const testResults = {
      environment: envInfo,
      adapter: adapterInfo,
      userCount: users ? users.length : 0,
      firstUser: users && users.length > 0 ? {
        id: users[0].id,
        email: users[0].email,
        name: users[0].name,
        plan: users[0].plan
      } : null,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      test: testResults
    });
  } catch (error) {
    console.error('❌ DB TEST Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error en test de base de datos',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}