import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    connectionTests: {},
    errors: []
  };

  try {
    // 1. Verificar variables de entorno
    console.log('🔍 TEST: Verificando variables de entorno...');
    results.environment = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + '...[HIDDEN]...' + process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 20) 
        : 'NOT SET'
    };

    // 2. Test directo con pg
    console.log('🔍 TEST: Probando conexión directa con pg...');
    try {
      const { Pool } = require('pg');
      
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL no está definida');
      }

      console.log('🔍 TEST: Creando pool de conexiones...');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
        connectionTimeoutMillis: 5000,
        max: 1
      });

      console.log('🔍 TEST: Intentando conectar...');
      const client = await pool.connect();
      
      console.log('🔍 TEST: Conexión exitosa, probando query básico...');
      const versionResult = await client.query('SELECT version() as version, current_database() as database, current_user as user');
      
      console.log('🔍 TEST: Query exitoso, probando tabla users...');
      let usersTest;
      try {
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
        usersTest = {
          success: true,
          count: parseInt(usersResult.rows[0].count),
          message: 'Tabla users existe y es accesible'
        };
      } catch (tableError: any) {
        usersTest = {
          success: false,
          error: tableError.message,
          message: 'Tabla users no existe o no es accesible'
        };
      }

      results.connectionTests.postgresql = {
        success: true,
        connection: 'SUCCESSFUL',
        version: versionResult.rows[0].version,
        database: versionResult.rows[0].database,
        user: versionResult.rows[0].user,
        usersTable: usersTest
      };

      client.release();
      await pool.end();
      
    } catch (pgError: any) {
      console.error('❌ TEST: Error con PostgreSQL:', pgError);
      results.connectionTests.postgresql = {
        success: false,
        error: pgError.message,
        code: pgError.code,
        severity: pgError.severity,
        detail: pgError.detail
      };
      results.errors.push(`PostgreSQL Error: ${pgError.message}`);
    }

    // 3. Test del database adapter
    console.log('🔍 TEST: Probando database adapter...');
    try {
      const { userService } = require('@/lib/database-adapter');
      const users = await userService.findAll();
      
      results.connectionTests.databaseAdapter = {
        success: true,
        userCount: users ? users.length : 0,
        message: 'Database adapter funciona correctamente'
      };
    } catch (adapterError: any) {
      console.error('❌ TEST: Error con database adapter:', adapterError);
      results.connectionTests.databaseAdapter = {
        success: false,
        error: adapterError.message,
        message: 'Database adapter falló'
      };
      results.errors.push(`Database Adapter Error: ${adapterError.message}`);
    }

    // 4. Recomendaciones
    results.recommendations = [];
    
    if (!results.connectionTests.postgresql?.success) {
      results.recommendations.push('❌ PostgreSQL connection failed - check credentials');
    }
    
    if (!results.connectionTests.databaseAdapter?.success) {
      results.recommendations.push('❌ Database adapter failed - check database setup');
    }
    
    if (results.connectionTests.postgresql?.success && results.connectionTests.postgresql?.usersTable?.success) {
      results.recommendations.push('✅ Database is working - login should work');
    }

    console.log('✅ TEST: Diagnóstico completado');
    
    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    console.error('❌ TEST: Error fatal:', error);
    results.errors.push(`Fatal Error: ${error.message}`);
    
    return NextResponse.json({
      success: false,
      results,
      fatalError: error.message
    }, { status: 500 });
  }
}