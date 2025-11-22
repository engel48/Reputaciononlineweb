# LINKEDIN OAUTH - PRODUCTION READINESS CHECKLIST

**Proyecto:** Reputación Online
**Componente:** LinkedIn OAuth Integration
**Fecha de Inicio:** ___________
**Fecha Target Producción:** ___________
**Responsable:** ___________

---

## INSTRUCCIONES DE USO

1. Imprime este documento o marca checkboxes digitalmente
2. Completa cada sección en orden
3. Documenta fecha y responsable en cada item
4. NO marques como completo sin verificación
5. Todos los items CRÍTICOS deben estar completos antes de producción

**Leyenda:**
- 🔴 CRÍTICO = Bloqueante para producción
- 🟡 ALTA = Recomendado antes de producción
- 🟢 MEDIA = Nice to have, puede hacerse después

---

## FASE 1: CORRECCIONES DE SEGURIDAD (4-6 horas)

### 1.1 CSRF Protection Implementation 🔴 CRÍTICO

**Responsable:** ___________
**Fecha Inicio:** ___________
**Fecha Completado:** ___________

- [ ] **Crear archivo:** `/src/app/api/auth/linkedin/route.ts`
  - [ ] Implementar generación de state con `crypto.randomUUID()`
  - [ ] Guardar state en cookie HTTP-only
  - [ ] Configurar cookie con flags de seguridad
  - [ ] Construir URL de autorización LinkedIn
  - [ ] Agregar state parameter a URL
  - [ ] Redirigir a LinkedIn

**Código de Referencia:** `LINKEDIN_SECURITY_AUDIT.md` - Sección 1.1

**Verificación:**
```typescript
// El archivo debe contener:
const state = crypto.randomUUID();
cookieStore.set('linkedin_oauth_state', state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 600
});
```

**Test de Validación:**
- [ ] Ejecutar test: `LNKD-SEC-003` (State Parameter Validation)
- [ ] Resultado: ✅ PASS / ❌ FAIL

---

- [ ] **Modificar archivo:** `/src/app/api/auth/linkedin/callback/route.ts`
  - [ ] Agregar extracción de state del query parameter
  - [ ] Obtener state guardado de cookie
  - [ ] Validar que ambos coinciden
  - [ ] Rechazar OAuth si no coinciden
  - [ ] Eliminar cookie de state después de uso
  - [ ] Agregar logs para CSRF detectado

**Código a Agregar:**
```typescript
const receivedState = searchParams.get('state');
const savedState = cookieStore.get('linkedin_oauth_state')?.value;

if (!receivedState || receivedState !== savedState) {
  console.error('❌ CSRF detected: state mismatch');
  return NextResponse.redirect('...?error=csrf_detected');
}

cookieStore.delete('linkedin_oauth_state');
```

**Test de Validación:**
- [ ] Ejecutar test: `LNKD-OAUTH-002` (State Parameter)
- [ ] Intentar OAuth con state modificado
- [ ] Resultado: Debe rechazar con error CSRF
- [ ] Verificar: ✅ PASS / ❌ FAIL

---

### 1.2 Token Expiry Validation 🔴 CRÍTICO

**Responsable:** ___________
**Fecha Completado:** ___________

- [ ] **Modificar:** `/src/app/api/linkedin/sync/route.ts`
  - [ ] Agregar validación de token_expiry antes de usar
  - [ ] Retornar error 401 si token expiró
  - [ ] Mensaje claro: "Token expirado. Por favor reconecta LinkedIn."

**Código a Agregar (línea ~62):**
```typescript
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

**Test de Validación:**
- [ ] Ejecutar test: `LNKD-SYNC-002` (Expired Token)
- [ ] Resultado: ✅ PASS / ❌ FAIL

---

- [ ] **Modificar:** `/src/app/api/linkedin/dashboard/route.ts`
  - [ ] Agregar validación de token_expiry
  - [ ] Retornar error 401 si token expiró
  - [ ] Mensaje consistente con sync endpoint

**Test de Validación:**
- [ ] GET `/api/linkedin/dashboard` con token expirado
- [ ] Resultado esperado: Error 401
- [ ] Verificar: ✅ PASS / ❌ FAIL

---

### 1.3 Cookie Security Flags 🟡 ALTA

**Responsable:** ___________
**Fecha Completado:** ___________

- [ ] **Actualizar configuración de cookies:**
  - [ ] `httpOnly: true` en todas las cookies OAuth
  - [ ] `secure: true` en producción
  - [ ] `sameSite: 'strict'` en producción
  - [ ] `path: '/api/auth/linkedin'` para limitar scope

**Código de Referencia:** `LINKEDIN_SECURITY_AUDIT.md` - Sección 2.2

**Verificación en Producción:**
- [ ] Inspeccionar cookies en DevTools
- [ ] Verificar flags: Secure, HttpOnly, SameSite
- [ ] Resultado: ✅ PASS / ❌ FAIL

---

### 1.4 Secrets Exposure Check 🔴 CRÍTICO

**Responsable:** ___________
**Fecha Completado:** ___________

- [ ] **Verificar que NO se exponen secrets:**
  - [ ] `LINKEDIN_CLIENT_SECRET` NO tiene prefijo `NEXT_PUBLIC_`
  - [ ] Buscar en código cliente: `grep -r "CLIENT_SECRET" src/app/ src/components/`
  - [ ] Resultado debe ser: 0 coincidencias
  - [ ] Verificar logs no contienen tokens completos
  - [ ] Verificar responses JSON no incluyen secrets

**Comando de Verificación:**
```bash
grep -r "LINKEDIN_CLIENT_SECRET" src/app/ src/components/
# Debe retornar: (vacío)

grep -r "NEXT_PUBLIC_LINKEDIN_CLIENT_SECRET" .
# Debe retornar: (vacío)
```

**Resultado:** ✅ PASS / ❌ FAIL

---

## FASE 2: TESTING EXHAUSTIVO (12-15 horas)

### 2.1 Pre-Testing Validation (1 hora)

**Responsable:** ___________
**Fecha:** ___________

- [ ] **Archivos Implementados:**
  - [ ] `/src/app/api/auth/linkedin/route.ts` existe
  - [ ] `/src/app/api/auth/linkedin/callback/route.ts` existe
  - [ ] `/src/lib/oauth/linkedin.ts` existe
  - [ ] `/src/app/api/linkedin/sync/route.ts` existe
  - [ ] `/src/app/api/linkedin/dashboard/route.ts` existe
  - [ ] `/src/lib/oauth-storage.ts` existe
  - [ ] `/src/lib/encryption.ts` existe

- [ ] **Variables de Entorno Configuradas:**
  - [ ] `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` configurado
  - [ ] `LINKEDIN_CLIENT_SECRET` configurado
  - [ ] `NEXTAUTH_URL` configurado correctamente
  - [ ] `JWT_SECRET` configurado
  - [ ] `ENCRYPTION_KEY` tiene >= 32 caracteres
  - [ ] `SUPABASE_URL` configurado
  - [ ] `SUPABASE_ANON_KEY` configurado

- [ ] **LinkedIn Developer App:**
  - [ ] Client ID coincide con `.env.local`
  - [ ] Client Secret coincide con `.env.local`
  - [ ] Redirect URI configurado: `[NEXTAUTH_URL]/api/auth/linkedin/callback`
  - [ ] Scopes aprobados: `openid`, `profile`, `email`
  - [ ] Aplicación en modo "Production"

- [ ] **Base de Datos:**
  - [ ] Tabla `social_media` existe
  - [ ] Tabla `mentions` existe
  - [ ] Tabla `user_stats` existe (opcional)
  - [ ] Indexes creados (ver sección 5.2)

**Resultado General:** ✅ READY / ❌ NOT READY

---

### 2.2 OAuth Flow Testing (3 horas)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-OAUTH-001: OAuth Flow Completo 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Iniciar sesión en aplicación
- [ ] Navegar a dashboard de redes sociales
- [ ] Click "Conectar LinkedIn"
- [ ] Redirección a LinkedIn completa
- [ ] Autorizar en LinkedIn
- [ ] Callback procesa código correctamente
- [ ] Access token obtenido
- [ ] Perfil de usuario obtenido
- [ ] Datos guardados en Supabase
- [ ] Redirección final con `?success=linkedin`
- [ ] Estado LinkedIn muestra "Conectado"

**Tiempo de Ejecución:** _____ segundos (debe ser < 10s)
**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-OAUTH-002: State Parameter Validation 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Iniciar OAuth flow
- [ ] Capturar state parameter de URL
- [ ] Verificar state en cookie
- [ ] Completar OAuth normalmente → debe funcionar
- [ ] Intentar OAuth con state modificado → debe rechazar
- [ ] Verificar mensaje de error CSRF

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-OAUTH-003: Token Exchange 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Completar OAuth hasta callback
- [ ] Verificar request a LinkedIn token endpoint
- [ ] Verificar response contiene `access_token`
- [ ] Verificar `expires_in` es correcto (~5184000)
- [ ] Probar con código inválido → debe fallar

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-OAUTH-004: Profile Fetch 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Token obtenido correctamente
- [ ] Request a `/v2/userinfo` exitoso
- [ ] Response contiene: `sub`, `name`, `email`
- [ ] Datos se guardan en `profile_data`

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

### 2.3 Data Storage Testing (2 horas)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-STORAGE-001: Token Storage 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Completar OAuth flow
- [ ] Verificar registro en tabla `social_media`
- [ ] Verificar `user_id` correcto
- [ ] Verificar `platform` = 'linkedin'
- [ ] Verificar `access_token` está encriptado (no legible)
- [ ] Verificar `token_expiry` es fecha futura
- [ ] Verificar `connected` = true
- [ ] Verificar `profile_data` contiene JSON válido

**Query SQL:**
```sql
SELECT * FROM social_media
WHERE platform = 'linkedin'
ORDER BY created_at DESC LIMIT 1;
```

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-STORAGE-002: Encryption 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Token guardado está encriptado
- [ ] Token NO comienza con "AQX" (prefijo LinkedIn)
- [ ] Desencriptación funciona (sync endpoint lee token)
- [ ] Ejecutar script de prueba: `/scripts/test-encryption.js`

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-STORAGE-003: Duplicate Prevention 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Primera conexión crea registro
- [ ] Contar registros: debe ser 1
- [ ] Segunda conexión (reconectar)
- [ ] Contar registros: debe seguir siendo 1 (no duplicado)
- [ ] Verificar `updated_at` cambió

**Query SQL:**
```sql
SELECT COUNT(*) FROM social_media
WHERE platform = 'linkedin' AND user_id = '[USER_ID]';
-- Debe retornar: 1
```

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-STORAGE-004: Token Expiry Calculation 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Verificar `token_expiry` en DB
- [ ] Calcular días hasta expiración
- [ ] Debe ser aproximadamente 60 días
- [ ] Formato ISO 8601 correcto

**Query SQL:**
```sql
SELECT
  token_expiry,
  EXTRACT(DAY FROM (token_expiry - created_at)) as days_until_expiry
FROM social_media WHERE platform = 'linkedin';
-- days_until_expiry ≈ 60
```

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

### 2.4 Sync Endpoint Testing (3 horas)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-SYNC-001: Successful Sync 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] LinkedIn conectado con token válido
- [ ] POST `/api/linkedin/sync` con body: `{"maxPosts": 10}`
- [ ] Response status: 200 OK
- [ ] Response contiene: `posts_processed`, `comments_processed`, `mentions_created`
- [ ] Verificar menciones en tabla `mentions`
- [ ] Verificar `last_sync` actualizado en `social_media`

**Tiempo de Ejecución:** _____ segundos (debe ser < 30s para 10 posts)

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-SYNC-002: Expired Token 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Modificar `token_expiry` a fecha pasada en DB
- [ ] POST `/api/linkedin/sync`
- [ ] Response status: 401 Unauthorized
- [ ] Mensaje: "Token expirado. Por favor reconecta LinkedIn."

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-SYNC-003: Sentiment Analysis 🟢 MEDIA

- [ ] **Ejecutado:** Sí / No
- [ ] Ejecutar sync con posts reales
- [ ] Verificar menciones en DB
- [ ] Validar sentimiento asignado es correcto (> 75% accuracy)
- [ ] Verificar sentiment_score en rango razonable

**Query SQL:**
```sql
SELECT content, metadata->>'sentiment', metadata->>'sentiment_score'
FROM mentions WHERE platform = 'linkedin' LIMIT 10;
```

**Resultado:** ✅ PASS / ❌ FAIL
**Accuracy:** _____% (meta: > 75%)
**Notas:** _________________________________________________

---

#### Test LNKD-SYNC-004: Duplicate Prevention 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Primera sync: capturar `mentions_created`
- [ ] Contar menciones en DB
- [ ] Segunda sync (inmediata, sin cambios)
- [ ] `mentions_created` debe ser 0
- [ ] Contar menciones en DB: debe ser igual

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

### 2.5 Dashboard Endpoint Testing (1 hora)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-DASH-001: Dashboard Data Accuracy 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] LinkedIn conectado con datos sincronizados
- [ ] GET `/api/linkedin/dashboard`
- [ ] Response status: 200 OK
- [ ] Verificar estructura de response completa
- [ ] Validar cálculos:
  - [ ] `total_mentions` coincide con DB
  - [ ] `positive_mentions` coincide con DB
  - [ ] `sentiment_distribution` suma 100%
  - [ ] `reputation_score` en rango 0-100
  - [ ] `trends.last_7_days` tiene 7 elementos
  - [ ] `recent_mentions` tiene máximo 20 elementos

**Tiempo de Ejecución:** _____ segundos (debe ser < 2s)

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-DASH-002: Dashboard No Data 🟢 MEDIA

- [ ] **Ejecutado:** Sí / No
- [ ] Limpiar menciones de testing
- [ ] GET `/api/linkedin/dashboard`
- [ ] Response status: 200 OK
- [ ] `total_mentions` = 0
- [ ] `reputation_score` = 50 (default)
- [ ] Arrays vacíos en lugar de null

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

#### Test LNKD-DASH-003: Trends Validation 🟢 MEDIA

- [ ] **Ejecutado:** Sí / No
- [ ] Verificar `trends.last_7_days` array
- [ ] Array tiene exactamente 7 elementos
- [ ] Fechas consecutivas (hoy - 6 días)
- [ ] Formato: `YYYY-MM-DD`
- [ ] Para cada día: `total = positive + negative + neutral`

**Resultado:** ✅ PASS / ❌ FAIL
**Notas:** _________________________________________________

---

### 2.6 Error Handling Testing (1 hora)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-ERROR-001: LinkedIn Not Connected 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Desconectar LinkedIn (set `connected = false`)
- [ ] POST `/api/linkedin/sync` → Error 400
- [ ] GET `/api/linkedin/dashboard` → Error 400
- [ ] Mensajes claros: "LinkedIn no está conectado"

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-ERROR-002: Invalid JWT 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Request sin cookie `auth-token` → Error 401
- [ ] Request con token inválido → Error 401
- [ ] No se ejecuta lógica de negocio

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-ERROR-003: LinkedIn API Errors 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Modificar access_token a valor inválido
- [ ] Ejecutar sync → Error capturado
- [ ] Logs muestran error detallado
- [ ] Usuario recibe mensaje claro

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-ERROR-004: Database Errors 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Simular error de Supabase (URL inválida temporalmente)
- [ ] Error 500 con mensaje genérico
- [ ] No exposición de detalles internos

**Resultado:** ✅ PASS / ❌ FAIL

---

### 2.7 Security Testing (1 hora)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-SEC-001: Token Encryption 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Completar OAuth
- [ ] Inspeccionar `access_token` en DB directamente
- [ ] Token NO comienza con "AQX"
- [ ] Token NO es legible
- [ ] Token length > 100 caracteres
- [ ] No hay tokens en logs del servidor

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-SEC-002: SQL Injection 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Verificar código usa queries parametrizadas
- [ ] Buscar concatenación de SQL: debe ser 0
- [ ] Intentar injection en parameters → debe fallar

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-SEC-003: CSRF Protection 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] State parameter generado correctamente
- [ ] State guardado en cookie HTTP-only
- [ ] Callback valida state
- [ ] OAuth rechazado si state no coincide

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-SEC-004: Secrets Exposure 🔴 CRÍTICO

- [ ] **Ejecutado:** Sí / No
- [ ] Buscar `LINKEDIN_CLIENT_SECRET` en código cliente → 0 resultados
- [ ] Verificar responses JSON no incluyen secrets
- [ ] Verificar logs no exponen tokens completos

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-SEC-005: HTTPS Enforcement 🟡 ALTA (Solo Producción)

- [ ] **Ejecutado:** Sí / No
- [ ] Redirect URI usa HTTPS
- [ ] Cookies tienen flag `Secure: true`
- [ ] No downgrade a HTTP

**Resultado:** ✅ PASS / ❌ FAIL

---

### 2.8 Performance Testing (1 hora)

**Responsable:** ___________
**Fecha:** ___________

#### Test LNKD-PERF-001: OAuth Performance 🟢 MEDIA

- [ ] **Ejecutado:** Sí / No
- [ ] Medir tiempo total de OAuth flow
- [ ] Debe ser < 10 segundos (automático)
- [ ] Sin timeouts

**Tiempo Medido:** _____ segundos
**Resultado:** ✅ PASS (< 10s) / ❌ FAIL

---

#### Test LNKD-PERF-002: Sync Performance 🟢 MEDIA

- [ ] **Ejecutado:** Sí / No
- [ ] Sync con 5 posts: < 10 segundos
- [ ] Sync con 20 posts: < 30 segundos
- [ ] Sync con 50 posts: < 60 segundos

**Tiempos Medidos:**
- 5 posts: _____ s
- 20 posts: _____ s
- 50 posts: _____ s

**Resultado:** ✅ PASS / ❌ FAIL

---

#### Test LNKD-PERF-003: Dashboard Performance 🟡 ALTA

- [ ] **Ejecutado:** Sí / No
- [ ] Dashboard con 0 menciones: < 0.5s
- [ ] Dashboard con 100 menciones: < 1s
- [ ] Dashboard con 500 menciones: < 2s

**Tiempos Medidos:**
- 0 menciones: _____ s
- 100 menciones: _____ s
- 500 menciones: _____ s

**Resultado:** ✅ PASS / ❌ FAIL

---

## FASE 3: OPTIMIZACIONES (6-8 horas) - OPCIONAL

### 3.1 Database Indexes 🟡 ALTA

**Responsable:** ___________
**Fecha:** ___________

- [ ] **Crear indexes:**
  ```sql
  CREATE INDEX IF NOT EXISTS idx_social_media_user_platform
  ON social_media(user_id, platform);

  CREATE INDEX IF NOT EXISTS idx_mentions_user_platform
  ON mentions(user_id, platform);

  CREATE INDEX IF NOT EXISTS idx_mentions_published_at
  ON mentions(published_at DESC);

  CREATE INDEX IF NOT EXISTS idx_mentions_sentiment
  ON mentions((metadata->>'sentiment'));
  ```

- [ ] Verificar mejora de performance en queries

**Resultado:** ✅ DONE / ❌ PENDING

---

### 3.2 Rate Limiting 🟡 ALTA

**Responsable:** ___________
**Fecha:** ___________

- [ ] Implementar rate limiting en endpoints OAuth
- [ ] Límite: 5 intentos por 15 minutos por IP
- [ ] Mensaje claro cuando se alcanza límite

**Resultado:** ✅ DONE / ❌ PENDING

---

### 3.3 Caching Implementation 🟢 MEDIA

**Responsable:** ___________
**Fecha:** ___________

- [ ] Implementar cache en dashboard endpoint
- [ ] TTL: 5 minutos
- [ ] Invalidar cache al hacer sync

**Resultado:** ✅ DONE / ❌ PENDING

---

### 3.4 Audit Logging 🟡 ALTA

**Responsable:** ___________
**Fecha:** ___________

- [ ] Crear tabla `security_audit_log`
- [ ] Loguear eventos:
  - [ ] OAuth iniciado
  - [ ] OAuth completado
  - [ ] OAuth fallido
  - [ ] Token expirado detectado
  - [ ] CSRF detectado

**Resultado:** ✅ DONE / ❌ PENDING

---

## FASE 4: PRODUCTION DEPLOYMENT

### 4.1 Environment Configuration 🔴 CRÍTICO

**Responsable:** ___________
**Fecha:** ___________

- [ ] **Variables de entorno en producción:**
  - [ ] `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` configurado
  - [ ] `LINKEDIN_CLIENT_SECRET` configurado
  - [ ] `NEXTAUTH_URL` apunta a dominio de producción (HTTPS)
  - [ ] `JWT_SECRET` diferente a desarrollo
  - [ ] `ENCRYPTION_KEY` >= 32 caracteres
  - [ ] `SUPABASE_URL` producción
  - [ ] `SUPABASE_ANON_KEY` producción

- [ ] **LinkedIn Developer App (Producción):**
  - [ ] Redirect URI actualizado: `https://tudominio.com/api/auth/linkedin/callback`
  - [ ] Scopes aprobados
  - [ ] Aplicación en modo "Production"

**Resultado:** ✅ READY / ❌ NOT READY

---

### 4.2 Monitoring & Alerts 🟡 ALTA

**Responsable:** ___________
**Fecha:** ___________

- [ ] Error tracking configurado (Sentry/LogRocket)
- [ ] Alertas para:
  - [ ] OAuth failures (> 5% tasa de error)
  - [ ] Token expiry errors
  - [ ] CSRF attempts
  - [ ] Sync failures
  - [ ] Performance degradation

**Resultado:** ✅ DONE / ❌ PENDING

---

### 4.3 Backup & Recovery 🟡 ALTA

**Responsable:** ___________
**Fecha:** ___________

- [ ] Backup de base de datos configurado
- [ ] Frecuencia: Diaria
- [ ] Retención: 30 días
- [ ] Rollback plan documentado
- [ ] Disaster recovery plan documentado

**Resultado:** ✅ DONE / ❌ PENDING

---

### 4.4 Documentation 🟢 MEDIA

**Responsable:** ___________
**Fecha:** ___________

- [ ] README actualizado con instrucciones LinkedIn
- [ ] Variables de entorno documentadas
- [ ] Troubleshooting guide accesible
- [ ] API endpoints documentados
- [ ] Runbook para equipo de soporte

**Resultado:** ✅ DONE / ❌ PENDING

---

## DECISIÓN FINAL GO/NO-GO

**Fecha de Evaluación:** ___________
**Evaluadores:** _________________________________________________

### Criterios de Aprobación

| Criterio | Status | Bloqueante | Verificado Por |
|----------|--------|------------|----------------|
| Vulnerabilidades Críticas Resueltas | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| OAuth Flow Completo Funcional | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| State Parameter Implementado | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| Todos los Tests CRÍTICOS Pasados | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| Tokens Encriptados Correctamente | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| Error Handling Implementado | [ ] ✅ [ ] ❌ | NO | ___________ |
| Performance Aceptable | [ ] ✅ [ ] ❌ | SEMI | ___________ |
| Environment Producción Configurado | [ ] ✅ [ ] ❌ | SÍ | ___________ |
| Monitoring Configurado | [ ] ✅ [ ] ❌ | NO | ___________ |
| Documentation Completa | [ ] ✅ [ ] ❌ | NO | ___________ |

### Decisión

**[ ] GO - APROBAR PARA PRODUCCIÓN**

Condiciones:
- Todos los items BLOQUEANTES están ✅
- Al menos 90% de tests CRÍTICOS pasados
- Performance dentro de benchmarks
- Equipo listo para monitorear primeras 24 horas

**[ ] NO-GO - NO APROBAR**

Razones:
_________________________________________________
_________________________________________________
_________________________________________________

**Fecha de Re-evaluación:** ___________

---

### Firmas

**Tech Lead:** _____________________ Fecha: _____
**QA Lead:** _____________________ Fecha: _____
**Security Engineer:** _____________________ Fecha: _____
**Product Manager:** _____________________ Fecha: _____

---

## POST-DEPLOYMENT VALIDATION

**Responsable:** ___________
**Fecha de Deploy:** ___________

### Primeras 24 Horas

- [ ] **Hora 1:** OAuth flow probado en producción
- [ ] **Hora 2:** Sync ejecutado exitosamente
- [ ] **Hora 4:** Dashboard cargando correctamente
- [ ] **Hora 8:** Sin errores críticos en logs
- [ ] **Hora 24:** Métricas de éxito validadas

### Métricas de Éxito (Primeros 7 Días)

| Métrica | Target | Actual | Status |
|---------|--------|--------|--------|
| OAuth success rate | > 95% | _____% | [ ] ✅ [ ] ❌ |
| Sync success rate | > 90% | _____% | [ ] ✅ [ ] ❌ |
| Dashboard load time (p95) | < 2s | _____s | [ ] ✅ [ ] ❌ |
| Error rate | < 1% | _____% | [ ] ✅ [ ] ❌ |
| User satisfaction | > 4/5 | _____/5 | [ ] ✅ [ ] ❌ |

### Issues Post-Deployment

| Issue | Severity | Fecha Detectado | Fecha Resuelto | Responsable |
|-------|----------|-----------------|----------------|-------------|
| | | | | |
| | | | | |
| | | | | |

---

**Última Actualización:** 2025-11-21
**Versión:** 1.0
**Estado:** LISTO PARA USO
