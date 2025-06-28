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
      <title>Instagram OAuth Callback</title>
    </head>
    <body>
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Procesando autenticación de Instagram...</h2>
        <p>Esta ventana se cerrará automáticamente.</p>
      </div>
      <script>
        (function() {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const error = urlParams.get('error');
            const errorDescription = urlParams.get('error_description');
            
            if (error) {
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'instagram',
                error: errorDescription || error
              }, window.location.origin);
            } else if (code) {
              // Intercambiar código por token
              fetch('/api/auth/instagram', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, state: '${state}' })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  window.opener.postMessage({
                    type: 'oauth_success',
                    platform: 'instagram',
                    profile: data.profile,
                    token: data.token
                  }, window.location.origin);
                } else {
                  window.opener.postMessage({
                    type: 'oauth_error',
                    platform: 'instagram',
                    error: data.error || 'Error de autenticación'
                  }, window.location.origin);
                }
              })
              .catch(err => {
                window.opener.postMessage({
                  type: 'oauth_error',
                  platform: 'instagram',
                  error: 'Error procesando autenticación'
                }, window.location.origin);
              });
            } else {
              window.opener.postMessage({
                type: 'oauth_error',
                platform: 'instagram',
                error: 'No se recibió código de autorización'
              }, window.location.origin);
            }
          } catch (e) {
            console.error('Error in callback:', e);
            window.opener.postMessage({
              type: 'oauth_error',
              platform: 'instagram',
              error: 'Error en callback'
            }, window.location.origin);
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
