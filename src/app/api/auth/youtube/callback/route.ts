import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>YouTube OAuth Callback</title>
    </head>
    <body>
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Procesando autenticación de YouTube...</h2>
        <p>Esta ventana se cerrará automáticamente.</p>
      </div>
      <script>
        (function() {
          try {
            console.log('🎬 YouTube Callback: Procesando...');
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');

            console.log('📋 Params:', { code: !!code, state: !!state, error });

            if (error) {
              console.error('❌ OAuth error:', error);
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'youtube',
                error: errorDescription || error
              }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            } else if (code) {
              // Intercambiar código por token
              console.log('🔄 Intercambiando código...');
              fetch('/api/auth/youtube', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, state })
              })
              .then(response => {
                console.log('📥 Response status:', response.status);
                return response.json();
              })
              .then(data => {
                console.log('📦 Response data:', data);
                if (data.success) {
                  console.log('✅ OAuth exitoso!');
                  window.opener.postMessage({
                    type: 'oauth_success',
                    platform: 'youtube',
                    profile: data.profile
                  }, window.location.origin);
                  setTimeout(() => window.close(), 1000);
                } else {
                  console.error('❌ Error en respuesta:', data.error);
                  window.opener.postMessage({
                    type: 'oauth_error',
                    platform: 'youtube',
                    error: data.error || 'Error de autenticación'
                  }, window.location.origin);
                  setTimeout(() => window.close(), 2000);
                }
              })
              .catch(err => {
                console.error('❌ Fetch error:', err);
                window.opener.postMessage({
                  type: 'oauth_error',
                  platform: 'youtube',
                  error: 'Error procesando autenticación'
                }, window.location.origin);
                setTimeout(() => window.close(), 2000);
              });
            } else {
              console.error('❌ No code received');
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'youtube',
                error: 'No se recibió código de autorización'
              }, window.location.origin);
              setTimeout(() => window.close(), 1000);
            }
          } catch (e) {
            console.error('❌ Callback error:', e);
            window.opener.postMessage({
              type: 'oauth_error',
              platform: 'youtube',
              error: 'Error en callback'
            }, window.location.origin);
            setTimeout(() => window.close(), 1000);
          }
        })();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
