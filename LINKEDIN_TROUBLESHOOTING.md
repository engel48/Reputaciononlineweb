# GUÍA DE TROUBLESHOOTING: INTEGRACIÓN LINKEDIN OAUTH

**Fecha:** 2025-11-21
**Componente:** LinkedIn OAuth Integration
**Versión:** 1.0

---

## ÍNDICE

1. [Problemas Comunes en OAuth Flow](#1-problemas-comunes-en-oauth-flow)
2. [Errores de Token](#2-errores-de-token)
3. [Problemas de Sincronización](#3-problemas-de-sincronización)
4. [Errores de Base de Datos](#4-errores-de-base-de-datos)
5. [Problemas de Performance](#5-problemas-de-performance)
6. [Debugging Tools](#6-debugging-tools)

---

## 1. PROBLEMAS COMUNES EN OAUTH FLOW

### 1.1 Error: "redirect_uri_mismatch"

**Síntoma:**
LinkedIn muestra error: "The redirect_uri in the authorization request does not match one of the authorized redirect URIs."

**Causa:**
El Redirect URI configurado en LinkedIn Developer Portal no coincide con el usado en la aplicación.

**Solución:**

1. **Verificar Redirect URI en Código:**
   ```typescript
   // Debe ser exactamente:
   const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`;

   // Ejemplo desarrollo:
   // http://localhost:3000/api/auth/linkedin/callback

   // Ejemplo producción:
   // https://tudominio.com/api/auth/linkedin/callback
   ```

2. **Verificar en LinkedIn Developer Portal:**
   - Ir a: https://www.linkedin.com/developers/apps
   - Seleccionar tu aplicación
   - Tab "Auth" → "Redirect URLs"
   - Debe incluir EXACTAMENTE:
     - `http://localhost:3000/api/auth/linkedin/callback` (desarrollo)
     - `https://tudominio.com/api/auth/linkedin/callback` (producción)

3. **Verificar Variable de Entorno:**
   ```bash
   # .env.local
   NEXTAUTH_URL=http://localhost:3000  # Desarrollo
   # o
   NEXTAUTH_URL=https://tudominio.com  # Producción
   ```

4. **Verificar que NO hay espacios o caracteres extra:**
   ```bash
   # ❌ INCORRECTO
   NEXTAUTH_URL=http://localhost:3000/  # Barra final extra

   # ✅ CORRECTO
   NEXTAUTH_URL=http://localhost:3000
   ```

---

### 1.2 Error: "invalid_client_id"

**Síntoma:**
LinkedIn rechaza OAuth con mensaje "invalid_client_id"

**Causa:**
Client ID incorrecto o no configurado.

**Solución:**

1. **Verificar Client ID en .env.local:**
   ```bash
   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=tu_client_id_aqui
   ```

2. **Verificar en LinkedIn Developer Portal:**
   - Tab "Auth" → "Application credentials"
   - Copiar "Client ID" exactamente (sin espacios)

3. **Verificar en Código:**
   ```typescript
   console.log('Client ID:', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID);
   // NO debe ser undefined o vacío
   ```

4. **Reiniciar Servidor:**
   ```bash
   # Next.js necesita reinicio para cargar nuevas env vars
   npm run dev
   ```

---

### 1.3 Error: "No se recibió código de autorización"

**Síntoma:**
Callback muestra error: `?error=no_code`

**Causa:**
Usuario canceló OAuth o hubo error en LinkedIn.

**Solución:**

1. **Verificar si Usuario Canceló:**
   - Si usuario hizo click "Cancel" en LinkedIn, es comportamiento esperado
   - Mostrar mensaje: "Autorización cancelada. Intenta de nuevo."

2. **Verificar Parámetro `error` en URL:**
   ```typescript
   const error = searchParams.get('error');
   const errorDescription = searchParams.get('error_description');

   console.log('LinkedIn error:', error, errorDescription);
   // Ejemplos:
   // - "access_denied" → Usuario canceló
   // - "server_error" → Error de LinkedIn
   ```

3. **Verificar Scopes:**
   - Asegurar que scopes solicitados estén aprobados
   - Scopes básicos: `openid profile email`
   - Verificar en Developer Portal → "Products"

---

### 1.4 Error: "invalid_grant" al Intercambiar Código por Token

**Síntoma:**
LinkedIn API responde con error "invalid_grant" cuando se intenta intercambiar código por token.

**Causa:**
Código de autorización expiró (10 minutos) o ya se usó.

**Solución:**

1. **Verificar Tiempo:**
   - Códigos de autorización expiran en 10 minutos
   - Si hay debugging que toma mucho tiempo, el código puede expirar

2. **Verificar que NO se Reutiliza Código:**
   ```typescript
   // ❌ INCORRECTO: Intentar usar mismo código dos veces
   const tokenResponse1 = await fetch(tokenUrl, { body: params });
   const tokenResponse2 = await fetch(tokenUrl, { body: params }); // Falla

   // ✅ CORRECTO: Usar código una sola vez
   const tokenResponse = await fetch(tokenUrl, { body: params });
   ```

3. **Verificar Redirect URI Coincide:**
   ```typescript
   // DEBE ser exactamente el mismo en:
   // 1. URL de autorización inicial
   // 2. Request de token exchange

   const tokenParams = new URLSearchParams({
     redirect_uri: REDIRECT_URI, // ✅ Mismo valor
     // ...
   });
   ```

4. **Reintentar OAuth desde Inicio:**
   - Si código expiró, iniciar nuevo flujo OAuth completo

---

## 2. ERRORES DE TOKEN

### 2.1 Error: "Token expirado"

**Síntoma:**
Sync o Dashboard fallan con error 401 de LinkedIn API.

**Causa:**
Access token expiró (60 días de validez).

**Solución:**

1. **Verificar Expiración en DB:**
   ```sql
   SELECT
     token_expiry,
     NOW() as current_time,
     token_expiry < NOW() as is_expired
   FROM social_media
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Reconectar LinkedIn:**
   - Usuario debe hacer OAuth flow nuevamente
   - LinkedIn NO provee refresh tokens en OAuth 2.0
   - UI debe mostrar: "Tu conexión con LinkedIn expiró. Por favor reconecta."

3. **Implementar Notificación Proactiva:**
   ```typescript
   // Verificar si token expira pronto (< 7 días)
   const expiryDate = new Date(socialMedia.token_expiry);
   const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

   if (daysUntilExpiry < 7) {
     // Mostrar warning en UI
     console.warn(`Token expira en ${daysUntilExpiry.toFixed(0)} días`);
   }
   ```

---

### 2.2 Error: "No hay access token disponible"

**Síntoma:**
Sync endpoint retorna error "No hay access token disponible".

**Causa:**
- LinkedIn nunca se conectó
- Conexión fue desconectada manualmente
- Token fue eliminado de DB

**Solución:**

1. **Verificar Estado de Conexión:**
   ```sql
   SELECT
     connected,
     access_token IS NOT NULL as has_token
   FROM social_media
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Verificar en UI:**
   - Estado de LinkedIn debe ser "Conectado"
   - Si muestra "Desconectado", hacer OAuth flow

3. **Verificar Logs:**
   ```
   ❌ LinkedIn no está conectado
   ```

---

### 2.3 Error de Desencriptación

**Síntoma:**
Error al desencriptar token: "Invalid authentication tag" o similar.

**Causa:**
- `ENCRYPTION_KEY` cambió después de guardar tokens
- Datos de encriptación corruptos

**Solución:**

1. **Verificar ENCRYPTION_KEY:**
   ```bash
   # Debe ser el mismo que se usó para encriptar
   echo $ENCRYPTION_KEY
   # Debe tener exactamente 32 caracteres
   ```

2. **Si ENCRYPTION_KEY Cambió:**
   - Todos los tokens encriptados son irrecuperables
   - Usuarios deben reconectar LinkedIn
   - Limpiar tokens viejos:
   ```sql
   UPDATE social_media
   SET access_token = NULL, refresh_token = NULL, connected = false
   WHERE platform = 'linkedin';
   ```

3. **Prevenir en Futuro:**
   - NUNCA cambiar `ENCRYPTION_KEY` en producción
   - Guardar backup seguro de la key
   - Considerar rotación de keys con migración de datos

---

## 3. PROBLEMAS DE SINCRONIZACIÓN

### 3.1 Sync No Encuentra Posts

**Síntoma:**
Sync completa pero `posts_processed: 0`.

**Causa:**
- Usuario no tiene posts en LinkedIn
- API de LinkedIn no retorna posts
- Scopes insuficientes

**Solución:**

1. **Verificar que Usuario Tiene Posts:**
   - Ir a perfil de LinkedIn del usuario
   - Verificar que tiene posts públicos

2. **Verificar Scopes en Developer Portal:**
   - Debe tener: `r_organization_social` (para posts de páginas)
   - O: `w_member_social` (para posts personales)
   - Tab "Products" → Verificar "Share on LinkedIn" o "Sign In with LinkedIn"

3. **Verificar Response de API:**
   ```typescript
   console.log('Posts data:', postsData);
   // Si elements está vacío, verificar por qué
   ```

4. **Debugging:**
   ```typescript
   // Agregar temporalmente
   const postsResponse = await fetch('...ugcPosts...', { headers });
   const postsData = await postsResponse.json();
   console.log('LinkedIn API response:', JSON.stringify(postsData, null, 2));
   ```

---

### 3.2 Comentarios No Se Guardan

**Síntoma:**
`comments_processed > 0` pero `mentions_created: 0`.

**Causa:**
- Comentarios ya existen en DB (duplicados detectados)
- Error al guardar en Supabase

**Solución:**

1. **Verificar Duplicados:**
   ```sql
   SELECT COUNT(*) as total
   FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Verificar Logs de Insert:**
   ```
   ❌ Error guardando mention: [ERROR]
   ```

3. **Verificar Estructura de Tabla `mentions`:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'mentions';
   ```

4. **Si Tabla No Existe:**
   ```sql
   -- Crear tabla mentions
   CREATE TABLE mentions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     platform VARCHAR(50) NOT NULL,
     author_username VARCHAR(255),
     author_name VARCHAR(255),
     content TEXT,
     url TEXT,
     published_at TIMESTAMPTZ,
     likes INTEGER DEFAULT 0,
     shares INTEGER DEFAULT 0,
     comments INTEGER DEFAULT 0,
     metadata JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

---

### 3.3 Sync Muy Lento

**Síntoma:**
Sync toma > 60 segundos para 20 posts.

**Causa:**
- Muchos comentarios por post
- Rate limiting de LinkedIn API
- Network latency

**Solución:**

1. **Reducir Parámetros:**
   ```json
   {
     "maxPosts": 10,        // En lugar de 50
     "maxCommentsPerPost": 20,  // En lugar de 50
     "lookbackDays": 7      // En lugar de 30
   }
   ```

2. **Implementar Batching:**
   ```typescript
   // Procesar comentarios en paralelo (con límite)
   const commentPromises = comments.slice(0, 10).map(comment =>
     processComment(comment)
   );
   await Promise.all(commentPromises);
   ```

3. **Monitorear LinkedIn Rate Limits:**
   - LinkedIn tiene rate limits por día/hora
   - Response headers: `X-RateLimit-Remaining`
   - Si se alcanza límite, esperar y reintentar

---

## 4. ERRORES DE BASE DE DATOS

### 4.1 Error: "duplicate key value violates unique constraint"

**Síntoma:**
Error al guardar en `social_media`: "duplicate key value violates unique constraint 'social_media_user_id_platform_key'"

**Causa:**
Ya existe registro para `user_id + platform = linkedin`.

**Solución:**

1. **Verificar que se usa UPSERT:**
   ```typescript
   await supabase
     .from('social_media')
     .upsert({
       user_id: userId,
       platform: 'linkedin',
       // ...
     }, {
       onConflict: 'user_id,platform'  // ✅ IMPORTANTE
     });
   ```

2. **Si Error Persiste:**
   ```sql
   -- Verificar constraint existe
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'social_media';
   ```

---

### 4.2 Error: "relation 'social_media' does not exist"

**Síntoma:**
Query falla con error "relation 'social_media' does not exist"

**Causa:**
Tabla no existe en base de datos.

**Solución:**

1. **Verificar Supabase URL:**
   ```bash
   echo $SUPABASE_URL
   # Debe apuntar a proyecto correcto
   ```

2. **Crear Tabla:**
   ```sql
   -- En Supabase SQL Editor
   CREATE TABLE social_media (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL,
     platform VARCHAR(50) NOT NULL,
     username VARCHAR(255),
     profile_url TEXT,
     followers INTEGER DEFAULT 0,
     following INTEGER DEFAULT 0,
     posts INTEGER DEFAULT 0,
     engagement DECIMAL(5,2) DEFAULT 0,
     connected BOOLEAN DEFAULT false,
     last_sync TIMESTAMPTZ,
     access_token TEXT,
     refresh_token TEXT,
     token_expiry TIMESTAMPTZ,
     profile_data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(user_id, platform)
   );

   CREATE INDEX idx_social_media_user_platform ON social_media(user_id, platform);
   ```

---

### 4.3 Supabase Connection Timeout

**Síntoma:**
Queries fallan con timeout o "ECONNREFUSED"

**Causa:**
- Supabase no accesible
- Credenciales incorrectas
- Network issues

**Solución:**

1. **Verificar Supabase Status:**
   - Ir a: https://status.supabase.com/
   - Verificar si hay incidents

2. **Verificar Credenciales:**
   ```bash
   curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
   # Debe retornar 200 OK
   ```

3. **Verificar en Código:**
   ```typescript
   console.log('Supabase URL:', process.env.SUPABASE_URL);
   console.log('Anon Key:', process.env.SUPABASE_ANON_KEY?.substring(0, 20) + '...');
   ```

---

## 5. PROBLEMAS DE PERFORMANCE

### 5.1 Dashboard Carga Muy Lento

**Síntoma:**
`/api/linkedin/dashboard` toma > 5 segundos.

**Causa:**
- Muchas menciones en DB (> 1000)
- Queries no optimizadas
- No hay indexes

**Solución:**

1. **Crear Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_mentions_user_platform
   ON mentions(user_id, platform);

   CREATE INDEX IF NOT EXISTS idx_mentions_published_at
   ON mentions(published_at DESC);

   CREATE INDEX IF NOT EXISTS idx_mentions_sentiment
   ON mentions((metadata->>'sentiment'));
   ```

2. **Limitar Queries:**
   ```typescript
   // Ya implementado: .limit(50)
   const { data: recentMentions } = await supabase
     .from('mentions')
     .select('*')
     .limit(50);  // ✅ Limitar resultados
   ```

3. **Implementar Caching:**
   ```typescript
   // Cachear resultados por 5 minutos
   const cacheKey = `linkedin_dashboard_${userId}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   // ... generar dashboard
   await redis.setex(cacheKey, 300, JSON.stringify(dashboard));
   ```

---

### 5.2 OAuth Timeout

**Síntoma:**
Callback toma > 10 segundos y falla.

**Causa:**
- LinkedIn API lento
- Network issues
- DB slow

**Solución:**

1. **Aumentar Timeout (temporal):**
   ```typescript
   const tokenResponse = await fetch(tokenUrl, {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: tokenParams.toString(),
     signal: AbortSignal.timeout(10000)  // 10 segundos
   });
   ```

2. **Implementar Retry Logic:**
   ```typescript
   async function fetchWithRetry(url: string, options: any, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fetch(url, options);
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(r => setTimeout(r, 1000 * (i + 1)));
       }
     }
   }
   ```

---

## 6. DEBUGGING TOOLS

### 6.1 Verificar OAuth Flow Completo

```bash
# Script de debugging
curl -v -X POST http://localhost:3000/api/linkedin/sync \
  -H "Cookie: auth-token=YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxPosts": 5}'
```

### 6.2 Inspeccionar JWT Token

```javascript
// En Browser Console
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth-token='))
  ?.split('=')[1];

const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('JWT Payload:', decoded);
```

### 6.3 Ver Logs en Tiempo Real

```bash
# Terminal
npm run dev

# Logs aparecerán en tiempo real
# Buscar:
# - "💼 LinkedIn OAuth Callback recibido"
# - "🔄 LinkedIn Sync: Iniciando sincronización..."
# - "📊 LinkedIn Dashboard: Generando datos..."
```

### 6.4 Verificar Estado de Conexión

```sql
-- En Supabase SQL Editor
SELECT
  user_id,
  platform,
  connected,
  last_sync,
  token_expiry,
  token_expiry > NOW() as token_valid,
  EXTRACT(DAY FROM (token_expiry - NOW())) as days_until_expiry
FROM social_media
WHERE platform = 'linkedin'
ORDER BY last_sync DESC;
```

### 6.5 Test de Encriptación

```typescript
// /scripts/test-encryption.js
import { encryptToken, decryptToken } from '../src/lib/encryption';

const testToken = 'AQXTestToken123456789';
console.log('Original:', testToken);

const encrypted = encryptToken(testToken);
console.log('Encrypted:', encrypted);
console.log('Encrypted length:', encrypted.length);

const decrypted = decryptToken(encrypted);
console.log('Decrypted:', decrypted);

console.log('Match:', testToken === decrypted ? '✅ PASS' : '❌ FAIL');
```

---

## 7. CONTACTO Y SOPORTE

### Logs Importantes a Compartir

Si necesitas ayuda, incluye:

1. **Logs del servidor:**
   ```
   [Timestamp] 💼 LinkedIn OAuth Callback recibido
   [Timestamp] ❌ Error: [MENSAJE_ERROR]
   ```

2. **Variables de entorno (sin secrets):**
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXT_PUBLIC_LINKEDIN_CLIENT_ID=78xxxxx
   LINKEDIN_CLIENT_SECRET=<REDACTED>
   ```

3. **Estado de DB:**
   ```sql
   SELECT platform, connected, token_expiry FROM social_media WHERE user_id = 'xxx';
   ```

4. **Screenshots de errores en UI**

---

**Última actualización:** 2025-11-21
**Versión:** 1.0
