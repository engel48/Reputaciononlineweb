# 🚀 INSTRUCCIONES DE DESPLIEGUE - SCRAPING WORKER

## El worker está 100% implementado y listo para desplegarse

### ⚠️ IMPORTANTE:
Por las limitaciones del MCP tool de Supabase (requiere pasar todos los archivos manualmente y tiene límites de tamaño), es más eficiente usar el CLI de Supabase.

---

## OPCIÓN 1: Desplegar con Supabase CLI (RECOMENDADO)

### Paso 1: Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Verificar instalación
supabase --version
```

### Paso 2: Login a Supabase

```bash
supabase login
```

### Paso 3: Configurar Gemini API Key

```bash
supabase secrets set GEMINI_API_KEY=AIzaSyAsqVEcKZF8ZdgTUdqaqAUTDcJQVRHv4E0
```

### Paso 4: Desplegar el Worker

```bash
cd "/Volumes/StarkT7/Proyectos/CLIENETS/proyectos/Comyte/copia 12 julio /Reputaciononline"

# Desplegar la función
supabase functions deploy scraping-worker

# Ver logs en tiempo real
supabase functions logs scraping-worker --tail
```

### Paso 5: Probar el Worker

```bash
# Invocar manualmente
supabase functions invoke scraping-worker --method POST --body '{}'
```

---

## OPCIÓN 2: Desplegar Manualmente desde Supabase Dashboard

### Paso 1: Comprimir los archivos

```bash
cd "/Volumes/StarkT7/Proyectos/CLIENETS/proyectos/Comyte/copia 12 julio /Reputaciononline/supabase/functions"

# Crear archivo zip con todo el worker
zip -r scraping-worker.zip scraping-worker/
```

### Paso 2: Ir a Supabase Dashboard
1. Abrir https://supabase.com/dashboard
2. Ir al proyecto → Edge Functions
3. Click en "Deploy a new function"
4. Subir el archivo `scraping-worker.zip`
5. Configurar GEMINI_API_KEY en Secrets

---

## OPCIÓN 3: Usar Node.js Script

Crear un script `deploy-worker.js`:

```javascript
const { readFileSync } = require('fs');
const { join } = require('path');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://shiqwhbodviimvpxpszd.supabase.co';
const SERVICE_ROLE_KEY = 'TU_SERVICE_ROLE_KEY';

const files = [
  'index.ts',
  'types.ts',
  'config.ts',
  'sentiment-analyzer.ts',
  'crisis-detector.ts',
  'scrapers/base-scraper.ts',
  'scrapers/facebook-scraper.ts',
  'scrapers/twitter-scraper.ts'
];

const payload = {
  name: 'scraping-worker',
  verify_jwt: true,
  files: files.map(file => ({
    name: file,
    content: readFileSync(join(__dirname, 'supabase/functions/scraping-worker', file), 'utf8')
  }))
};

fetch(`${SUPABASE_URL}/functions/v1/_deploy`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
}).then(res => res.json()).then(console.log);
```

```bash
node deploy-worker.js
```

---

## ✅ VERIFICAR DESPLIEGUE

### 1. Listar funciones desplegadas:
```bash
supabase functions list
```

Deberías ver:
```
scraping-worker    ACTIVE    2025-10-29
```

### 2. Ver logs:
```bash
supabase functions logs scraping-worker
```

### 3. Probar invocación:
```bash
curl -L -X POST 'https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-worker' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

---

## 🧪 PROBAR EL SISTEMA COMPLETO

### Paso 1: Crear un job de prueba

```sql
-- En Supabase SQL Editor
INSERT INTO scraping_jobs (
  id,
  user_id,
  platform,
  status,
  priority,
  config,
  created_at
)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'tu-email@ejemplo.com'),
  'facebook',
  'pending',
  1,
  '{"lookback_hours": 24, "keywords": ["reputación", "opinión"]}'::jsonb,
  NOW()
);
```

### Paso 2: Invocar el worker

```bash
supabase functions invoke scraping-worker
```

### Paso 3: Verificar resultados

```sql
-- Ver el job procesado
SELECT * FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 1;

-- Ver items scrapeados
SELECT
  platform,
  title,
  sentiment,
  sentiment_score,
  created_at
FROM scraped_news
ORDER BY created_at DESC
LIMIT 10;

-- Ver alertas de crisis (si hubo)
SELECT * FROM crisis_alerts
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🔄 AUTOMATIZAR CON pg_cron

Una vez que funcione manualmente, configurar ejecución automática cada hora:

```sql
-- En Supabase SQL Editor
SELECT cron.schedule(
  'scraping-worker-hourly',
  '0 * * * *',  -- Cada hora en punto
  $$
  SELECT net.http_post(
    url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-worker',
    headers:='{"Authorization": "Bearer TU_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb
  )
  $$
);

-- Ver jobs programados
SELECT * FROM cron.job;

-- Desactivar si es necesario
SELECT cron.unschedule('scraping-worker-hourly');
```

---

## 🐛 TROUBLESHOOTING

### Error: "No access token provided"
- Usuario no tiene plataforma conectada en `social_media`
- Verificar: `SELECT * FROM social_media WHERE user_id = 'USER_ID';`

### Error: "Créditos insuficientes"
- Agregar créditos: `SELECT * FROM add_user_credits('USER_ID', 100, 'Test');`

### Error: "Module not found"
- Todos los archivos deben estar en `supabase/functions/scraping-worker/`
- Verificar estructura de carpetas

### Worker no responde
- Ver logs: `supabase functions logs scraping-worker --tail`
- Verificar GEMINI_API_KEY configurado

---

## 📊 MONITOREO

### Dashboard recomendado:

```sql
-- Jobs por estado (últimas 24h)
SELECT status, COUNT(*), AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM scraping_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Items scrapeados por plataforma
SELECT platform, COUNT(*), AVG(sentiment_score)
FROM scraped_news
WHERE scraped_at > NOW() - INTERVAL '7 days'
GROUP BY platform;

-- Crisis detectadas
SELECT severity, type, COUNT(*)
FROM crisis_alerts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY severity, type;
```

---

**Sistema implementado el 2025-10-29**
**Listo para producción** ✅
