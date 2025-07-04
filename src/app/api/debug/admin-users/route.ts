import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG ADMIN USERS: Iniciando debug específico...');
    
    // Verificar entorno
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 'Not set',
    };
    
    console.log('🔍 DEBUG ADMIN USERS: Environment:', envInfo);
    
    // Verificar adaptador
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
    const usePostgres = isProduction && hasPostgresUrl;
    
    console.log('🔍 DEBUG ADMIN USERS: Adapter config:', {
      isProduction,
      hasPostgresUrl,
      usePostgres,
      databaseEngine: usePostgres ? 'PostgreSQL' : 'SQLite'
    });
    
    // Probar userService step by step
    console.log('🔍 DEBUG ADMIN USERS: Testing userService.findAll()...');
    
    let users;
    let error = null;
    
    try {
      users = await userService.findAll();
      console.log(`🔍 DEBUG ADMIN USERS: findAll() returned: ${users ? users.length : 'null/undefined'} users`);
      
      if (users && users.length > 0) {
        console.log('🔍 DEBUG ADMIN USERS: First user sample:', {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          plan: users[0].plan,
          hasPassword: !!users[0].password
        });
      }
    } catch (err) {
      console.error('❌ DEBUG ADMIN USERS: Error in findAll():', err);
      error = err instanceof Error ? err.message : String(err);
    }
    
    // Probar query directa si es PostgreSQL
    let directQueryResult = null;
    if (usePostgres && process.env.DATABASE_URL) {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: false
        });
        
        console.log('🔍 DEBUG ADMIN USERS: Testing direct PostgreSQL query...');
        const client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) as count FROM users');
        directQueryResult = {
          count: parseInt(result.rows[0].count),
          success: true
        };
        console.log(`🔍 DEBUG ADMIN USERS: Direct query found ${directQueryResult.count} users`);
        client.release();
        await pool.end();
      } catch (dbErr) {
        console.error('❌ DEBUG ADMIN USERS: Direct query error:', dbErr);
        directQueryResult = {
          error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          success: false
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: envInfo,
        adapter: {
          isProduction,
          hasPostgresUrl,
          usePostgres,
          databaseEngine: usePostgres ? 'PostgreSQL' : 'SQLite'
        },
        userService: {
          userCount: users ? users.length : 0,
          error,
          firstUser: users && users.length > 0 ? {
            id: users[0].id,
            email: users[0].email,
            name: users[0].name
          } : null
        },
        directQuery: directQueryResult,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ DEBUG ADMIN USERS: Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}