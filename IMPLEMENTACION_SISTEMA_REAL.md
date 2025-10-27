# IMPLEMENTACIÓN SISTEMA 100% REAL - ELIMINACIÓN DE SIMULACIONES

## 📋 RESUMEN EJECUTIVO

Este documento detalla la eliminación completa de todas las simulaciones del sistema y la implementación de integraciones REALES con APIs de terceros.

**Estado:** 🔧 EN PROGRESO
**Fecha inicio:** 26 de octubre de 2025
**Responsable:** Backend Architect

---

## ✅ COMPLETADO

### 1. Servicio de Encriptación AES-256-GCM

**Archivo:** `/src/lib/encryption.ts`

**Funcionalidades:**
- ✅ Encriptación de tokens OAuth con AES-256-GCM
- ✅ Desencriptación segura con verificación de integridad
- ✅ Generación de claves usando PBKDF2 con 100,000 iteraciones
- ✅ Formato de salida: `iv:authTag:encrypted`

**Uso:**
```typescript
import { encryptToken, decryptToken } from '@/lib/encryption';

const encrypted = encryptToken('mi-access-token-secreto');
// Resultado: "a1b2c3d4:e5f6g7h8:i9j0k1l2..."

const decrypted = decryptToken(encrypted);
// Resultado: "mi-access-token-secreto"
```

### 2. Servicio de Almacenamiento OAuth en Supabase

**Archivo:** `/src/lib/oauth-storage.ts`

**Funcionalidades:**
- ✅ Guardado de tokens encriptados en Supabase
- ✅ Recuperación y desencriptación automática
- ✅ Verificación de expiración de tokens
- ✅ Actualización de tokens después de refresh
- ✅ Desconexión segura de plataformas

**Funciones principales:**
```typescript
// Guardar conexión OAuth
await saveOAuthConnection({
  userId: 'user-123',
  platform: 'facebook',
  accessToken: 'token-real',
  refreshToken: 'refresh-token',
  expiresAt: new Date('2025-12-31'),
  profile: { id: 'fb-123', name: 'Usuario' }
});

// Obtener access token
const token = await getAccessToken('user-123', 'facebook');

// Verificar si está conectado
const connected = await isConnected('user-123', 'facebook');
```

### 3. Facebook OAuth Callback REAL

**Archivo:** `/src/app/api/auth/facebook/callback/route.ts`

**Implementación:**
- ✅ Intercambio de código por access token usando Graph API v21.0
- ✅ Obtención de perfil del usuario (id, name, email, picture)
- ✅ Almacenamiento encriptado en Supabase
- ✅ Manejo de errores con redirects apropiados
- ✅ Verificación de usuario autenticado mediante JWT

**Flujo:**
1. Usuario autenticado en sistema (verificación JWT)
2. Intercambio de código OAuth por access token
3. Obtención de perfil desde Facebook Graph API
4. Encriptación de token con AES-256-GCM
5. Guardado en tabla `social_media` de Supabase
6. Redirect a dashboard con mensaje de éxito

### 4. Twitter/X OAuth Callback REAL

**Archivo:** `/src/app/api/auth/twitter/callback/route.ts`

**Implementación:**
- ✅ OAuth 2.0 con PKCE (Proof Key for Code Exchange)
- ✅ Basic Authentication con client_id:client_secret
- ✅ Obtención de perfil con API v2 de Twitter
- ✅ Almacenamiento de access_token y refresh_token
- ✅ Extracción de métricas públicas (followers_count)

**Endpoints utilizados:**
- `POST https://api.twitter.com/2/oauth2/token` - Token exchange
- `GET https://api.twitter.com/2/users/me` - User profile

### 5. Actualización de .env.example

**Archivo:** `/.env.example`

**Credenciales agregadas:**
- ✅ NEWS_API_KEY - News API (gratis 100 requests/día)
- ✅ GNEWS_API_KEY - GNews API (gratis 100 requests/día)
- ✅ MEDIASTACK_API_KEY - MediaStack API ($49/mes)
- ✅ ENCRYPTION_SECRET - Para encriptación de tokens
- ✅ Instrucciones detalladas para configuración OAuth

---

## 🚧 PENDIENTE

### 1. LinkedIn OAuth Callback

**Archivo a crear:** `/src/app/api/auth/linkedin/callback/route.ts`

**Especificación:**
```typescript
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

// Token endpoint
POST https://www.linkedin.com/oauth/v2/accessToken
{
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: REDIRECT_URI,
  client_id: LINKEDIN_CLIENT_ID,
  client_secret: LINKEDIN_CLIENT_SECRET
}

// Profile endpoint
GET https://api.linkedin.com/v2/me
GET https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))
```

### 2. YouTube OAuth Callback

**Archivo a crear:** `/src/app/api/auth/youtube/callback/route.ts`

**Especificación:**
```typescript
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;

// Token endpoint (Google OAuth)
POST https://oauth2.googleapis.com/token
{
  code: code,
  client_id: YOUTUBE_CLIENT_ID,
  client_secret: YOUTUBE_CLIENT_SECRET,
  redirect_uri: REDIRECT_URI,
  grant_type: 'authorization_code'
}

// Channel info endpoint
GET https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true
Authorization: Bearer {access_token}
```

### 3. Reemplazar realNewsAPI.ts con News API Real

**Archivo a modificar:** `/src/lib/realNewsAPI.ts`

**Estrategia:**
```typescript
// Prioridad 1: News API
async function searchWithNewsAPI(query: string) {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${query}&language=es&apiKey=${NEWS_API_KEY}`
  );
  return response.json();
}

// Prioridad 2: GNews API
async function searchWithGNews(query: string) {
  const response = await fetch(
    `https://gnews.io/api/v4/search?q=${query}&lang=es&token=${GNEWS_API_KEY}`
  );
  return response.json();
}

// Prioridad 3: Scraping directo de medios colombianos
async function scrapColombianMedia(query: string) {
  const sources = [
    'https://www.eltiempo.com/buscar/' + query,
    'https://www.semana.com/buscar/' + query,
    'https://www.elespectador.com/buscar/' + query
  ];
  // Usar cheerio para extraer noticias reales
}

// Función principal con fallback
export async function searchRealNews(query: string) {
  try {
    if (NEWS_API_KEY) return await searchWithNewsAPI(query);
  } catch (e) {}

  try {
    if (GNEWS_API_KEY) return await searchWithGNews(query);
  } catch (e) {}

  return await scrapColombianMedia(query);
}
```

### 4. Eliminar Simulaciones de /oauth-login

**Archivo a modificar:** `/src/app/oauth-login/page.tsx`

**Cambios necesarios:**
- ❌ Eliminar líneas 120-122 (setTimeout que fuerza error)
- ✅ Redirigir directamente a OAuth real de cada plataforma
- ✅ Implementar URLs de autorización reales

**Código a implementar:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // URLs reales de OAuth
  const authUrls = {
    facebook: `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${CALLBACK_URI}&scope=email,public_profile,pages_show_list`,

    twitter: `https://twitter.com/i/oauth2/authorize?client_id=${TWITTER_CLIENT_ID}&redirect_uri=${CALLBACK_URI}&scope=tweet.read%20users.read%20offline.access&response_type=code&code_challenge=challenge&code_challenge_method=plain`,

    linkedin: `https://www.linkedin.com/oauth/v2/authorization?client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${CALLBACK_URI}&scope=r_liteprofile%20r_emailaddress&response_type=code`,

    youtube: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${CALLBACK_URI}&scope=https://www.googleapis.com/auth/youtube.readonly&response_type=code&access_type=offline`
  };

  // Redirigir a OAuth real
  window.location.href = authUrls[platform];
};
```

### 5. Actualizar OAuthManager para Supabase

**Archivo a modificar:** `/src/lib/oauth/manager.ts`

**Cambios necesarios:**
- ❌ Eliminar línea 34: `private connections: Map<string, UserSocialData> = new Map();`
- ✅ Reemplazar todas las operaciones de Map con llamadas a Supabase
- ✅ Usar `oauth-storage.ts` para persistencia

**Implementación:**
```typescript
import { saveOAuthConnection, getAccessToken, isConnected } from '@/lib/oauth-storage';
import { supabase } from '@/lib/supabase-server';

export class SocialOAuthManager {
  async connectSocialNetwork(userId: string, platform: SocialPlatform, ...) {
    // Obtener datos del perfil según la plataforma
    const profileData = await this.getProfileData(platform, accessToken);

    // Guardar en Supabase (reemplaza Map)
    await saveOAuthConnection({
      userId,
      platform,
      accessToken,
      refreshToken,
      expiresAt,
      profile: profileData
    });
  }

  async getUserConnections(userId: string) {
    // Obtener desde Supabase (reemplaza Map.get)
    const { data } = await supabase
      .from('social_media')
      .select('*')
      .eq('user_id', userId);

    return data;
  }
}
```

---

## 🔐 CONFIGURACIÓN REQUERIDA

### Variables de Entorno Críticas

**Supabase (ya configurado):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://shiqwhbodviimvpxpszd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
```

**OAuth Credentials (PENDIENTE configurar):**
```bash
# Facebook
FACEBOOK_CLIENT_ID=tu-facebook-app-id
FACEBOOK_CLIENT_SECRET=tu-facebook-app-secret

# Twitter
TWITTER_CLIENT_ID=tu-twitter-client-id
TWITTER_CLIENT_SECRET=tu-twitter-client-secret

# LinkedIn
LINKEDIN_CLIENT_ID=tu-linkedin-client-id
LINKEDIN_CLIENT_SECRET=tu-linkedin-client-secret

# YouTube/Google
YOUTUBE_CLIENT_ID=tu-youtube-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=tu-youtube-client-secret
```

**News APIs (PENDIENTE configurar):**
```bash
NEWS_API_KEY=tu-newsapi-key        # Gratis en newsapi.org
GNEWS_API_KEY=tu-gnews-key         # Gratis en gnews.io
MEDIASTACK_API_KEY=tu-mediastack-key  # Pago en mediastack.com
```

**Encriptación:**
```bash
ENCRYPTION_SECRET=$(openssl rand -base64 32)
```

### Configuración de Redirect URIs

**En Facebook Developers:**
1. Ir a https://developers.facebook.com/apps/
2. Seleccionar tu app
3. Settings → Basic → App Domains: `tu-dominio.com`
4. Facebook Login → Settings → Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/facebook/callback`
   - `https://tu-dominio.com/api/auth/facebook/callback`

**En Twitter Developer Portal:**
1. Ir a https://developer.twitter.com/en/portal/dashboard
2. Seleccionar tu app
3. App settings → Authentication settings:
   - Callback URL: `https://tu-dominio.com/api/auth/twitter/callback`
   - Website URL: `https://tu-dominio.com`

**En LinkedIn Developers:**
1. Ir a https://www.linkedin.com/developers/apps
2. Seleccionar tu app
3. Auth → OAuth 2.0 settings → Redirect URLs:
   - `http://localhost:3000/api/auth/linkedin/callback`
   - `https://tu-dominio.com/api/auth/linkedin/callback`

**En Google Cloud Console:**
1. Ir a https://console.cloud.google.com/apis/credentials
2. Seleccionar tu proyecto
3. OAuth 2.0 Client IDs → Editar
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/youtube/callback`
   - `https://tu-dominio.com/api/auth/youtube/callback`

---

## 📊 DIAGRAMA DE FLUJO OAUTH REAL

```
Usuario                  Frontend              Backend               Plataforma Externa
   |                        |                     |                         |
   |--[1. Click Connect]--->|                     |                         |
   |                        |--[2. GET /oauth]--->|                         |
   |                        |                     |--[3. Redirect Auth]---->|
   |                        |                     |                         |
   |<--------------[4. Pantalla de autorización]------------------------|
   |                        |                     |                         |
   |--[5. Autorizar]------->|                     |                         |
   |                        |                     |<--[6. Redirect + code]--|
   |                        |                     |                         |
   |                        |                     |--[7. POST /token]------>|
   |                        |                     |<--[8. access_token]-----|
   |                        |                     |                         |
   |                        |                     |--[9. GET /profile]----->|
   |                        |                     |<--[10. user_data]-------|
   |                        |                     |                         |
   |                        |                     |--[11. Encrypt token]--->|Supabase
   |                        |                     |--[12. Save DB]--------->|
   |                        |<--[13. Redirect]---|                         |
   |<--[14. Success]--------|                     |                         |
```

---

## 🧪 TESTING

### Pruebas Manuales

**1. Encriptación:**
```bash
node -e "
const { encryptToken, decryptToken } = require('./src/lib/encryption.ts');
const token = 'test-token-123';
const encrypted = encryptToken(token);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decryptToken(encrypted));
console.log('Match:', token === decryptToken(encrypted));
"
```

**2. Facebook OAuth:**
1. Iniciar servidor: `npm run dev`
2. Ir a: `http://localhost:3000/dashboard/redes-sociales`
3. Click en "Conectar Facebook"
4. Autorizar en Facebook
5. Verificar redirect exitoso
6. Verificar en Supabase que el token está encriptado

**3. News API:**
```bash
curl "https://newsapi.org/v2/everything?q=Colombia&language=es&apiKey=${NEWS_API_KEY}"
```

### Comandos Útiles

```bash
# Verificar configuración de Supabase
npm run validate:supabase

# Ver tokens guardados (encriptados)
npx supabase db query "SELECT user_id, platform, connected, token_expiry FROM social_media"

# Generar secret de encriptación
openssl rand -base64 32
```

---

## 🚀 PRÓXIMOS PASOS

1. **Completar callbacks OAuth restantes:**
   - LinkedIn callback
   - YouTube callback
   - Instagram callback (si se requiere)

2. **Implementar News API real:**
   - Reemplazar `/src/lib/realNewsAPI.ts`
   - Implementar fallback a scraping
   - Cache de resultados (15 min TTL)

3. **Eliminar oauth-login simulado:**
   - Modificar `/src/app/oauth-login/page.tsx`
   - Redirigir a OAuth real de plataforma

4. **Actualizar OAuthManager:**
   - Eliminar Map, usar Supabase
   - Implementar refresh de tokens
   - Agregar validación de expiración

5. **Testing exhaustivo:**
   - Pruebas de integración OAuth
   - Pruebas de encriptación/desencriptación
   - Pruebas de News APIs
   - Pruebas de error handling

6. **Documentación:**
   - Video tutorial de configuración OAuth
   - Guía de troubleshooting
   - FAQ de credenciales

---

## 📝 NOTAS IMPORTANTES

- **NUNCA** commitear credenciales reales
- Usar `.env.local` para desarrollo
- Configurar variables en plataforma de hosting para producción
- Rotar secrets cada 90 días
- Todos los tokens se encriptan antes de guardarse
- Rate limits de APIs deben respetarse estrictamente
- Implementar circuit breaker para APIs externas
- Logs sensibles NO deben incluir tokens completos

---

## 🔗 RECURSOS

**Documentación OAuth:**
- Facebook: https://developers.facebook.com/docs/facebook-login/web
- Twitter: https://developer.twitter.com/en/docs/authentication/oauth-2-0
- LinkedIn: https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication
- YouTube: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps

**News APIs:**
- News API: https://newsapi.org/docs
- GNews: https://gnews.io/docs/v4
- MediaStack: https://mediastack.com/documentation

**Seguridad:**
- OWASP OAuth: https://cheatsheetseries.owasp.org/cheatsheets/OAuth_2_0_Cheat_Sheet.html
- Encriptación AES-GCM: https://nodejs.org/api/crypto.html#crypto_crypto_createcipheriv_algorithm_key_iv_options

---

**Última actualización:** 26 de octubre de 2025
**Estado:** 40% completado
**Prioridad:** ALTA - Crítico para producción
