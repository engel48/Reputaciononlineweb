/**
 * OAuth Callback Route Handler
 *
 * Maneja los callbacks de OAuth providers (Google, Facebook, Twitter, LinkedIn)
 * y redirige al usuario al dashboard o a la ruta especificada
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectTo = requestUrl.searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Intercambiar el código por una sesión
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error en callback de OAuth:', error)
      return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    }
  }

  // Redirigir al dashboard o a la ruta especificada
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
