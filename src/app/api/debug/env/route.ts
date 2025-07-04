import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG ENV: Verificando variables de entorno...');
    
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_TYPE: process.env.DATABASE_URL?.startsWith('postgres') ? 'PostgreSQL' : 'Other',
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 30) + '...' : 'Not set',
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
      
      // Información del adaptador de BD
      isProduction: process.env.NODE_ENV === 'production',
      hasPostgresUrl: process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'),
      usePostgres: (process.env.NODE_ENV === 'production') && 
                   (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')),
      
      // Información del proceso
      platform: process.platform,
      nodeVersion: process.version,
      cwd: process.cwd(),
      
      // Timestamp para tracking
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 DEBUG ENV: Información del entorno:', envInfo);
    
    return NextResponse.json({
      success: true,
      environment: envInfo
    });
  } catch (error) {
    console.error('❌ DEBUG ENV Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error obteniendo información del entorno' },
      { status: 500 }
    );
  }
}