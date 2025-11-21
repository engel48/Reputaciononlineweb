/**
 * Endpoint de diagnóstico para verificar configuración de TikTok
 * NO EXPONE SECRETS - Solo verifica que existen
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    TIKTOK_CLIENT_KEY: {
      exists: !!process.env.TIKTOK_CLIENT_KEY,
      value: process.env.TIKTOK_CLIENT_KEY ? `${process.env.TIKTOK_CLIENT_KEY.substring(0, 8)}...` : 'NOT SET',
      length: process.env.TIKTOK_CLIENT_KEY?.length || 0
    },
    NEXT_PUBLIC_TIKTOK_CLIENT_KEY: {
      exists: !!process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY,
      value: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY ? `${process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY.substring(0, 8)}...` : 'NOT SET',
      length: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY?.length || 0
    },
    TIKTOK_CLIENT_SECRET: {
      exists: !!process.env.TIKTOK_CLIENT_SECRET,
      value: process.env.TIKTOK_CLIENT_SECRET ? '***SECRET SET***' : 'NOT SET',
      length: process.env.TIKTOK_CLIENT_SECRET?.length || 0
    },
    NEXTAUTH_URL: {
      exists: !!process.env.NEXTAUTH_URL,
      value: process.env.NEXTAUTH_URL || 'NOT SET'
    },
    NODE_ENV: {
      exists: true,
      value: process.env.NODE_ENV
    }
  };

  const allConfigured =
    checks.TIKTOK_CLIENT_KEY.exists &&
    checks.TIKTOK_CLIENT_SECRET.exists &&
    checks.NEXTAUTH_URL.exists;

  return NextResponse.json({
    configured: allConfigured,
    checks,
    redirectUri: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/tiktok/callback`,
    message: allConfigured
      ? '✅ Configuración completa'
      : '❌ Faltan variables de entorno'
  });
}
