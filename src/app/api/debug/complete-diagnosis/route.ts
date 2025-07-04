import { NextRequest, NextResponse } from 'next/server';
import { userService, systemSettingsService } from '@/lib/database-adapter';

export async function GET(request: NextRequest) {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    services: {},
    directTests: {},
    errors: []
  };

  try {
    console.log('🔍 COMPLETE DIAGNOSIS: Iniciando diagnóstico completo...');
    
    // 1. ENVIRONMENT ANALYSIS
    console.log('🔍 Step 1: Analyzing environment...');
    diagnosis.environment = {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      databaseUrlExists: !!process.env.DATABASE_URL,
      databaseUrlType: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 
                      process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'Unknown',
      databaseUrlPreview: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 'Not set',
      jwtSecretExists: !!process.env.JWT_SECRET,
      nextAuthUrlExists: !!process.env.NEXTAUTH_URL
    };

    // 2. DATABASE ADAPTER ANALYSIS
    console.log('🔍 Step 2: Analyzing database adapter logic...');
    const isProduction = process.env.NODE_ENV === 'production';
    const hasPostgresUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
    const usePostgres = isProduction && hasPostgresUrl;
    
    diagnosis.database = {
      isProduction,
      hasPostgresUrl,
      usePostgres,
      selectedEngine: usePostgres ? 'PostgreSQL' : 'SQLite',
      adapterLogic: {
        condition: 'isProduction && hasPostgresUrl',
        isProduction,
        hasPostgresUrl,
        result: usePostgres
      }
    };

    // 3. USER SERVICE TEST
    console.log('🔍 Step 3: Testing userService...');
    try {
      const users = await userService.findAll();
      diagnosis.services.userService = {
        success: true,
        userCount: users ? users.length : 0,
        hasUsers: !!(users && users.length > 0),
        firstUserSample: users && users.length > 0 ? {
          id: users[0].id,
          email: users[0].email,
          name: users[0].name,
          plan: users[0].plan,
          hasPassword: !!users[0].password // Should be false (filtered out)
        } : null
      };
    } catch (userServiceError) {
      diagnosis.services.userService = {
        success: false,
        error: userServiceError instanceof Error ? userServiceError.message : String(userServiceError)
      };
      diagnosis.errors.push(`UserService Error: ${userServiceError}`);
    }

    // 4. SYSTEM SETTINGS TEST
    console.log('🔍 Step 4: Testing systemSettingsService...');
    try {
      const settings = await systemSettingsService.getAll();
      diagnosis.services.systemSettingsService = {
        success: true,
        settingsCount: settings ? settings.length : 0,
        hasSettings: !!(settings && settings.length > 0),
        settingsSample: settings && settings.length > 0 ? settings.slice(0, 2) : null
      };
    } catch (settingsError) {
      diagnosis.services.systemSettingsService = {
        success: false,
        error: settingsError instanceof Error ? settingsError.message : String(settingsError)
      };
      diagnosis.errors.push(`SystemSettingsService Error: ${settingsError}`);
    }

    // 5. DIRECT DATABASE TESTS
    console.log('🔍 Step 5: Testing direct database connections...');
    
    // Test PostgreSQL if configured
    if (diagnosis.environment.databaseUrlExists && diagnosis.environment.databaseUrlType === 'PostgreSQL') {
      try {
        const { Pool } = require('pg');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: false
        });
        
        const client = await pool.connect();
        
        // Test basic connection
        const versionResult = await client.query('SELECT version()');
        
        // Test users table
        const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
        const usersCount = parseInt(usersResult.rows[0].count);
        
        // Test system_settings table
        const settingsResult = await client.query('SELECT COUNT(*) as count FROM system_settings');
        const settingsCount = parseInt(settingsResult.rows[0].count);
        
        // Test sample user
        const sampleUserResult = await client.query('SELECT id, email, name, plan FROM users LIMIT 1');
        
        diagnosis.directTests.postgresql = {
          success: true,
          connection: 'OK',
          version: versionResult.rows[0].version.split(' ')[1], // Just version number
          usersCount,
          settingsCount,
          sampleUser: sampleUserResult.rows[0] || null
        };
        
        client.release();
        await pool.end();
        
      } catch (pgError) {
        diagnosis.directTests.postgresql = {
          success: false,
          error: pgError instanceof Error ? pgError.message : String(pgError)
        };
        diagnosis.errors.push(`PostgreSQL Direct Test Error: ${pgError}`);
      }
    }

    // Test SQLite fallback
    try {
      const Database = require('better-sqlite3');
      const dbPath = '/app/data/app.db';
      const fs = require('fs');
      
      diagnosis.directTests.sqlite = {
        dbPath,
        fileExists: fs.existsSync(dbPath),
        fileSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0
      };
      
      if (fs.existsSync(dbPath)) {
        const db = Database(dbPath, { readonly: true });
        
        const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
        const sampleUser = db.prepare('SELECT id, email, name, plan FROM users LIMIT 1').get();
        
        diagnosis.directTests.sqlite = {
          ...diagnosis.directTests.sqlite,
          success: true,
          usersCount,
          sampleUser: sampleUser || null
        };
        
        db.close();
      }
    } catch (sqliteError) {
      diagnosis.directTests.sqlite = {
        success: false,
        error: sqliteError instanceof Error ? sqliteError.message : String(sqliteError)
      };
    }

    // 6. FINAL ANALYSIS
    console.log('🔍 Step 6: Generating recommendations...');
    diagnosis.recommendations = [];
    
    if (!diagnosis.services.userService?.success) {
      diagnosis.recommendations.push('UserService is failing - check database connection');
    }
    
    if (diagnosis.services.userService?.userCount === 0) {
      diagnosis.recommendations.push('UserService returns 0 users - check if using correct database');
    }
    
    if (diagnosis.database.selectedEngine === 'SQLite' && diagnosis.environment.databaseUrlExists) {
      diagnosis.recommendations.push('Using SQLite despite DATABASE_URL being set - check NODE_ENV');
    }
    
    if (diagnosis.directTests.postgresql?.usersCount !== diagnosis.services.userService?.userCount) {
      diagnosis.recommendations.push('Mismatch between direct PostgreSQL count and userService count');
    }

    console.log('✅ COMPLETE DIAGNOSIS: Completed successfully');
    
    return NextResponse.json({
      success: true,
      diagnosis
    });

  } catch (error) {
    console.error('❌ COMPLETE DIAGNOSIS: Fatal error:', error);
    diagnosis.errors.push(`Fatal Error: ${error}`);
    
    return NextResponse.json({
      success: false,
      diagnosis,
      fatalError: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}