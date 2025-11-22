# PLAN DE TESTING EXHAUSTIVO: INTEGRACIÓN LINKEDIN OAUTH

**Fecha:** 2025-11-21
**Componente:** LinkedIn OAuth Integration
**Prioridad:** CRÍTICA
**Estado:** Pendiente de Ejecución
**Ambiente:** Producción (Usuarios Colombianos)

---

## ÍNDICE

1. [Pre-Testing Validation](#1-pre-testing-validation)
2. [OAuth Flow Testing](#2-oauth-flow-testing)
3. [Data Storage Testing](#3-data-storage-testing)
4. [Sync Endpoint Testing](#4-sync-endpoint-testing)
5. [Dashboard Endpoint Testing](#5-dashboard-endpoint-testing)
6. [Error Handling Testing](#6-error-handling-testing)
7. [Security Testing](#7-security-testing)
8. [Performance Testing](#8-performance-testing)
9. [Production Readiness Checklist](#9-production-readiness-checklist)
10. [Test Execution Log](#10-test-execution-log)

---

## 1. PRE-TESTING VALIDATION

### 1.1 Archivos Implementados
**Objetivo:** Verificar que todos los archivos necesarios existan y estén completos.

**Archivos a Verificar:**

| Archivo | Ubicación | Estado | Notas |
|---------|-----------|--------|-------|
| LinkedIn OAuth Route | `/src/app/api/auth/linkedin/route.ts` | ❌ FALTANTE | Necesita crear endpoint inicial |
| LinkedIn Callback | `/src/app/api/auth/linkedin/callback/route.ts` | ✅ EXISTE | Implementado |
| LinkedIn OAuth Service | `/src/lib/oauth/linkedin.ts` | ✅ EXISTE | Implementado |
| LinkedIn Sync | `/src/app/api/linkedin/sync/route.ts` | ✅ EXISTE | Implementado |
| LinkedIn Dashboard | `/src/app/api/linkedin/dashboard/route.ts` | ✅ EXISTE | Implementado |
| OAuth Storage | `/src/lib/oauth-storage.ts` | ✅ EXISTE | Implementado |
| Encryption Service | `/src/lib/encryption.ts` | ⚠️ VERIFICAR | Verificar existencia |

**Pasos de Validación:**

```bash
# 1. Verificar que todos los archivos existen
ls -la /api/auth/linkedin/route.ts
ls -la /api/auth/linkedin/callback/route.ts
ls -la /src/lib/oauth/linkedin.ts
ls -la /api/linkedin/sync/route.ts
ls -la /api/linkedin/dashboard/route.ts

# 2. Verificar que no hay errores de TypeScript
npm run build

# 3. Verificar que el servidor inicia correctamente
npm run dev
```

**Criterios de Aceptación:**
- ✅ Todos los archivos existen
- ✅ No hay errores de compilación TypeScript
- ✅ El servidor Next.js inicia sin errores
- ✅ No hay warnings críticos en la consola

---

### 1.2 Variables de Entorno
**Objetivo:** Verificar que todas las credenciales estén configuradas.

**Variables Requeridas:**

```bash
# En .env.local
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=tu_client_id_aqui
LINKEDIN_CLIENT_SECRET=tu_client_secret_aqui
NEXTAUTH_URL=https://tudominio.com (o http://localhost:3000 en desarrollo)
JWT_SECRET=reputacion-online-secret-key-2025

# En Supabase / PostgreSQL
DATABASE_URL=postgresql://...
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
ENCRYPTION_KEY=tu_encryption_key_32_caracteres
```

**Pasos de Validación:**

```bash
# 1. Verificar que las variables están definidas
node -e "console.log('LINKEDIN_CLIENT_ID:', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ? '✅ CONFIGURADO' : '❌ FALTANTE')"
node -e "console.log('LINKEDIN_CLIENT_SECRET:', process.env.LINKEDIN_CLIENT_SECRET ? '✅ CONFIGURADO' : '❌ FALTANTE')"

# 2. Verificar que Supabase está accesible
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"

# 3. Verificar que la tabla social_media existe
# Ejecutar en Supabase SQL Editor:
SELECT * FROM social_media LIMIT 1;
```

**Criterios de Aceptación:**
- ✅ `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` está configurado
- ✅ `LINKEDIN_CLIENT_SECRET` está configurado (no vacío)
- ✅ `NEXTAUTH_URL` está configurado correctamente
- ✅ `ENCRYPTION_KEY` tiene al menos 32 caracteres
- ✅ Supabase responde correctamente
- ✅ Tabla `social_media` existe con columnas correctas

---

### 1.3 Configuración LinkedIn Developer App
**Objetivo:** Verificar que la aplicación de LinkedIn está configurada correctamente.

**Pasos de Validación:**

1. **Acceder a LinkedIn Developer Portal**
   - URL: https://www.linkedin.com/developers/apps
   - Verificar que la aplicación existe

2. **Verificar Redirect URIs**
   ```
   Desarrollo: http://localhost:3000/api/auth/linkedin/callback
   Producción: https://tudominio.com/api/auth/linkedin/callback
   ```

3. **Verificar Scopes/Permissions**
   - `openid` (requerido para OpenID Connect)
   - `profile` (acceso a perfil básico)
   - `email` (acceso a email)
   - `w_member_social` (publicar en nombre del usuario)
   - `r_organization_social` (leer posts de organizaciones)
   - `rw_organization_admin` (administrar páginas de organizaciones)

4. **Verificar que la App está en Producción**
   - Estado: "Published" o "In Production"
   - No debe estar en "Development Mode" solo

**Criterios de Aceptación:**
- ✅ Client ID y Client Secret coinciden con `.env.local`
- ✅ Redirect URIs configurados correctamente
- ✅ Todos los scopes necesarios están aprobados
- ✅ Aplicación está en modo producción

---

## 2. OAUTH FLOW TESTING

### 2.1 Flujo OAuth Completo (Happy Path)
**Objetivo:** Verificar que el flujo OAuth funciona de principio a fin sin errores.

**Test Case ID:** LNKD-OAUTH-001
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Pre-condiciones:**
- Usuario autenticado en la aplicación (con JWT válido)
- LinkedIn no está conectado previamente
- Navegador con cookies habilitadas

**Pasos de Ejecución:**

1. **Iniciar Sesión en la Aplicación**
   - Navegar a: `http://localhost:3000/login`
   - Iniciar sesión con usuario de prueba
   - Verificar que la cookie `auth-token` existe

2. **Acceder al Dashboard de Redes Sociales**
   - Navegar a: `http://localhost:3000/dashboard/redes-sociales`
   - Verificar que se muestra el botón "Conectar LinkedIn"
   - Verificar que el estado muestra "Desconectado"

3. **Iniciar OAuth Flow**
   - Click en "Conectar LinkedIn"
   - Verificar redirección a LinkedIn.com
   - URL esperada: `https://www.linkedin.com/oauth/v2/authorization?...`

4. **Verificar Parámetros OAuth**
   - `response_type=code`
   - `client_id=[TU_CLIENT_ID]`
   - `redirect_uri=http://localhost:3000/api/auth/linkedin/callback`
   - `scope=openid profile email`
   - `state=[RANDOM_STATE]` (opcional pero recomendado)

5. **Autorizar en LinkedIn**
   - Iniciar sesión en LinkedIn (si no está logueado)
   - Click en "Allow" / "Permitir" acceso
   - Esperar redirección automática

6. **Callback Processing**
   - Verificar redirección a: `http://localhost:3000/api/auth/linkedin/callback?code=...`
   - Verificar que NO hay parámetro `error` en URL
   - Verificar que existe parámetro `code`

7. **Verificar Redirección Final**
   - Debe redirigir a: `http://localhost:3000/dashboard/redes-sociales?success=linkedin`
   - Verificar mensaje de éxito en UI
   - Verificar que LinkedIn ahora muestra "Conectado"

**Resultados Esperados:**
- ✅ Redirección a LinkedIn completa exitosamente
- ✅ Usuario autoriza la aplicación
- ✅ Callback recibe código de autorización
- ✅ Access token se obtiene correctamente
- ✅ Datos se guardan en Supabase
- ✅ Usuario redirigido con mensaje de éxito
- ✅ Estado de LinkedIn cambia a "Conectado"

**Logs a Verificar en Consola:**
```
💼 LinkedIn OAuth Callback recibido
🔐 Usuario autenticado: [USER_ID]
🔄 Intercambiando código por access token...
✅ Access token obtenido, válido por: 5184000 segundos
🔄 Obteniendo perfil del usuario...
✅ Perfil obtenido: [NOMBRE_USUARIO]
🔐 Guardando conexión OAuth para linkedin (usuario: [USER_ID])
✅ Conexión OAuth guardada exitosamente para linkedin
✅ LinkedIn conectado exitosamente
```

**Criterios de Aceptación:**
- ✅ TODO el flujo se completa en menos de 10 segundos
- ✅ NO hay errores en consola del navegador
- ✅ NO hay errores en logs del servidor
- ✅ Token se guarda correctamente en base de datos

---

### 2.2 Verificar State Parameter (CSRF Protection)
**Test Case ID:** LNKD-OAUTH-002
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar que el parámetro `state` protege contra ataques CSRF.

**Pre-condiciones:**
- OAuth flow implementado correctamente

**Pasos de Ejecución:**

1. **Capturar State Original**
   - Iniciar OAuth flow
   - Copiar el valor del parámetro `state` de la URL de LinkedIn
   - Ejemplo: `state=abc123xyz`

2. **Autorizar Normalmente**
   - Completar autorización en LinkedIn
   - Verificar que callback recibe el mismo `state`

3. **Test: State Modificado**
   - Iniciar nuevo OAuth flow
   - En la URL de callback, modificar manualmente el `state`
   - Intentar procesar el callback

**Resultados Esperados:**
- ✅ Con state correcto: OAuth completa exitosamente
- ✅ Con state modificado: OAuth rechaza con error
- ⚠️ **NOTA:** Si no hay validación de state, CREAR ISSUE CRÍTICO

**Estado Actual:**
- ❌ NO SE ENCONTRÓ validación de `state` en el código actual
- 🔴 **VULNERABILIDAD DE SEGURIDAD DETECTADA**

**Acción Requerida:**
- Implementar validación de state parameter en callback

---

### 2.3 Token Exchange Validation
**Test Case ID:** LNKD-OAUTH-003
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Objetivo:** Verificar que el intercambio de código por token funciona correctamente.

**Pasos de Ejecución:**

1. **Completar OAuth hasta Callback**
   - Seguir pasos de LNKD-OAUTH-001
   - Capturar el `code` del callback

2. **Verificar Request a LinkedIn Token Endpoint**
   - Endpoint: `https://www.linkedin.com/oauth/v2/accessToken`
   - Method: `POST`
   - Headers: `Content-Type: application/x-www-form-urlencoded`
   - Body debe incluir:
     - `grant_type=authorization_code`
     - `code=[CÓDIGO_RECIBIDO]`
     - `redirect_uri=[MISMO_REDIRECT_URI]`
     - `client_id=[TU_CLIENT_ID]`
     - `client_secret=[TU_CLIENT_SECRET]`

3. **Verificar Respuesta de LinkedIn**
   - Status Code: `200 OK`
   - Response debe incluir:
     ```json
     {
       "access_token": "AQX...",
       "expires_in": 5184000,
       "scope": "openid profile email"
     }
     ```

4. **Verificar Logs del Servidor**
   ```
   ✅ Access token obtenido, válido por: 5184000 segundos
   ```

**Resultados Esperados:**
- ✅ Request a token endpoint es correcto
- ✅ LinkedIn responde con 200 OK
- ✅ Access token es válido (no vacío)
- ✅ `expires_in` es correcto (60 días = 5184000 segundos)

**Casos de Error a Probar:**

| Escenario | Código Modificado | Resultado Esperado |
|-----------|-------------------|-------------------|
| Código inválido | `code=INVALID_CODE` | Error 400, mensaje "invalid_grant" |
| Código expirado | Usar código de hace > 10 min | Error 400, mensaje "code expired" |
| Redirect URI incorrecto | Cambiar `redirect_uri` | Error 400, mensaje "redirect_uri mismatch" |
| Client Secret incorrecto | Cambiar `client_secret` | Error 401, mensaje "invalid_client" |

**Criterios de Aceptación:**
- ✅ Token exchange completa en < 2 segundos
- ✅ Access token se recibe correctamente
- ✅ Errores se manejan con mensajes claros

---

### 2.4 Profile Fetch Validation
**Test Case ID:** LNKD-OAUTH-004
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Objetivo:** Verificar que se obtiene el perfil del usuario correctamente.

**Pasos de Ejecución:**

1. **Completar Token Exchange**
   - Tener access token válido

2. **Verificar Request a LinkedIn Userinfo**
   - Endpoint: `https://api.linkedin.com/v2/userinfo`
   - Method: `GET`
   - Headers: `Authorization: Bearer [ACCESS_TOKEN]`

3. **Verificar Respuesta de LinkedIn**
   - Status Code: `200 OK`
   - Response debe incluir:
     ```json
     {
       "sub": "1234567890",
       "name": "Juan Pérez",
       "given_name": "Juan",
       "family_name": "Pérez",
       "email": "juan.perez@example.com",
       "picture": "https://media.licdn.com/..."
     }
     ```

4. **Verificar Logs del Servidor**
   ```
   ✅ Perfil obtenido: Juan Pérez
   ```

**Resultados Esperados:**
- ✅ Profile fetch completa exitosamente
- ✅ Se reciben datos del usuario (name, email, picture)
- ✅ No hay errores de API

**Casos de Error a Probar:**

| Escenario | Modificación | Resultado Esperado |
|-----------|--------------|-------------------|
| Token inválido | `Authorization: Bearer INVALID` | Error 401 |
| Token expirado | Token de hace > 60 días | Error 401 |
| Sin header Authorization | Omitir header | Error 401 |

**Criterios de Aceptación:**
- ✅ Perfil se obtiene en < 1 segundo
- ✅ Datos son correctos y completos
- ✅ Errores se manejan correctamente

---

## 3. DATA STORAGE TESTING

### 3.1 Token Storage in Supabase
**Test Case ID:** LNKD-STORAGE-001
**Prioridad:** CRÍTICA
**Tipo:** Manual + Database Query

**Objetivo:** Verificar que los tokens se guardan correctamente en Supabase con encriptación.

**Pasos de Ejecución:**

1. **Completar OAuth Flow**
   - Seguir LNKD-OAUTH-001 hasta el final

2. **Verificar Datos en Supabase**
   - Abrir Supabase SQL Editor
   - Ejecutar query:
   ```sql
   SELECT
     user_id,
     platform,
     username,
     profile_url,
     followers,
     connected,
     access_token,
     refresh_token,
     token_expiry,
     last_sync,
     profile_data,
     created_at,
     updated_at
   FROM social_media
   WHERE platform = 'linkedin'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Verificar Datos Guardados**

**Columnas a Verificar:**

| Columna | Valor Esperado | Validación |
|---------|----------------|------------|
| `user_id` | UUID del usuario autenticado | ✅ Debe coincidir con JWT |
| `platform` | `linkedin` | ✅ Exactamente "linkedin" |
| `username` | Nombre del usuario o email | ✅ No debe estar vacío |
| `profile_url` | NULL (se actualiza después) | ⚠️ Puede ser NULL inicialmente |
| `followers` | 0 (se actualiza después) | ✅ Debe ser número >= 0 |
| `connected` | `true` | ✅ Debe ser true |
| `access_token` | String encriptado (no legible) | ✅ NO debe ser el token en texto plano |
| `refresh_token` | NULL (LinkedIn no da refresh token en v2) | ✅ Puede ser NULL |
| `token_expiry` | Fecha futura (60 días) | ✅ Debe ser ~ Date.now() + 5184000000 ms |
| `last_sync` | Timestamp actual | ✅ Debe ser <= now() |
| `profile_data` | JSON con datos del perfil | ✅ Debe contener `id`, `name`, `email` |
| `created_at` | Timestamp de inserción | ✅ Debe existir |
| `updated_at` | Timestamp de actualización | ✅ Debe existir |

**Resultados Esperados:**
- ✅ Registro existe en la tabla `social_media`
- ✅ `access_token` está encriptado (no legible)
- ✅ `token_expiry` es correcto
- ✅ `profile_data` contiene datos del usuario
- ✅ `connected` = true

**Verificar Encriptación:**

```sql
-- El access_token NO debe contener "AQX" u otros prefijos de tokens LinkedIn reales
-- Debe ser un string encriptado con formato AES-256-GCM

SELECT
  LENGTH(access_token) as token_length,
  LEFT(access_token, 10) as token_prefix
FROM social_media
WHERE platform = 'linkedin'
LIMIT 1;

-- token_length debe ser > 100
-- token_prefix NO debe contener "AQX" (prefijo de tokens LinkedIn)
```

**Criterios de Aceptación:**
- ✅ Todos los campos requeridos están presentes
- ✅ Access token está encriptado correctamente
- ✅ Token expiry es correcto
- ✅ No hay datos sensibles en texto plano

---

### 3.2 Encryption/Decryption Verification
**Test Case ID:** LNKD-STORAGE-002
**Prioridad:** CRÍTICA
**Tipo:** Integration Test

**Objetivo:** Verificar que el sistema de encriptación/desencriptación funciona correctamente.

**Pasos de Ejecución:**

1. **Guardar Token Encriptado**
   - Completar OAuth flow
   - Token se guarda encriptado en DB

2. **Leer Token Desencriptado**
   - Hacer request a `/api/linkedin/sync` (requiere token desencriptado)
   - Verificar que el endpoint puede leer el token

3. **Verificar en Logs**
   ```
   ✅ Conexión encontrada para usuario: [USER_ID]
   ```

**Test de Integridad:**

```typescript
// Crear script de prueba en /scripts/test-encryption.js

import { encryptToken, decryptToken } from '../src/lib/encryption';

const originalToken = 'AQXTestToken123456789';
const encrypted = encryptToken(originalToken);
const decrypted = decryptToken(encrypted);

console.log('Original:', originalToken);
console.log('Encrypted:', encrypted);
console.log('Decrypted:', decrypted);
console.log('Match:', originalToken === decrypted ? '✅' : '❌');
```

**Resultados Esperados:**
- ✅ Token original !== Token encriptado
- ✅ Token desencriptado === Token original
- ✅ Encriptación es consistente
- ✅ No hay errores de desencriptación

**Criterios de Aceptación:**
- ✅ Encriptación funciona correctamente
- ✅ Desencriptación recupera el token original
- ✅ No hay pérdida de datos

---

### 3.3 Duplicate Connection Handling
**Test Case ID:** LNKD-STORAGE-003
**Prioridad:** MEDIA
**Tipo:** Manual

**Objetivo:** Verificar que conectar LinkedIn dos veces actualiza el registro en lugar de duplicar.

**Pasos de Ejecución:**

1. **Primera Conexión**
   - Completar OAuth flow (LNKD-OAUTH-001)
   - Verificar que se crea 1 registro en DB

2. **Verificar ID del Registro**
   ```sql
   SELECT id, user_id, platform, created_at, updated_at
   FROM social_media
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

3. **Desconectar LinkedIn**
   - En UI, click "Desconectar LinkedIn"
   - Verificar que `connected` = false

4. **Segunda Conexión**
   - Volver a conectar LinkedIn (nuevo OAuth flow)
   - Verificar logs:
   ```
   ✅ Conexión OAuth guardada exitosamente para linkedin
   ```

5. **Verificar que NO se Duplica**
   ```sql
   SELECT COUNT(*) as total_records
   FROM social_media
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';

   -- total_records DEBE SER 1, NO 2
   ```

**Resultados Esperados:**
- ✅ Solo existe 1 registro para linkedin + user_id
- ✅ `updated_at` cambió (se actualizó el registro)
- ✅ Nuevo `access_token` reemplazó al anterior
- ✅ NO hay duplicados en la tabla

**Criterios de Aceptación:**
- ✅ Upsert funciona correctamente (onConflict)
- ✅ No hay duplicados
- ✅ Token se actualiza correctamente

---

### 3.4 Token Expiry Calculation
**Test Case ID:** LNKD-STORAGE-004
**Prioridad:** ALTA
**Tipo:** Manual + Database Query

**Objetivo:** Verificar que la fecha de expiración del token se calcula correctamente.

**Pasos de Ejecución:**

1. **Completar OAuth Flow**
   - Capturar el timestamp exacto de OAuth completion
   - Ejemplo: `2025-11-21T12:00:00.000Z`

2. **Verificar Token Expiry en DB**
   ```sql
   SELECT
     token_expiry,
     EXTRACT(EPOCH FROM (token_expiry - created_at)) / 86400 as days_until_expiry
   FROM social_media
   WHERE platform = 'linkedin'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

3. **Verificar Cálculo**
   - `expires_in` de LinkedIn: `5184000` segundos
   - Conversión: `5184000 / 86400 = 60 días`
   - `days_until_expiry` debe ser ≈ 60 días

**Resultados Esperados:**
- ✅ `token_expiry` = `created_at` + 60 días
- ✅ No hay errores de cálculo
- ✅ Fecha es futura (> now())

**Criterios de Aceptación:**
- ✅ Expiración calculada correctamente
- ✅ Formato de fecha es correcto (ISO 8601)
- ✅ Token expiry es verificable

---

## 4. SYNC ENDPOINT TESTING

### 4.1 Successful Sync Flow
**Test Case ID:** LNKD-SYNC-001
**Prioridad:** CRÍTICA
**Tipo:** Manual + API Test

**Objetivo:** Verificar que `/api/linkedin/sync` sincroniza posts y comentarios correctamente.

**Pre-condiciones:**
- LinkedIn conectado (access token válido)
- Usuario autenticado con JWT

**Pasos de Ejecución:**

1. **Ejecutar Sync Endpoint**
   - Method: `POST`
   - URL: `http://localhost:3000/api/linkedin/sync`
   - Headers:
     ```
     Cookie: auth-token=[JWT_TOKEN]
     Content-Type: application/json
     ```
   - Body:
     ```json
     {
       "maxPosts": 10,
       "maxCommentsPerPost": 20,
       "lookbackDays": 30
     }
     ```

2. **Verificar Respuesta**
   - Status Code: `200 OK`
   - Response esperado:
     ```json
     {
       "success": true,
       "data": {
         "posts_processed": 10,
         "comments_processed": 45,
         "mentions_created": 45,
         "profile_id": "urn:li:person:1234567890"
       },
       "message": "Sincronización exitosa: 45 nuevos comentarios"
     }
     ```

3. **Verificar Logs del Servidor**
   ```
   🔄 LinkedIn Sync: Iniciando sincronización...
   ✅ Conexión encontrada para usuario: [USER_ID]
   👔 Sincronizando perfil de LinkedIn: urn:li:person:...
   📝 10 posts encontrados
   ✅ Sincronización de LinkedIn completada
   ```

4. **Verificar Datos en Supabase - Tabla mentions**
   ```sql
   SELECT
     COUNT(*) as total_mentions,
     COUNT(DISTINCT metadata->>'post_id') as unique_posts,
     AVG(likes) as avg_likes
   FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

5. **Verificar Métricas Actualizadas en social_media**
   ```sql
   SELECT
     posts,
     engagement,
     last_sync
   FROM social_media
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

**Resultados Esperados:**
- ✅ Sync completa en < 30 segundos
- ✅ Se procesan posts correctamente
- ✅ Comentarios se guardan en tabla `mentions`
- ✅ Análisis de sentimiento se ejecuta
- ✅ Métricas se actualizan en `social_media`
- ✅ `last_sync` se actualiza

**Criterios de Aceptación:**
- ✅ Response tiene estructura correcta
- ✅ Datos se guardan en DB
- ✅ No hay duplicados
- ✅ Sentimiento se analiza correctamente

---

### 4.2 Sync with Expired Token
**Test Case ID:** LNKD-SYNC-002
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar manejo de error cuando el token expiró.

**Pasos de Ejecución:**

1. **Simular Token Expirado**
   - En Supabase, modificar `token_expiry`:
   ```sql
   UPDATE social_media
   SET token_expiry = NOW() - INTERVAL '1 day'
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Ejecutar Sync**
   - POST a `/api/linkedin/sync`

3. **Verificar Respuesta**
   - Status Code: `401 Unauthorized` o `400 Bad Request`
   - Response esperado:
     ```json
     {
       "success": false,
       "error": "Error obteniendo perfil de LinkedIn"
     }
     ```

4. **Verificar Logs**
   ```
   ❌ Error obteniendo perfil: [ERROR_DETAILS]
   ```

**Resultados Esperados:**
- ✅ Error se detecta correctamente
- ✅ Response indica token expirado
- ✅ No se guardan datos incorrectos
- ✅ Usuario recibe mensaje claro

**Criterios de Aceptación:**
- ✅ Error manejado correctamente
- ✅ No hay crashes del servidor
- ✅ Mensaje de error es claro

---

### 4.3 Sentiment Analysis Accuracy
**Test Case ID:** LNKD-SYNC-003
**Prioridad:** MEDIA
**Tipo:** Manual

**Objetivo:** Verificar que el análisis de sentimiento es preciso.

**Test Data - Comentarios de Prueba:**

| Comentario | Sentimiento Esperado | Score Esperado |
|-----------|---------------------|----------------|
| "Excelente trabajo, felicitaciones!" | positive | +50 a +100 |
| "Muy profesional y genial contenido" | positive | +50 a +100 |
| "Terrible experiencia, muy decepcionado" | negative | -50 a -100 |
| "Pésimo servicio, nunca más" | negative | -50 a -100 |
| "Gracias por compartir" | neutral o positive | 0 a +25 |
| "Ok" | neutral | 0 |

**Pasos de Ejecución:**

1. **Ejecutar Sync**
   - Asegurar que hay comentarios variados en LinkedIn

2. **Verificar Resultados en DB**
   ```sql
   SELECT
     content,
     metadata->>'sentiment' as sentiment,
     metadata->>'sentiment_score' as score
   FROM mentions
   WHERE platform = 'linkedin'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

3. **Validar Manualmente**
   - Leer cada comentario
   - Verificar que el sentimiento asignado es correcto

**Accuracy Target:**
- ✅ Positive: > 80% accuracy
- ✅ Negative: > 80% accuracy
- ⚠️ Neutral: > 60% accuracy (más difícil)

**Criterios de Aceptación:**
- ✅ Sentimiento es correcto en > 75% de casos
- ✅ Scores están en rangos razonables
- ✅ No hay errores de análisis

---

### 4.4 Duplicate Prevention
**Test Case ID:** LNKD-SYNC-004
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar que ejecutar sync múltiples veces NO duplica menciones.

**Pasos de Ejecución:**

1. **Primera Sincronización**
   - POST `/api/linkedin/sync`
   - Capturar `mentions_created` (ej: 45)

2. **Verificar Menciones en DB**
   ```sql
   SELECT COUNT(*) as total_before
   FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

3. **Segunda Sincronización (inmediata)**
   - POST `/api/linkedin/sync` nuevamente
   - Sin cambios en LinkedIn

4. **Verificar Respuesta**
   ```json
   {
     "success": true,
     "data": {
       "mentions_created": 0
     },
     "message": "Sincronización exitosa: 0 nuevos comentarios"
   }
   ```

5. **Verificar Menciones en DB (después)**
   ```sql
   SELECT COUNT(*) as total_after
   FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

**Resultados Esperados:**
- ✅ `total_before` === `total_after`
- ✅ NO se crean duplicados
- ✅ `mentions_created` = 0 en segunda sync
- ✅ Query de duplicados funciona correctamente

**Verificación de Lógica de Duplicados:**

El código usa esta query para evitar duplicados:
```typescript
.eq('user_id', userId)
.eq('platform', 'linkedin')
.eq('url', `https://www.linkedin.com/feed/update/${postId}`)
.eq('author_username', commentAuthor)
```

**Criterios de Aceptación:**
- ✅ Prevención de duplicados funciona
- ✅ No hay errores en queries
- ✅ Performance es aceptable

---

## 5. DASHBOARD ENDPOINT TESTING

### 5.1 Dashboard Data Accuracy
**Test Case ID:** LNKD-DASH-001
**Prioridad:** CRÍTICA
**Tipo:** Manual + API Test

**Objetivo:** Verificar que `/api/linkedin/dashboard` retorna métricas correctas.

**Pre-condiciones:**
- LinkedIn conectado
- Sync ejecutado al menos una vez con datos

**Pasos de Ejecución:**

1. **Ejecutar Dashboard Endpoint**
   - Method: `GET`
   - URL: `http://localhost:3000/api/linkedin/dashboard`
   - Headers: `Cookie: auth-token=[JWT_TOKEN]`

2. **Verificar Respuesta**
   - Status Code: `200 OK`
   - Estructura esperada:
   ```json
   {
     "success": true,
     "data": {
       "profile": {
         "id": "usuario_linkedin",
         "name": "Juan Pérez",
         "url": "",
         "connections": 0,
         "total_posts": 10,
         "engagement_rate": 25.5,
         "last_sync": "2025-11-21T12:00:00Z",
         "connected": true
       },
       "overview": {
         "reputation_score": 75,
         "total_mentions": 45,
         "positive_mentions": 30,
         "negative_mentions": 5,
         "neutral_mentions": 10,
         "avg_sentiment_score": 25.5,
         "reach_estimate": 0,
         "engagement_rate": 25.5,
         "influence_score": 0
       },
       "sentiment_distribution": {
         "positive_percentage": 66.67,
         "negative_percentage": 11.11,
         "neutral_percentage": 22.22
       },
       "trends": {
         "last_7_days": [ /* array de 7 elementos */ ],
         "total_change": 5,
         "sentiment_trend": "improving"
       },
       "top_mentions": {
         "most_positive": [ /* array de menciones */ ],
         "most_negative": [ /* array de menciones */ ]
       },
       "top_posts": [ /* array de posts */ ],
       "recent_mentions": [ /* array de últimas 20 menciones */ ],
       "metrics_history": [],
       "generated_at": "2025-11-21T12:30:00Z",
       "data_freshness": 30
     }
   }
   ```

3. **Validar Cálculos Manualmente**

**Cálculo de Reputation Score:**
```
reputation_score = (
  (positive_mentions / total_mentions * 100) * 0.4 +  // Sentiment Weight
  (engagement_rate) * 0.3 +                             // Engagement Weight
  50 * 0.3                                              // Growth Weight (placeholder)
)
```

**Ejemplo:**
- `positive_mentions` = 30
- `total_mentions` = 45
- `engagement_rate` = 25.5

```
sentiment_score = (30 / 45 * 100) = 66.67
reputation_score = (66.67 * 0.4) + (25.5 * 0.3) + (50 * 0.3)
                 = 26.67 + 7.65 + 15
                 = 49.32 ≈ 49
```

4. **Verificar en DB**
   ```sql
   -- Contar menciones manualmente
   SELECT
     COUNT(*) as total,
     COUNT(CASE WHEN metadata->>'sentiment' = 'positive' THEN 1 END) as positive,
     COUNT(CASE WHEN metadata->>'sentiment' = 'negative' THEN 1 END) as negative,
     COUNT(CASE WHEN metadata->>'sentiment' = 'neutral' THEN 1 END) as neutral
   FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

**Resultados Esperados:**
- ✅ `total_mentions` coincide con DB
- ✅ `positive_mentions` coincide con DB
- ✅ `negative_mentions` coincide con DB
- ✅ `sentiment_distribution` suma 100%
- ✅ `reputation_score` está en rango 0-100
- ✅ `trends.last_7_days` tiene 7 elementos
- ✅ `recent_mentions` tiene máximo 20 elementos
- ✅ `top_posts` está ordenado por engagement

**Criterios de Aceptación:**
- ✅ Todos los cálculos son correctos
- ✅ No hay divisiones por cero
- ✅ Porcentajes suman 100%
- ✅ Response tiempo < 2 segundos

---

### 5.2 Dashboard with No Data
**Test Case ID:** LNKD-DASH-002
**Prioridad:** MEDIA
**Tipo:** Manual

**Objetivo:** Verificar que dashboard funciona sin menciones (usuario nuevo).

**Pre-condiciones:**
- LinkedIn conectado
- Sync NO ejecutado (sin menciones)

**Pasos de Ejecución:**

1. **Limpiar Menciones (para testing)**
   ```sql
   DELETE FROM mentions
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Ejecutar Dashboard**
   - GET `/api/linkedin/dashboard`

3. **Verificar Respuesta**
   ```json
   {
     "success": true,
     "data": {
       "overview": {
         "reputation_score": 50,  // Default sin datos
         "total_mentions": 0,
         "positive_mentions": 0,
         "negative_mentions": 0,
         "neutral_mentions": 0,
         "avg_sentiment_score": 0
       },
       "sentiment_distribution": {
         "positive_percentage": 0,
         "negative_percentage": 0,
         "neutral_percentage": 0
       },
       "top_mentions": {
         "most_positive": [],
         "most_negative": []
       },
       "recent_mentions": [],
       "top_posts": []
     }
   }
   ```

**Resultados Esperados:**
- ✅ NO hay errores de división por cero
- ✅ Arrays vacíos en lugar de null
- ✅ Reputation score = 50 (neutral default)
- ✅ Respuesta es válida JSON

**Criterios de Aceptación:**
- ✅ Dashboard funciona sin datos
- ✅ No hay crashes
- ✅ UI muestra mensaje apropiado

---

### 5.3 Trends Data Validation
**Test Case ID:** LNKD-DASH-003
**Prioridad:** MEDIA
**Tipo:** Manual

**Objetivo:** Verificar que el array `trends.last_7_days` es correcto.

**Pasos de Ejecución:**

1. **Ejecutar Dashboard**
   - GET `/api/linkedin/dashboard`

2. **Verificar Array last_7_days**
   ```json
   "last_7_days": [
     {
       "date": "2025-11-15",
       "total": 5,
       "positive": 3,
       "negative": 1,
       "neutral": 1
     },
     {
       "date": "2025-11-16",
       "total": 7,
       "positive": 5,
       "negative": 0,
       "neutral": 2
     },
     // ... 5 más (7 total)
   ]
   ```

3. **Validaciones:**
   - ✅ Array tiene exactamente 7 elementos
   - ✅ Fechas son consecutivas (hoy - 6 días hasta hoy)
   - ✅ Formato de fecha: `YYYY-MM-DD`
   - ✅ `total` = `positive` + `negative` + `neutral`
   - ✅ Números son >= 0

**Resultados Esperados:**
- ✅ Datos son correctos
- ✅ Fechas en orden cronológico
- ✅ Sumas cuadran

**Criterios de Aceptación:**
- ✅ Estructura correcta
- ✅ Matemáticas correctas
- ✅ Fechas válidas

---

## 6. ERROR HANDLING TESTING

### 6.1 LinkedIn Not Connected
**Test Case ID:** LNKD-ERROR-001
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar error cuando LinkedIn no está conectado.

**Escenarios a Probar:**

| Endpoint | Método | Error Esperado |
|----------|--------|----------------|
| `/api/linkedin/sync` | POST | 400 - "LinkedIn no está conectado" |
| `/api/linkedin/dashboard` | GET | 400 - "LinkedIn no está conectado" |

**Pasos de Ejecución:**

1. **Desconectar LinkedIn**
   ```sql
   UPDATE social_media
   SET connected = false
   WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
   ```

2. **Intentar Sync**
   - POST `/api/linkedin/sync`

3. **Verificar Respuesta**
   - Status: `400 Bad Request`
   - Response:
   ```json
   {
     "success": false,
     "error": "LinkedIn no está conectado"
   }
   ```

**Resultados Esperados:**
- ✅ Error 400 (no 500)
- ✅ Mensaje claro
- ✅ No hay crashes

**Criterios de Aceptación:**
- ✅ Manejo correcto de error
- ✅ Mensaje claro al usuario

---

### 6.2 Invalid JWT Token
**Test Case ID:** LNKD-ERROR-002
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Objetivo:** Verificar manejo de JWT inválido o expirado.

**Escenarios:**

| Escenario | Cookie | Status Esperado | Error Esperado |
|-----------|--------|-----------------|----------------|
| Sin cookie | (ninguno) | 401 | "No autenticado" |
| Token inválido | `auth-token=INVALID` | 401 | Error de verificación JWT |
| Token expirado | Token viejo | 401 | "Token expirado" |

**Pasos de Ejecución:**

1. **Test: Sin Cookie**
   - Request sin header `Cookie`
   - Verificar error 401

2. **Test: Token Inválido**
   - Cookie: `auth-token=TOKEN_INVALIDO_123`
   - Verificar error 401

3. **Test: Token Expirado**
   - Generar token con exp pasado
   - Verificar error 401

**Resultados Esperados:**
- ✅ Error 401 en todos los casos
- ✅ No se ejecuta lógica de negocio
- ✅ Mensajes de error claros

**Criterios de Aceptación:**
- ✅ Autenticación verificada correctamente
- ✅ No hay bypasses de seguridad

---

### 6.3 LinkedIn API Errors
**Test Case ID:** LNKD-ERROR-003
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar manejo de errores de LinkedIn API.

**Errores a Simular:**

| Error LinkedIn | Código HTTP | Manejo Esperado |
|----------------|-------------|-----------------|
| Token inválido | 401 | Error 500 - "Error obteniendo perfil de LinkedIn" |
| Rate limit | 429 | Retry o error temporal |
| Network error | Timeout | Error 500 - "Error en LinkedIn sync" |
| Invalid scope | 403 | Error sobre permisos |

**Pasos de Ejecución:**

1. **Simular Token Inválido**
   - Modificar `access_token` en DB a valor inválido
   - Ejecutar sync
   - Verificar error

2. **Verificar Logs**
   ```
   ❌ Error obteniendo perfil: [ERROR_DETAILS]
   ```

**Resultados Esperados:**
- ✅ Errores se capturan
- ✅ Se loggean detalles
- ✅ Usuario recibe mensaje claro
- ✅ No hay crashes

**Criterios de Aceptación:**
- ✅ Todos los errores manejados
- ✅ Logs detallados
- ✅ No exposición de secrets

---

### 6.4 Database Connection Errors
**Test Case ID:** LNKD-ERROR-004
**Prioridad:** ALTA
**Tipo:** Manual

**Objetivo:** Verificar manejo cuando Supabase no está disponible.

**Escenarios:**

1. **Supabase Offline**
   - Cambiar temporalmente `SUPABASE_URL` a URL inválida
   - Intentar OAuth callback

2. **Query Timeout**
   - Simular timeout en query lenta

**Resultados Esperados:**
- ✅ Error 500 con mensaje genérico
- ✅ No exposición de detalles internos
- ✅ Logs detallados en servidor

**Criterios de Aceptación:**
- ✅ Errores DB manejados
- ✅ No crashes
- ✅ Mensajes seguros al usuario

---

## 7. SECURITY TESTING

### 7.1 Token Encryption Verification
**Test Case ID:** LNKD-SEC-001
**Prioridad:** CRÍTICA
**Tipo:** Manual + Database Inspection

**Objetivo:** Verificar que tokens NUNCA se guardan en texto plano.

**Pasos de Ejecución:**

1. **Completar OAuth Flow**

2. **Inspeccionar DB Directamente**
   ```sql
   SELECT
     access_token,
     refresh_token,
     LENGTH(access_token) as token_length
   FROM social_media
   WHERE platform = 'linkedin'
   LIMIT 1;
   ```

3. **Verificaciones de Seguridad:**
   - ✅ `access_token` NO comienza con "AQX" (prefijo LinkedIn)
   - ✅ `access_token` tiene caracteres no legibles
   - ✅ `token_length` > 100 (encriptado es más largo)
   - ✅ No hay tokens en logs del servidor
   - ✅ No hay tokens en response JSON

4. **Verificar Logs**
   - Buscar en logs: NO debe aparecer el token real
   - ✅ Solo mensajes como: "✅ Access token obtenido"
   - ❌ NUNCA: "Token: AQX1234567890..."

**Criterios de Aceptación:**
- ✅ 100% de tokens encriptados
- ✅ No exposición en logs
- ✅ No exposición en responses

---

### 7.2 SQL Injection Prevention
**Test Case ID:** LNKD-SEC-002
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Objetivo:** Verificar que NO hay vulnerabilidades de SQL Injection.

**Vectores de Ataque a Probar:**

1. **User ID Manipulation**
   - Modificar JWT con `userId: "' OR '1'='1"`
   - Verificar que query falla o escapa correctamente

2. **Platform Parameter**
   - Intentar: `platform = "linkedin' OR '1'='1"`
   - Verificar sanitización

**Verificación de Código:**

✅ **BUENO (Parametrizado):**
```typescript
.eq('user_id', userId)
.eq('platform', 'linkedin')
```

❌ **MALO (Vulnerable):**
```typescript
// NO SE ENCONTRÓ en el código actual
supabase.raw(`SELECT * FROM social_media WHERE user_id = '${userId}'`)
```

**Resultados Esperados:**
- ✅ Supabase client usa queries parametrizadas
- ✅ No hay concatenación de strings en SQL
- ✅ Intentos de injection fallan

**Criterios de Aceptación:**
- ✅ NO hay SQL Injection posible
- ✅ Todas las queries usan parametrización

---

### 7.3 CSRF Protection (State Parameter)
**Test Case ID:** LNKD-SEC-003
**Prioridad:** CRÍTICA
**Tipo:** Manual

**Objetivo:** Verificar protección contra CSRF en OAuth.

**Estado Actual:**
- ❌ **VULNERABILIDAD DETECTADA:** No hay validación de `state` parameter

**Pasos de Ataque:**

1. **Atacante crea URL maliciosa**
   ```
   https://www.linkedin.com/oauth/v2/authorization?
     response_type=code&
     client_id=[CLIENT_ID]&
     redirect_uri=https://victima.com/api/auth/linkedin/callback&
     state=ESTADO_MALICIOSO
   ```

2. **Víctima autoriza sin darse cuenta**

3. **Callback no valida state**
   - Código actual NO verifica `state`
   - OAuth completa exitosamente

**Acción Requerida:**
- 🔴 **IMPLEMENTAR** validación de state parameter

**Implementación Recomendada:**

```typescript
// En /api/auth/linkedin/route.ts (iniciar OAuth)
const state = crypto.randomUUID();
cookies().set('linkedin_oauth_state', state, { httpOnly: true, secure: true });

// En callback
const receivedState = searchParams.get('state');
const savedState = cookies().get('linkedin_oauth_state')?.value;

if (receivedState !== savedState) {
  return NextResponse.redirect('...?error=csrf_detected');
}
```

**Criterios de Aceptación:**
- ✅ State parameter generado aleatoriamente
- ✅ State guardado en cookie HTTP-only
- ✅ State validado en callback
- ✅ OAuth rechazado si state no coincide

---

### 7.4 Secrets Exposure Prevention
**Test Case ID:** LNKD-SEC-004
**Prioridad:** CRÍTICA
**Tipo:** Code Review + Manual

**Objetivo:** Verificar que secrets NUNCA se exponen al cliente.

**Verificaciones:**

1. **Variables de Entorno**
   - ✅ `LINKEDIN_CLIENT_SECRET` NO tiene prefijo `NEXT_PUBLIC_`
   - ✅ `JWT_SECRET` NO tiene prefijo `NEXT_PUBLIC_`
   - ✅ `ENCRYPTION_KEY` NO tiene prefijo `NEXT_PUBLIC_`

2. **Response JSON**
   - Verificar que responses NO incluyen:
     - `access_token` desencriptado
     - `client_secret`
     - `encryption_key`

3. **Logs del Servidor**
   - No debe loguearse:
     - Access tokens completos
     - Client secrets
     - Encryption keys

4. **Client-Side Code**
   - Verificar que `LINKEDIN_CLIENT_SECRET` NO se usa en:
     - Componentes de React
     - Client-side scripts

**Comando de Búsqueda:**
```bash
# Buscar exposición de secrets en código cliente
grep -r "LINKEDIN_CLIENT_SECRET" src/app/ src/components/
# NO debe encontrar nada

grep -r "NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET" .
# NO debe encontrar nada
```

**Resultados Esperados:**
- ✅ Client secret solo en archivos /api
- ✅ No exposición en responses
- ✅ No exposición en logs públicos

**Criterios de Aceptación:**
- ✅ 0 exposiciones de secrets
- ✅ Variables correctamente configuradas

---

### 7.5 HTTPS Enforcement (Production)
**Test Case ID:** LNKD-SEC-005
**Prioridad:** ALTA
**Tipo:** Manual (Production Only)

**Objetivo:** Verificar que OAuth solo funciona con HTTPS en producción.

**Pre-condiciones:**
- Aplicación desplegada en producción

**Pasos de Ejecución:**

1. **Verificar Redirect URI**
   - Debe ser: `https://tudominio.com/api/auth/linkedin/callback`
   - NO: `http://tudominio.com/...`

2. **Intentar OAuth con HTTP**
   - Cambiar manualmente a `http://`
   - Verificar que LinkedIn rechaza o redirecciona a HTTPS

3. **Verificar Cookies**
   - `auth-token` debe tener flags:
     - `Secure: true` (solo HTTPS)
     - `HttpOnly: true`
     - `SameSite: Lax` o `Strict`

**Criterios de Aceptación:**
- ✅ Producción usa HTTPS exclusivamente
- ✅ Cookies tienen flags seguros
- ✅ No hay downgrade a HTTP

---

## 8. PERFORMANCE TESTING

### 8.1 OAuth Flow Response Time
**Test Case ID:** LNKD-PERF-001
**Prioridad:** MEDIA
**Tipo:** Manual + Timing

**Objetivo:** Verificar que OAuth completa en tiempo aceptable.

**Benchmarks:**

| Etapa | Tiempo Máximo |
|-------|---------------|
| Redirect a LinkedIn | < 1 segundo |
| Autorización usuario | Variable (manual) |
| Callback processing | < 3 segundos |
| Token exchange | < 2 segundos |
| Profile fetch | < 1 segundo |
| DB save | < 1 segundo |
| **Total (automático)** | **< 7 segundos** |

**Pasos de Ejecución:**

1. **Medir con Browser DevTools**
   - Abrir Network tab
   - Iniciar OAuth flow
   - Capturar timing de cada request

2. **Medir con Logs**
   ```typescript
   // Agregar temporalmente en callback
   console.time('Total OAuth');
   // ... código ...
   console.timeEnd('Total OAuth');
   ```

**Resultados Esperados:**
- ✅ OAuth completa en < 10 segundos total
- ✅ Cada etapa dentro de benchmarks
- ✅ No hay timeouts

**Criterios de Aceptación:**
- ✅ 95% de requests < 7 segundos
- ✅ No hay outliers > 15 segundos

---

### 8.2 Sync Endpoint Performance
**Test Case ID:** LNKD-PERF-002
**Prioridad:** MEDIA
**Tipo:** Manual + Timing

**Objetivo:** Verificar performance del endpoint de sincronización.

**Benchmarks:**

| Scenario | Posts | Comments | Tiempo Máximo |
|----------|-------|----------|---------------|
| Small | 5 | 25 | < 10 segundos |
| Medium | 20 | 100 | < 30 segundos |
| Large | 50 | 500 | < 60 segundos |

**Pasos de Ejecución:**

1. **Small Dataset**
   - POST `/api/linkedin/sync` con `maxPosts: 5`
   - Medir tiempo de respuesta

2. **Medium Dataset**
   - POST con `maxPosts: 20`

3. **Large Dataset**
   - POST con `maxPosts: 50`

**Resultados Esperados:**
- ✅ Tiempos dentro de benchmarks
- ✅ No hay timeouts
- ✅ DB no se satura

**Optimizaciones a Considerar:**
- Batch inserts en lugar de inserts individuales
- Parallel processing de comentarios
- Rate limiting para LinkedIn API

**Criterios de Aceptación:**
- ✅ Performance aceptable
- ✅ Escalabilidad verificada

---

### 8.3 Dashboard Endpoint Performance
**Test Case ID:** LNKD-PERF-003
**Prioridad:** ALTA
**Tipo:** Manual + Timing

**Objetivo:** Verificar que dashboard carga rápido.

**Benchmark:** < 2 segundos (95th percentile)

**Datasets a Probar:**

| Menciones en DB | Tiempo Máximo |
|-----------------|---------------|
| 0 | < 0.5 segundos |
| 100 | < 1 segundo |
| 500 | < 2 segundos |
| 1000 | < 3 segundos |

**Pasos de Ejecución:**

1. **Crear Dataset de Prueba**
   ```sql
   -- Insertar 1000 menciones de prueba
   INSERT INTO mentions (user_id, platform, content, ...)
   SELECT ...
   FROM generate_series(1, 1000);
   ```

2. **Medir Response Time**
   - GET `/api/linkedin/dashboard`
   - Medir con `curl -w "%{time_total}\n"`

**Resultados Esperados:**
- ✅ Response time < 2 segundos
- ✅ No hay N+1 queries
- ✅ Queries optimizadas

**Optimizaciones a Considerar:**
- Indexes en:
  - `mentions(user_id, platform, published_at)`
  - `social_media(user_id, platform)`
- Cachear resultados (Redis)
- Limitar queries con `.limit()`

**Criterios de Aceptación:**
- ✅ Performance aceptable
- ✅ Escalabilidad OK

---

## 9. PRODUCTION READINESS CHECKLIST

### 9.1 Pre-Launch Verification

**Configuración:**
- [ ] Variables de entorno configuradas en producción
- [ ] `NEXTAUTH_URL` apunta a dominio correcto
- [ ] LinkedIn Redirect URI actualizado en Developer Portal
- [ ] Aplicación LinkedIn en modo "Production"
- [ ] HTTPS habilitado y funcionando
- [ ] Supabase en plan de producción (no free tier)

**Seguridad:**
- [ ] Tokens encriptados correctamente
- [ ] State parameter implementado y validado
- [ ] Secrets NO expuestos en código cliente
- [ ] Cookies con flags seguros (Secure, HttpOnly)
- [ ] Rate limiting implementado
- [ ] SQL Injection prevention verificado
- [ ] XSS prevention verificado

**Funcionalidad:**
- [ ] OAuth flow completo funciona end-to-end
- [ ] Token storage funciona correctamente
- [ ] Sync endpoint procesa posts y comentarios
- [ ] Dashboard muestra métricas correctas
- [ ] Manejo de errores implementado
- [ ] Duplicate prevention funciona
- [ ] Sentiment analysis es preciso (> 75%)

**Performance:**
- [ ] OAuth completa en < 10 segundos
- [ ] Sync performance aceptable (< 30s para 20 posts)
- [ ] Dashboard carga en < 2 segundos
- [ ] Database queries optimizadas
- [ ] Indexes creados

**Monitoring:**
- [ ] Error tracking configurado (Sentry/LogRocket)
- [ ] Logging implementado en puntos críticos
- [ ] Alertas configuradas para errores críticos
- [ ] Métricas de performance monitoreadas

**Testing:**
- [ ] Todos los test cases críticos ejecutados
- [ ] Edge cases probados
- [ ] Error scenarios validados
- [ ] Security tests pasados
- [ ] Performance benchmarks cumplidos

**Documentation:**
- [ ] README actualizado con instrucciones LinkedIn
- [ ] Variables de entorno documentadas
- [ ] Troubleshooting guide creado
- [ ] API endpoints documentados

**Backup & Recovery:**
- [ ] Backup de base de datos configurado
- [ ] Rollback plan definido
- [ ] Disaster recovery plan documentado

---

### 9.2 Go/No-Go Decision Criteria

**GO (Aprobar Producción):**
- ✅ Todos los items CRÍTICOS completados
- ✅ 0 vulnerabilidades de seguridad
- ✅ Performance dentro de benchmarks
- ✅ Error handling funciona correctamente
- ✅ Monitoring configurado

**NO-GO (Bloquear Producción):**
- ❌ Cualquier vulnerabilidad de seguridad
- ❌ OAuth flow no funciona end-to-end
- ❌ Tokens se guardan sin encriptar
- ❌ Performance inaceptable (> 15s OAuth)
- ❌ Errores críticos no manejados

---

## 10. TEST EXECUTION LOG

### Tabla de Seguimiento

| Test ID | Nombre | Prioridad | Ejecutado | Resultado | Notas | Responsable | Fecha |
|---------|--------|-----------|-----------|-----------|-------|-------------|-------|
| LNKD-OAUTH-001 | OAuth Flow Completo | CRÍTICA | [ ] | - | - | - | - |
| LNKD-OAUTH-002 | State Parameter | ALTA | [ ] | - | **VULNERABILIDAD DETECTADA** | - | - |
| LNKD-OAUTH-003 | Token Exchange | CRÍTICA | [ ] | - | - | - | - |
| LNKD-OAUTH-004 | Profile Fetch | CRÍTICA | [ ] | - | - | - | - |
| LNKD-STORAGE-001 | Token Storage | CRÍTICA | [ ] | - | - | - | - |
| LNKD-STORAGE-002 | Encryption | CRÍTICA | [ ] | - | - | - | - |
| LNKD-STORAGE-003 | Duplicate Prevention | MEDIA | [ ] | - | - | - | - |
| LNKD-STORAGE-004 | Token Expiry | ALTA | [ ] | - | - | - | - |
| LNKD-SYNC-001 | Successful Sync | CRÍTICA | [ ] | - | - | - | - |
| LNKD-SYNC-002 | Expired Token | ALTA | [ ] | - | - | - | - |
| LNKD-SYNC-003 | Sentiment Analysis | MEDIA | [ ] | - | - | - | - |
| LNKD-SYNC-004 | Duplicate Prevention | ALTA | [ ] | - | - | - | - |
| LNKD-DASH-001 | Dashboard Accuracy | CRÍTICA | [ ] | - | - | - | - |
| LNKD-DASH-002 | Dashboard No Data | MEDIA | [ ] | - | - | - | - |
| LNKD-DASH-003 | Trends Validation | MEDIA | [ ] | - | - | - | - |
| LNKD-ERROR-001 | Not Connected | ALTA | [ ] | - | - | - | - |
| LNKD-ERROR-002 | Invalid JWT | CRÍTICA | [ ] | - | - | - | - |
| LNKD-ERROR-003 | LinkedIn API Errors | ALTA | [ ] | - | - | - | - |
| LNKD-ERROR-004 | DB Errors | ALTA | [ ] | - | - | - | - |
| LNKD-SEC-001 | Token Encryption | CRÍTICA | [ ] | - | - | - | - |
| LNKD-SEC-002 | SQL Injection | CRÍTICA | [ ] | - | ✅ Código usa queries parametrizadas | - | - |
| LNKD-SEC-003 | CSRF Protection | CRÍTICA | [ ] | - | **VULNERABILIDAD DETECTADA** | - | - |
| LNKD-SEC-004 | Secrets Exposure | CRÍTICA | [ ] | - | - | - | - |
| LNKD-SEC-005 | HTTPS Enforcement | ALTA | [ ] | - | Solo producción | - | - |
| LNKD-PERF-001 | OAuth Performance | MEDIA | [ ] | - | - | - | - |
| LNKD-PERF-002 | Sync Performance | MEDIA | [ ] | - | - | - | - |
| LNKD-PERF-003 | Dashboard Performance | ALTA | [ ] | - | - | - | - |

---

## 11. ISSUES DETECTADAS

### 11.1 Vulnerabilidades de Seguridad

**ISSUE #1: Falta Validación de State Parameter (CSRF)**
- **Severidad:** CRÍTICA
- **Descripción:** El callback de LinkedIn NO valida el parámetro `state`, lo que permite ataques CSRF.
- **Ubicación:** `/src/app/api/auth/linkedin/callback/route.ts`
- **Impacto:** Un atacante puede forzar a una víctima a conectar su cuenta LinkedIn sin su consentimiento.
- **Solución:** Implementar generación y validación de `state` parameter.
- **Estado:** BLOQUEANTE para producción

**ISSUE #2: Endpoint de Inicio OAuth Faltante**
- **Severidad:** ALTA
- **Descripción:** No existe `/api/auth/linkedin/route.ts` para iniciar el OAuth flow.
- **Ubicación:** `/src/app/api/auth/linkedin/route.ts` (no existe)
- **Impacto:** No hay forma de iniciar OAuth flow desde la aplicación.
- **Solución:** Crear endpoint que genere URL de autorización y redirija.
- **Estado:** BLOQUEANTE para producción

---

## 12. GUÍA DE TESTING MANUAL RÁPIDA

### Checklist Básico (15 minutos)

**Para Desarrollador:**

1. **OAuth Flow (5 min)**
   - [ ] Click "Conectar LinkedIn" en UI
   - [ ] Autorizar en LinkedIn
   - [ ] Verificar redirección con `success=linkedin`
   - [ ] Verificar estado "Conectado" en UI

2. **Verificar DB (3 min)**
   - [ ] Abrir Supabase
   - [ ] Verificar registro en `social_media`
   - [ ] Verificar `access_token` está encriptado
   - [ ] Verificar `connected` = true

3. **Sync (4 min)**
   - [ ] POST `/api/linkedin/sync`
   - [ ] Verificar response `success: true`
   - [ ] Verificar menciones en tabla `mentions`

4. **Dashboard (3 min)**
   - [ ] GET `/api/linkedin/dashboard`
   - [ ] Verificar `reputation_score` calculado
   - [ ] Verificar `sentiment_distribution` suma 100%

**Si TODO funciona:**
- ✅ Integración básica OK
- ⚠️ Ejecutar tests completos antes de producción

**Si ALGO falla:**
- ❌ Revisar logs del servidor
- ❌ Verificar variables de entorno
- ❌ Consultar sección de troubleshooting

---

## 13. CONCLUSIÓN

Este plan de testing cubre:
- ✅ 27 test cases detallados
- ✅ 6 áreas críticas (OAuth, Storage, Sync, Dashboard, Errors, Security)
- ✅ 2 vulnerabilidades detectadas (CSRF, endpoint faltante)
- ✅ Benchmarks de performance claros
- ✅ Production readiness checklist completo

**Próximos Pasos:**
1. **CRÍTICO:** Implementar validación de state parameter
2. **CRÍTICO:** Crear endpoint `/api/auth/linkedin/route.ts`
3. Ejecutar todos los test cases
4. Resolver issues detectadas
5. Verificar production readiness checklist
6. Aprobar para producción

**Tiempo Estimado de Testing:**
- Tests manuales críticos: 2-3 horas
- Tests completos: 6-8 horas
- Security audit: 2 horas
- Performance testing: 2 horas
- **Total:** 12-15 horas

---

**Documento creado:** 2025-11-21
**Última actualización:** 2025-11-21
**Versión:** 1.0
**Estado:** Listo para ejecución
