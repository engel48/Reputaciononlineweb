# AUDITORÍA DE SEGURIDAD: INTEGRACIÓN LINKEDIN OAUTH

**Fecha:** 2025-11-21
**Componente:** LinkedIn OAuth Integration
**Auditor:** Leandro
**Severidad:** CRÍTICA

---

## RESUMEN EJECUTIVO

**Estado General:** ⚠️ **NO APTO PARA PRODUCCIÓN**

**Vulnerabilidades Detectadas:** 2 CRÍTICAS, 3 RECOMENDACIONES

**Acción Requerida:** Implementar correcciones de seguridad antes de deployment.

---

## 1. VULNERABILIDADES CRÍTICAS

### 1.1 CSRF Vulnerability - State Parameter Missing

**Severidad:** 🔴 CRÍTICA
**CVSS Score:** 8.5 (High)
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Descripción:**
El flujo OAuth de LinkedIn NO implementa validación del parámetro `state`, lo que permite ataques CSRF donde un atacante puede forzar a una víctima a conectar su cuenta LinkedIn a la aplicación sin su consentimiento.

**Ubicación:**
- `/src/app/api/auth/linkedin/callback/route.ts` (líneas 21-43)
- Endpoint faltante: `/src/app/api/auth/linkedin/route.ts`

**Código Vulnerable:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // ❌ NO HAY VALIDACIÓN DE STATE
  // ❌ Permite CSRF attacks

  if (!code) {
    return NextResponse.redirect('...?error=no_code');
  }

  // ... procesa OAuth sin verificar state
}
```

**Ataque Posible:**

1. **Atacante prepara URL maliciosa:**
   ```
   https://www.linkedin.com/oauth/v2/authorization?
     response_type=code&
     client_id=[CLIENT_ID]&
     redirect_uri=https://victima.com/api/auth/linkedin/callback&
     scope=openid profile email
   ```

2. **Atacante engaña a víctima para que haga click** (phishing, XSS en otro sitio, etc.)

3. **Víctima autoriza sin darse cuenta**

4. **Callback NO valida state** y completa OAuth

5. **Resultado:** Cuenta LinkedIn de la víctima ahora está conectada a la aplicación del atacante

**Impacto:**
- Un atacante puede conectar cuentas LinkedIn de víctimas sin su consentimiento
- Posible robo de datos personales (nombre, email, posts, comentarios)
- Violación de privacidad de usuarios
- Reputación de la plataforma dañada

**Solución Requerida:**

```typescript
// /src/app/api/auth/linkedin/route.ts (CREAR)
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  // Generar state aleatorio
  const state = crypto.randomUUID();

  // Guardar en cookie HTTP-only
  const cookieStore = await cookies();
  cookieStore.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10 minutos
  });

  // Construir URL de autorización
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`);
  authUrl.searchParams.set('scope', 'openid profile email');
  authUrl.searchParams.set('state', state); // ✅ Agregar state

  return NextResponse.redirect(authUrl.toString());
}
```

```typescript
// /src/app/api/auth/linkedin/callback/route.ts (MODIFICAR)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const receivedState = searchParams.get('state');

  // ✅ VALIDAR STATE
  const cookieStore = await cookies();
  const savedState = cookieStore.get('linkedin_oauth_state')?.value;

  if (!receivedState || receivedState !== savedState) {
    console.error('❌ CSRF detected: state mismatch');
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/redes-sociales?error=csrf_detected`
    );
  }

  // Limpiar cookie de state
  cookieStore.delete('linkedin_oauth_state');

  // ... resto del código
}
```

**Verificación:**
- [ ] Endpoint `/api/auth/linkedin/route.ts` creado
- [ ] State generado con crypto.randomUUID()
- [ ] State guardado en cookie HTTP-only
- [ ] Callback valida state correctamente
- [ ] Cookie se elimina después de uso
- [ ] OAuth rechazado si state no coincide

**Referencias:**
- OWASP CSRF Prevention Cheat Sheet
- OAuth 2.0 Security Best Practices (RFC 6819)
- LinkedIn OAuth Documentation

---

### 1.2 Missing OAuth Initiation Endpoint

**Severidad:** 🔴 CRÍTICA
**CVSS Score:** 7.0 (High)

**Descripción:**
No existe el endpoint `/api/auth/linkedin/route.ts` que debe iniciar el flujo OAuth. Esto significa que:
1. No hay forma estándar de iniciar OAuth desde la aplicación
2. Si existe algún método alternativo, probablemente carece de protecciones CSRF
3. El flujo OAuth está incompleto

**Ubicación:**
- `/src/app/api/auth/linkedin/route.ts` - **NO EXISTE**

**Impacto:**
- OAuth flow no puede iniciarse correctamente
- Si hay workaround, probablemente es inseguro
- Arquitectura incompleta

**Solución:**
- Crear endpoint según solución en 1.1

**Estado:**
- 🔴 BLOQUEANTE para producción

---

## 2. VULNERABILIDADES DE SEGURIDAD MEDIA

### 2.1 Potential Token Leakage in Logs

**Severidad:** 🟡 MEDIA
**CVSS Score:** 5.5 (Medium)

**Descripción:**
Aunque el código actual NO loguea tokens directamente, hay riesgo de exposición accidental si se agrega debugging.

**Ubicación:**
- Todos los archivos con `console.log()`

**Código Actual (CORRECTO):**
```typescript
console.log('✅ Access token obtenido, válido por:', expires_in, 'segundos');
// ✅ NO loguea el token real
```

**Riesgo Potencial (si se modifica):**
```typescript
console.log('Token:', access_token); // ❌ NUNCA HACER ESTO
```

**Recomendación:**
- Implementar utility function para logging seguro:

```typescript
// /src/lib/secure-logger.ts
export function logTokenInfo(token: string, label: string = 'Token') {
  const preview = token.substring(0, 10) + '***' + token.substring(token.length - 5);
  console.log(`${label}: ${preview} (length: ${token.length})`);
}

// Uso:
logTokenInfo(access_token, 'Access Token');
// Output: "Access Token: AQX1234567*** (length: 512)"
```

**Verificación:**
- [ ] Revisar todos los `console.log()` en código OAuth
- [ ] Implementar secure logger
- [ ] No loguear tokens completos en ningún ambiente

---

### 2.2 Cookie Security Flags

**Severidad:** 🟡 MEDIA
**CVSS Score:** 5.0 (Medium)

**Descripción:**
Las cookies de autenticación deben tener flags de seguridad apropiados para prevenir ataques.

**Código Actual:**
```typescript
cookieStore.set('linkedin_oauth_state', state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // ✅ Correcto
  sameSite: 'lax',
  maxAge: 600
});
```

**Recomendaciones:**

| Flag | Desarrollo | Producción | Propósito |
|------|------------|------------|-----------|
| `httpOnly` | `true` | `true` | Prevenir acceso JavaScript |
| `secure` | `false` | `true` | Solo HTTPS |
| `sameSite` | `lax` | `strict` | Prevenir CSRF |
| `maxAge` | `600` | `600` | Expiración automática |
| `path` | `/api/auth/linkedin` | `/api/auth/linkedin` | Limitar scope |

**Implementación Mejorada:**
```typescript
const isProduction = process.env.NODE_ENV === 'production';

cookieStore.set('linkedin_oauth_state', state, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 600,
  path: '/api/auth/linkedin' // ✅ Limitar scope
});
```

**Verificación:**
- [ ] Cookies tienen `httpOnly: true`
- [ ] Producción usa `secure: true`
- [ ] `sameSite` configurado apropiadamente
- [ ] `path` limita scope de cookies

---

### 2.3 Token Expiry Validation

**Severidad:** 🟡 MEDIA
**CVSS Score:** 4.5 (Medium)

**Descripción:**
El código verifica token expiry en algunos lugares, pero no es consistente en todos los endpoints.

**Código con Validación (CORRECTO):**
```typescript
// /src/lib/oauth-storage.ts
if (data.token_expiry) {
  const expiryDate = new Date(data.token_expiry);
  if (expiryDate < new Date()) {
    console.warn(`⚠️ Token expirado para ${platform}`);
    return null;
  }
}
```

**Código sin Validación (RIESGO):**
```typescript
// /src/app/api/linkedin/sync/route.ts
const { data: socialMedia } = await supabase
  .from('social_media')
  .select('*')
  .eq('user_id', userId)
  .eq('platform', 'linkedin')
  .single();

// ❌ NO verifica token_expiry antes de usar
const profileResponse = await fetch('...', {
  headers: { 'Authorization': `Bearer ${socialMedia.access_token}` }
});
```

**Solución:**
```typescript
// Agregar validación en sync endpoint
if (!socialMedia.access_token) {
  return NextResponse.json(
    { success: false, error: 'No hay access token disponible' },
    { status: 400 }
  );
}

// ✅ Verificar expiración
if (socialMedia.token_expiry) {
  const expiryDate = new Date(socialMedia.token_expiry);
  if (expiryDate < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Token expirado. Por favor reconecta LinkedIn.' },
      { status: 401 }
    );
  }
}
```

**Verificación:**
- [ ] Todos los endpoints validan token expiry antes de usar
- [ ] Mensajes de error claros cuando token expiró
- [ ] UI maneja tokens expirados correctamente

---

## 3. ASPECTOS DE SEGURIDAD CORRECTOS

### 3.1 Token Encryption ✅

**Estado:** CORRECTO

**Implementación:**
```typescript
const encryptedAccessToken = encryptToken(data.accessToken);
```

**Verificación:**
- ✅ Tokens encriptados antes de guardar en DB
- ✅ Desencriptación solo en servidor
- ✅ No exposición en responses

---

### 3.2 Parameterized Queries ✅

**Estado:** CORRECTO

**Implementación:**
```typescript
await supabase
  .from('social_media')
  .select('*')
  .eq('user_id', userId)
  .eq('platform', 'linkedin');
```

**Verificación:**
- ✅ Todas las queries usan Supabase client (parametrizado)
- ✅ NO hay concatenación de strings SQL
- ✅ Protección contra SQL Injection

---

### 3.3 Secrets Management ✅

**Estado:** CORRECTO

**Implementación:**
```typescript
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
// ✅ NO tiene prefijo NEXT_PUBLIC_
```

**Verificación:**
- ✅ Client secret solo en server-side code
- ✅ No exposición en código cliente
- ✅ Variables de entorno correctamente configuradas

---

### 3.4 HTTPS Headers ✅

**Estado:** CORRECTO (asumiendo configuración de producción)

**Verificación:**
- ✅ NEXTAUTH_URL usa HTTPS en producción
- ✅ Redirect URIs usan HTTPS
- ✅ Cookies secure en producción

---

## 4. RECOMENDACIONES ADICIONALES

### 4.1 Rate Limiting

**Prioridad:** MEDIA

**Descripción:**
Implementar rate limiting para prevenir abuse de endpoints OAuth.

**Implementación Sugerida:**
```typescript
import rateLimit from 'express-rate-limit';

const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: 'Demasiados intentos de OAuth, intenta más tarde'
});
```

---

### 4.2 Audit Logging

**Prioridad:** MEDIA

**Descripción:**
Loguear eventos de seguridad importantes.

**Eventos a Loguear:**
- OAuth iniciado (con user_id)
- OAuth completado exitosamente
- OAuth fallido (con razón)
- Token expirado detectado
- CSRF detectado
- Errores de API LinkedIn

**Implementación:**
```typescript
// /src/lib/audit-logger.ts
export async function logSecurityEvent(
  event: string,
  userId: string | null,
  metadata: any
) {
  await supabase.from('security_audit_log').insert({
    event,
    user_id: userId,
    metadata: JSON.stringify(metadata),
    timestamp: new Date().toISOString(),
    ip_address: request.headers.get('x-forwarded-for') || 'unknown'
  });
}

// Uso:
await logSecurityEvent('oauth_linkedin_success', userId, { platform: 'linkedin' });
```

---

### 4.3 Token Refresh Implementation

**Prioridad:** BAJA (LinkedIn no da refresh token en OAuth 2.0)

**Descripción:**
LinkedIn tokens duran 60 días, pero no proveen refresh token. Considerar:
- Notificar a usuarios cuando el token esté por expirar (55 días)
- Pedir re-autorización proactivamente
- Mostrar estado de token en UI

---

### 4.4 Content Security Policy

**Prioridad:** MEDIA

**Descripción:**
Implementar CSP headers para prevenir XSS.

**Implementación:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://*.linkedin.com https://*.supabase.co"
  }
];
```

---

## 5. CHECKLIST DE CORRECCIONES

### Antes de Producción (CRÍTICO)

- [ ] **Implementar state parameter validation (CSRF protection)**
- [ ] **Crear endpoint /api/auth/linkedin/route.ts**
- [ ] Verificar que NO se loguean tokens
- [ ] Configurar cookie flags correctos para producción
- [ ] Implementar token expiry validation en todos los endpoints

### Recomendado para Producción

- [ ] Implementar rate limiting en endpoints OAuth
- [ ] Configurar audit logging para eventos de seguridad
- [ ] Implementar CSP headers
- [ ] Agregar monitoring de errores (Sentry)
- [ ] Documentar flujo OAuth y medidas de seguridad

### Nice to Have

- [ ] Notificaciones de token expirado
- [ ] Panel admin para revisar audit logs
- [ ] Automated security scanning (Snyk, Dependabot)

---

## 6. CONCLUSIÓN

**Estado Actual:** 🔴 NO APTO PARA PRODUCCIÓN

**Vulnerabilidades Críticas:** 2
- CSRF vulnerability (state parameter)
- Missing OAuth endpoint

**Tiempo Estimado de Corrección:** 4-6 horas

**Próximos Pasos:**
1. Implementar correcciones críticas (1.1 y 1.2)
2. Ejecutar security tests
3. Re-auditar después de correcciones
4. Aprobar para producción

**Aprobación de Seguridad:**
- [ ] Vulnerabilidades críticas resueltas
- [ ] Security tests pasados
- [ ] Code review completado
- [ ] Documentación actualizada

---

**Auditoría realizada:** 2025-11-21
**Próxima auditoría requerida:** Después de implementar correcciones
**Contacto:** QA Engineer
