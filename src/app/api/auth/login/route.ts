// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/services/authServiceReal';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 LOGIN: Iniciando proceso de login');
    
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 LOGIN: Datos recibidos:', { email, password: '***' });

    // Validaciones básicas
    if (!email || !password) {
      console.log('❌ LOGIN: Faltan email o password');
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔍 LOGIN: Llamando al servicio de autenticación...');
    // Intentar login
    const result = await login(email, password);
    console.log('🔍 LOGIN: Resultado del servicio:', { success: result.success, message: result.message, hasUser: !!result.user });
    
    if (result.user) {
      console.log('🔍 LOGIN: Datos del usuario:', { id: result.user.id, email: result.user.email, name: result.user.name });
    } else {
      console.log('❌ LOGIN: No se devolvió objeto usuario');
    }

    if (!result.success) {
      console.log('❌ LOGIN: Fallo en autenticación:', result.message);
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
      );
    }

    console.log('✅ LOGIN: Autenticación exitosa, configurando cookie...');
    
    // Configurar cookie con el token
    const responseData = {
      success: true,
      user: result.user,
      message: 'Login exitoso'
    };
    
    console.log('🔍 LOGIN: Datos de respuesta que se enviarán:', responseData);
    
    const response = NextResponse.json(responseData);

    if (result.token) {
      console.log('🔍 LOGIN: Estableciendo cookie auth-token');
      console.log('🔍 LOGIN: Token (primeros 20 chars):', result.token.substring(0, 20) + '...');
      
      // Detectar si estamos en producción o HTTPS
      const isProduction = process.env.NODE_ENV === 'production';
      const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') || isProduction;
      
      console.log('🔍 LOGIN: Entorno:', { 
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        isProduction,
        isSecure 
      });
      
      const cookieOptions = {
        httpOnly: true,
        secure: Boolean(isSecure),
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 // 7 días
      };
      
      console.log('🔍 LOGIN: Opciones de cookie:', cookieOptions);
      
      response.cookies.set('auth-token', result.token, cookieOptions);
      
      // Verificar que la cookie se estableció
      const setCookieHeader = response.headers.get('set-cookie');
      console.log('🔍 LOGIN: Header Set-Cookie:', setCookieHeader);
    } else {
      console.log('⚠️ LOGIN: No se generó token');
    }

    console.log('✅ LOGIN: Proceso completado exitosamente');
    return response;
  } catch (error) {
    console.error('💥 LOGIN ERROR:', error);
    console.error('💥 LOGIN ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 LOGIN ERROR MESSAGE:', error instanceof Error ? error.message : String(error));
    
    // Si es un error de base de datos en producción, devolver 503
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      return NextResponse.json(
        { success: false, message: 'Error de conexión a la base de datos' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
