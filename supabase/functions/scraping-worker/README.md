# Scraping Worker - Sistema Real de Monitoreo

## ✅ IMPLEMENTACIÓN COMPLETA

### Componentes Implementados:

#### 1. **Migraciones SQL (100% aplicadas)**
- ✅ `fix_subscriptions_table` - Corrección de tabla subscriptions
- ✅ `fix_payments_table` - Corrección de tabla payments
- ✅ `credit_functions` - 4 funciones SQL críticas para créditos
- ✅ `subscription_functions` - 4 funciones para gestión de suscripciones
- ✅ `fix_scraping_jobs` - Campos necesarios para el worker
- ✅ `crisis_tables` - Tabla crisis_alerts con RLS y indices

#### 2. **Scraping Worker (100% completado)**
- ✅ `index.ts` - Orquestador principal (530 líneas)
- ✅ `types.ts` - Interfaces TypeScript completas
- ✅ `config.ts` - Configuración y constantes
- ✅ `sentiment-analyzer.ts` - Análisis con Gemini AI + fallback
- ✅ `crisis-detector.ts` - Detección automática de crisis (5 tipos)
- ✅ `scrapers/base-scraper.ts` - Clase base abstracta
- ✅ `scrapers/facebook-scraper.ts` - Scraper de Facebook/Instagram
- ✅ `scrapers/twitter-scraper.ts` - Scraper de Twitter/X

---

## 📋 DESPLIEGUE DEL WORKER

### Paso 1: Verificar Supabase CLI

```bash
# Verificar que estás logueado
supabase status

# Si no estás logueado:
supabase login
```

### Paso 2: Configurar Variables de Entorno

Agregar en Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```
GEMINI_API_KEY=AIzaSyAsqVEcKZF8ZdgTUdqaqAUTDcJQVRHv4E0
```

O desde CLI:

```bash
supabase secrets set GEMINI_API_KEY=AIzaSyAsqVEcKZF8ZdgTUdqaqAUTDcJQVRHv4E0
```

### Paso 3: Desplegar la Edge Function

```bash
cd /Volumes/StarkT7/Proyectos/CLIENETS/proyectos/Comyte/copia\ 12\ julio\ /Reputaciononline

# Desplegar scraping-worker
supabase functions deploy scraping-worker
```

### Paso 4: Verificar Despliegue

```bash
# Listar funciones desplegadas
supabase functions list

# Ver logs en tiempo real
supabase functions logs scraping-worker --tail
```

### Paso 5: Probar Manualmente

```bash
# Invocar la función directamente
supabase functions invoke scraping-worker \
  --method POST \
  --body '{}'
```

O desde la UI de Supabase:
- Dashboard → Edge Functions → scraping-worker → Invoke

---

## 🚀 FUNCIONAMIENTO DEL SISTEMA

### Flujo Completo:

1. **Scheduler crea jobs**:
   - `scraping-scheduler` corre cada 1 hora (configurable)
   - Crea jobs para usuarios con planes activos
   - Prioridad por plan: político=1, empresarial=2, etc.

2. **Worker procesa jobs**:
   - Lee cola `scraping_jobs` ordenada por prioridad
   - Máximo 5 jobs por ejecución (límite Edge Function)
   - 45 segundos timeout por job

3. **Scraping real**:
   - **Facebook**: Posts de páginas + comentarios con keywords
   - **Twitter**: Menciones del usuario + búsqueda por keywords
   - Usa tokens OAuth almacenados en `social_media`

4. **Análisis de sentimiento**:
   - **Primario**: Google Gemini 1.5-flash
   - **Fallback**: Sistema de keywords en español colombiano
   - Procesa en lotes de 5 para no saturar API

5. **Detección de crisis**:
   - 5 tipos de crisis detectadas automáticamente:
     - `negative_spike` - Pico de menciones negativas
     - `sentiment_drop` - Caída brusca en sentimiento
     - `influential_criticism` - Críticas de cuentas >10K seguidores
     - `trending_negative` - Hashtags negativos trending
     - `media_coverage` - Cobertura negativa en medios
   - Thresholds por plan (político más sensible)

6. **Almacenamiento**:
   - Items guardados en `scraped_news` con deduplicación (SHA-256)
   - Alertas en `crisis_alerts` con trigger_data completo
   - Créditos deducidos automáticamente

---

## 📊 COSTOS DE CRÉDITOS

```javascript
scrape_facebook: 2 créditos
scrape_twitter: 2 créditos
sentiment_analysis: 1 crédito por item
crisis_detection: 0 créditos (incluido)

// Ejemplo:
// Scrapeo de 50 tweets = 2 + (50 * 1) = 52 créditos
// Plan político: ILIMITADO (no se deducen)
```

---

## 🔧 CONFIGURACIÓN AVANZADA

### Thresholds de Crisis (config.ts:42-78)

```typescript
politico: {
  negative_spike: 50,         // 50 menciones negativas = alerta
  sentiment_drop: 0.3,        // 30% caída en sentimiento
  influential_criticism: 1,    // 1 crítica influencer
  trending_negative: 10,       // Hashtag con >10 usos
  media_coverage: 5           // 5 artículos medios
}
```

### Rate Limits (config.ts:17-39)

```typescript
facebook: 200 requests/hour
twitter: 20 requests/minute (300 per 15min)
```

---

## 🧪 TESTING

### Test 1: Crear Job Manualmente

```sql
-- Insertar job de prueba en Supabase SQL Editor
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
  'USER_ID_AQUI',  -- Tu user ID
  'facebook',
  'pending',
  1,
  '{"lookback_hours": 24, "keywords": ["reputación", "opinión"]}'::jsonb,
  NOW()
);
```

### Test 2: Invocar Worker

```bash
# Invocar y ver resultado inmediato
supabase functions invoke scraping-worker

# Debería retornar algo como:
{
  "worker_id": "worker-abc123",
  "jobs_processed": 1,
  "jobs_succeeded": 1,
  "total_items_scraped": 15,
  "total_alerts_created": 0
}
```

### Test 3: Verificar Datos Guardados

```sql
-- Ver items scrapeados recientes
SELECT
  platform,
  title,
  sentiment,
  sentiment_score,
  engagement_likes,
  created_at
FROM scraped_news
WHERE user_id = 'USER_ID_AQUI'
ORDER BY created_at DESC
LIMIT 10;

-- Ver alertas de crisis
SELECT * FROM crisis_alerts
WHERE user_id = 'USER_ID_AQUI'
ORDER BY created_at DESC;
```

---

## 📈 MONITOREO

### Logs en Producción

```bash
# Ver logs en tiempo real
supabase functions logs scraping-worker --tail

# Ver logs históricos
supabase functions logs scraping-worker --limit 100
```

### Métricas a Vigilar

1. **Jobs completados vs fallidos**:
   ```sql
   SELECT status, COUNT(*)
   FROM scraping_jobs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY status;
   ```

2. **Items scrapeados por plataforma**:
   ```sql
   SELECT platform, COUNT(*), AVG(sentiment_score)
   FROM scraped_news
   WHERE scraped_at > NOW() - INTERVAL '7 days'
   GROUP BY platform;
   ```

3. **Crisis detectadas**:
   ```sql
   SELECT severity, type, COUNT(*)
   FROM crisis_alerts
   WHERE created_at > NOW() - INTERVAL '30 days'
   GROUP BY severity, type
   ORDER BY severity, type;
   ```

---

## 🔐 SEGURIDAD

- **RLS Policies**: Todas las tablas tienen Row Level Security
- **Service Role**: Worker usa service_role_key para bypass RLS
- **Token Management**: Tokens OAuth encriptados en DB
- **Deduplicación**: SHA-256 hash previene duplicados
- **Rate Limiting**: Respeta límites de cada plataforma

---

## 🐛 TROUBLESHOOTING

### Error: "No access token provided"
- Verificar que el usuario tenga plataforma conectada en `social_media`
- Revisar que `connected = true`

### Error: "Créditos insuficientes"
- Usuario sin créditos (excepto plan político)
- Solución: Agregar créditos con `add_user_credits()`

### Error: "Gemini API error"
- API key no configurada o inválida
- Fallback automático a análisis por keywords

### Error: "Job timeout"
- Job muy grande (muchos items)
- Solución: Reducir `lookback_hours` en config

### Worker no procesa jobs
- Verificar que jobs tengan `status = 'pending'`
- Verificar `scheduled_at` no sea futuro
- Verificar que worker esté desplegado correctamente

---

## 📝 NOTAS IMPORTANTES

1. **MVP**: Solo Facebook y Twitter están implementados
2. **Gemini**: Requiere API key configurada
3. **OAuth**: Usuarios deben conectar plataformas manualmente
4. **Scheduler**: Corre cada hora por defecto (configurable con pg_cron)
5. **Límites**: Edge Functions tienen 50s timeout total
6. **Plan Político**: Créditos ilimitados, prioridad máxima

---

## 🎯 PRÓXIMOS PASOS

### Para activar sistema completo:

1. ✅ Desplegar worker (este README)
2. ⏳ Configurar pg_cron para scheduler automático:
   ```sql
   SELECT cron.schedule(
     'scraping-worker-hourly',
     '0 * * * *',  -- Cada hora en punto
     $$
     SELECT net.http_post(
       url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-worker',
       headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     )
     $$
   );
   ```

3. ⏳ Configurar alertas en frontend para mostrar `crisis_alerts`
4. ⏳ Implementar LinkedIn/YouTube/TikTok scrapers (opcional)
5. ⏳ Dashboard de métricas en tiempo real

---

## 🆘 SOPORTE

- Logs: `supabase functions logs scraping-worker`
- Repo: /supabase/functions/scraping-worker/
- Migraciones: /supabase/migrations/
- Validación: /supabase/migrations/VALIDATE_MIGRATIONS.sql

---

**Sistema implementado y listo para despliegue el 2025-10-29**
