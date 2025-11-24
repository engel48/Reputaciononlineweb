# Configuración de Cron Job en Supabase

**Fecha**: 2025-01-24
**Estado**: ✅ Configurado y Activo

---

## ✅ Cron Job Configurado Exitosamente

El cron job para auto-renovación de tokens OAuth ha sido configurado en Supabase usando **pg_cron**.

### Detalles del Cron Job:

```
Job ID: 5
Nombre: token-refresh-job
Programación: 0 */6 * * *
Descripción: Ejecuta cada 6 horas (00:00, 06:00, 12:00, 18:00 UTC)
Estado: ACTIVO ✅
Base de Datos: postgres
Comando: SELECT trigger_token_refresh()
```

---

## 🔧 Configuración Requerida en Supabase

Para que el cron job funcione correctamente, necesitas configurar 2 variables en Supabase:

### Opción 1: Configurar via SQL (Recomendado)

Ejecuta estos comandos en el **SQL Editor** de Supabase:

```sql
-- Configurar URL de tu API (CAMBIAR A TU DOMINIO REAL)
ALTER DATABASE postgres SET app.api_url = 'https://reputaciononline.com.co/api/cron/refresh-tokens';

-- Configurar clave secreta del cron (CAMBIAR A UNA CLAVE SEGURA)
ALTER DATABASE postgres SET app.cron_secret = 'TU-CLAVE-SECRETA-AQUI';

-- Verificar configuración
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'app.%';
```

### Opción 2: Configurar via Dashboard

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **Settings** → **Database** → **Connection string**
3. Copia la conexión y úsala con `psql` para ejecutar los comandos de Opción 1

---

## 🎯 Configuración Recomendada

### URL de API:

**Desarrollo**:
```
https://tu-dominio-coolify.com/api/cron/refresh-tokens
```

**Producción**:
```
https://reputaciononline.com.co/api/cron/refresh-tokens
```

### Clave Secreta (CRON_SECRET_KEY):

⚠️ **IMPORTANTE**: Usa la MISMA clave que tienes en tu `.env.local`:

```bash
# De tu .env.local
CRON_SECRET_KEY=dev-cron-secret-key-2025

# CAMBIAR EN PRODUCCIÓN a algo como:
CRON_SECRET_KEY=prod-super-secret-cron-2025-XYZ789ABC
```

---

## 🧪 Probar el Cron Job

### Test 1: Ejecución Manual

Ejecuta la función manualmente para probar:

```sql
-- Ejecutar manualmente
SELECT trigger_token_refresh();

-- Ver logs del resultado
SELECT * FROM system_logs
WHERE event_type IN ('cron_token_refresh', 'cron_token_refresh_error')
ORDER BY created_at DESC
LIMIT 5;
```

### Test 2: Verificar Próxima Ejecución

```sql
-- Ver historial de ejecuciones
SELECT
  jobid,
  jobname,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobname = 'token-refresh-job'
ORDER BY start_time DESC
LIMIT 10;
```

### Test 3: Verificar desde la API

```bash
# Probar endpoint directamente (desde tu terminal o Postman)
curl -X POST https://reputaciononline.com.co/api/cron/refresh-tokens \
  -H "Authorization: Bearer TU-CLAVE-SECRETA" \
  -H "Content-Type: application/json"
```

---

## 📊 Monitoreo del Cron Job

### Ver Estado Actual:

```sql
-- Ver configuración del job
SELECT * FROM cron.job WHERE jobname = 'token-refresh-job';

-- Ver últimas 20 ejecuciones
SELECT
  start_time,
  end_time,
  status,
  return_message,
  EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds
FROM cron.job_run_details
WHERE jobname = 'token-refresh-job'
ORDER BY start_time DESC
LIMIT 20;
```

### Ver Logs del Sistema:

```sql
-- Ver todos los logs de token refresh
SELECT
  id,
  event_type,
  details,
  created_at
FROM system_logs
WHERE event_type LIKE '%token_refresh%'
ORDER BY created_at DESC
LIMIT 50;

-- Ver solo errores
SELECT
  id,
  details->>'error' as error_message,
  created_at
FROM system_logs
WHERE event_type = 'cron_token_refresh_error'
ORDER BY created_at DESC;
```

---

## 🛠️ Gestión del Cron Job

### Pausar el Cron Job:

```sql
-- Desactivar temporalmente
UPDATE cron.job
SET active = false
WHERE jobname = 'token-refresh-job';
```

### Reactivar el Cron Job:

```sql
-- Reactivar
UPDATE cron.job
SET active = true
WHERE jobname = 'token-refresh-job';
```

### Cambiar Frecuencia:

```sql
-- Cambiar a cada 3 horas
SELECT cron.schedule(
  'token-refresh-job',
  '0 */3 * * *',
  $$SELECT trigger_token_refresh()$$
);

-- Cambiar a cada 12 horas
SELECT cron.schedule(
  'token-refresh-job',
  '0 */12 * * *',
  $$SELECT trigger_token_refresh()$$
);

-- Cambiar a diario a las 2 AM
SELECT cron.schedule(
  'token-refresh-job',
  '0 2 * * *',
  $$SELECT trigger_token_refresh()$$
);
```

### Eliminar el Cron Job:

```sql
-- Eliminar completamente
SELECT cron.unschedule('token-refresh-job');
```

---

## 🔍 Troubleshooting

### Problema 1: Cron no ejecuta

**Síntomas**: No aparecen logs en `system_logs`

**Solución**:
```sql
-- Verificar que el job está activo
SELECT * FROM cron.job WHERE jobname = 'token-refresh-job';

-- Si active = false, reactivar
UPDATE cron.job SET active = true WHERE jobname = 'token-refresh-job';

-- Ejecutar manualmente para probar
SELECT trigger_token_refresh();
```

### Problema 2: Error de autenticación

**Síntomas**: Logs muestran error 401

**Solución**:
```sql
-- Verificar configuración de clave secreta
SELECT current_setting('app.cron_secret', true);

-- Si es NULL o incorrecta, actualizar
ALTER DATABASE postgres SET app.cron_secret = 'TU-CLAVE-CORRECTA';

-- Verificar que coincide con .env.local
-- CRON_SECRET_KEY en .env.local debe ser igual a app.cron_secret
```

### Problema 3: Error de conexión HTTP

**Síntomas**: Logs muestran error de timeout o conexión

**Solución**:
```sql
-- Verificar URL configurada
SELECT current_setting('app.api_url', true);

-- Si es incorrecta, actualizar
ALTER DATABASE postgres SET app.api_url = 'https://TU-DOMINIO-CORRECTO.com/api/cron/refresh-tokens';

-- Probar URL manualmente con curl
-- curl -X POST https://TU-DOMINIO.com/api/cron/refresh-tokens \
--   -H "Authorization: Bearer TU-CLAVE"
```

### Problema 4: Extensión http no disponible

**Síntomas**: Error "function http() does not exist"

**Solución**:
```sql
-- Habilitar extensión http
CREATE EXTENSION IF NOT EXISTS http;

-- Verificar que está habilitada
SELECT * FROM pg_extension WHERE extname = 'http';
```

---

## 📈 Métricas de Éxito

### Indicadores Clave:

```sql
-- Total de ejecuciones exitosas
SELECT
  COUNT(*) as total_executions,
  COUNT(*) FILTER (WHERE event_type = 'cron_token_refresh') as successful,
  COUNT(*) FILTER (WHERE event_type = 'cron_token_refresh_error') as failed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'cron_token_refresh') / NULLIF(COUNT(*), 0), 2) as success_rate
FROM system_logs
WHERE event_type LIKE '%token_refresh%'
  AND created_at > NOW() - INTERVAL '7 days';

-- Promedio de duración
SELECT
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) as avg_duration_seconds,
  MIN(EXTRACT(EPOCH FROM (end_time - start_time))) as min_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (end_time - start_time))) as max_duration_seconds
FROM cron.job_run_details
WHERE jobname = 'token-refresh-job'
  AND start_time > NOW() - INTERVAL '7 days';
```

---

## 🎯 Próxima Ejecución Programada

El cron job se ejecutará automáticamente cada 6 horas en:
- **00:00 UTC** (7:00 PM Colombia)
- **06:00 UTC** (1:00 AM Colombia)
- **12:00 UTC** (7:00 AM Colombia)
- **18:00 UTC** (1:00 PM Colombia)

Para calcular la próxima ejecución:

```sql
-- Ver próxima ejecución calculada
SELECT
  jobname,
  schedule,
  CASE
    WHEN EXTRACT(HOUR FROM NOW()) < 6 THEN
      DATE_TRUNC('day', NOW()) + INTERVAL '6 hours'
    WHEN EXTRACT(HOUR FROM NOW()) < 12 THEN
      DATE_TRUNC('day', NOW()) + INTERVAL '12 hours'
    WHEN EXTRACT(HOUR FROM NOW()) < 18 THEN
      DATE_TRUNC('day', NOW()) + INTERVAL '18 hours'
    ELSE
      DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
  END as next_run_approx
FROM cron.job
WHERE jobname = 'token-refresh-job';
```

---

## 📝 Checklist de Configuración

- [ ] Extensiones habilitadas (pg_cron ✅, http ✅)
- [ ] Cron job creado (job ID: 5 ✅)
- [ ] Variables configuradas en Supabase:
  - [ ] `app.api_url` = tu dominio de Coolify
  - [ ] `app.cron_secret` = misma clave que .env.local
- [ ] Test manual ejecutado exitosamente
- [ ] Verificar logs en `system_logs`
- [ ] Confirmar ejecución automática en próximas 6 horas

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard**: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd
- **pg_cron Documentation**: https://github.com/citusdata/pg_cron
- **API Endpoint**: https://reputaciononline.com.co/api/cron/refresh-tokens
- **Documentación Completa**: Ver `IMPLEMENTATION_NOTES.md`

---

## ✅ Estado Final

```
✅ Cron Job: CONFIGURADO Y ACTIVO
✅ Extensiones: pg_cron (1.6.4), http (1.6)
✅ Tabla de Logs: system_logs creada
✅ Función: trigger_token_refresh() creada
⚠️  Pendiente: Configurar variables (app.api_url, app.cron_secret)
```

**Último Paso**: Ejecuta la configuración de variables SQL (sección 🔧) y estará 100% operacional.

---

*Generado automáticamente el 2025-01-24*
*Migración aplicada: setup_token_refresh_cron_job*
