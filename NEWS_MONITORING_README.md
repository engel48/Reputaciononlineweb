# Sistema de Monitoreo de Noticias Colombianas

Sistema completo de monitoreo en tiempo real de menciones en 50 sitios de noticias colombianos, con análisis de sentimiento, scraping automatizado y notificaciones.

## Características Principales

- **50 Sitios de Noticias**: Cobertura de medios nacionales, regionales, digitales, económicos y deportivos
- **Scraping Multi-Método**: Soporte para RSS, Sitemap y scraping directo HTML
- **Análisis de Sentimiento**: Detección de sentimiento positivo/negativo/neutral en español colombiano
- **Procesamiento Background**: Sistema de queue para monitoreo automático
- **Rate Limiting**: Respeta límites de cada sitio (8-15 requests/hora)
- **Deduplicación**: Evita menciones duplicadas usando hashes de contenido
- **Seguridad**: Row Level Security (RLS) en todas las tablas

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                          │
├─────────────────────────────────────────────────────────────┤
│  GET  /api/news-monitoring/available-sites                  │
│  GET  /api/news-monitoring/user-sites                       │
│  POST /api/news-monitoring/activate-site                    │
│  DEL  /api/news-monitoring/deactivate-site/[id]             │
│  GET  /api/news-monitoring/mentions                         │
│  POST /api/news-monitoring/scan-now                         │
│  GET  /api/news-monitoring/stats                            │
│  GET  /api/news-monitoring/cron (background)                │
│  POST /api/news-monitoring/seed-catalog (admin)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICIOS CORE                           │
├─────────────────────────────────────────────────────────────┤
│  • sites-config.ts     - Configuración de 50 sitios         │
│  • scraper.ts          - Lógica de scraping RSS/Sitemap     │
│  • sentiment.ts        - Análisis de sentimiento español    │
│  • queue-processor.ts  - Procesamiento background           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                         │
├─────────────────────────────────────────────────────────────┤
│  • monitored_news_sites     - Sitios monitoreados/usuario   │
│  • news_mentions            - Menciones encontradas         │
│  • news_sites_catalog       - Catálogo de 50 sitios         │
│  • scraping_jobs            - Cola de trabajos              │
│  • user_notification_preferences - Preferencias             │
└─────────────────────────────────────────────────────────────┘
```

## Setup e Instalación

### 1. Migración de Base de Datos

Ejecutar la migración en Supabase:

```bash
# En Supabase Dashboard > SQL Editor, ejecutar:
supabase/migrations/20250122_news_monitoring.sql
```

Esta migración crea:
- 5 tablas con RLS policies
- Índices optimizados
- Funciones auxiliares (get_sites_needing_scraping, get_user_monitoring_stats)
- Triggers para updated_at

### 2. Variables de Entorno

Agregar al archivo `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin y Cron (generar secretos aleatorios)
ADMIN_SECRET=your-random-admin-secret
CRON_SECRET=your-random-cron-secret
```

### 3. Inicializar Catálogo de Sitios

Ejecutar una vez para poblar la tabla `news_sites_catalog`:

```bash
curl -X POST http://localhost:3000/api/news-monitoring/seed-catalog \
  -H "x-admin-secret: your-admin-secret"
```

Esto inserta los 50 sitios configurados en la base de datos.

### 4. Configurar Cron Job

El sistema necesita un cron job que ejecute el procesamiento de cola cada 5-10 minutos.

#### Opción A: Vercel Cron (recomendado para Vercel)

Agregar al archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/news-monitoring/cron",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

#### Opción B: Railway Cron

```bash
railway run --cron "*/5 * * * *" curl -X GET https://your-domain.com/api/news-monitoring/cron -H "x-cron-secret: your-cron-secret"
```

#### Opción C: External Cron (cron-job.org, EasyCron, etc.)

Configurar un job que ejecute cada 5 minutos:
```
GET https://your-domain.com/api/news-monitoring/cron
Headers: x-cron-secret: your-cron-secret
```

## Uso de la API

### 1. Obtener Sitios Disponibles

```typescript
GET /api/news-monitoring/available-sites?category=nacional

Response:
{
  "success": true,
  "data": {
    "sites": [
      {
        "id": "el-tiempo",
        "name": "El Tiempo",
        "url": "https://www.eltiempo.com",
        "category": "nacional",
        "scrapingMethod": "rss",
        "isActive": true
      }
    ],
    "stats": {
      "total": 50,
      "active": 50,
      "byCategory": { ... },
      "byMethod": { ... }
    }
  }
}
```

### 2. Activar Monitoreo de un Sitio

```typescript
POST /api/news-monitoring/activate-site
Headers: Authorization: Bearer <user-token>

Body:
{
  "siteId": "el-tiempo",
  "searchTerms": ["Gustavo Petro", "Gobierno Colombia"],
  "checkFrequencyMinutes": 30
}

Response:
{
  "success": true,
  "message": "Monitoreo activado para El Tiempo"
}
```

**Límites:**
- Máximo 10 sitios monitoreados por usuario
- Máximo 10 términos de búsqueda por sitio
- Frecuencia mínima: 15 minutos

### 3. Obtener Menciones

```typescript
GET /api/news-monitoring/mentions?sentiment=negative&limit=20&offset=0
Headers: Authorization: Bearer <user-token>

Response:
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": "uuid",
        "article_title": "Título del artículo",
        "article_url": "https://...",
        "mention_context": "...contexto donde aparece la mención...",
        "sentiment": "negative",
        "sentiment_score": -0.75,
        "matched_terms": ["Gustavo Petro"],
        "published_date": "2025-01-22T10:30:00Z",
        "site": {
          "name": "El Tiempo",
          "category": "nacional"
        }
      }
    ],
    "statistics": {
      "total": 150,
      "unread": 45,
      "negative": 30,
      "positive": 80,
      "neutral": 40
    }
  }
}
```

### 4. Forzar Escaneo Inmediato

```typescript
POST /api/news-monitoring/scan-now
Headers: Authorization: Bearer <user-token>

Body:
{
  "monitoredSiteId": "uuid-of-monitored-site"
}

Response:
{
  "success": true,
  "data": {
    "articlesScraped": 25,
    "mentionsFound": 3,
    "mentions": [ ... ],
    "duration": "2450ms"
  }
}
```

### 5. Obtener Estadísticas

```typescript
GET /api/news-monitoring/stats
Headers: Authorization: Bearer <user-token>

Response:
{
  "success": true,
  "data": {
    "overview": {
      "active_sites": 5,
      "total_mentions": 150,
      "unread_mentions": 45,
      "negative_mentions": 30
    },
    "last24Hours": {
      "total": 12,
      "byHour": [0, 1, 2, 1, 0, ...] // Array de 24 elementos
    }
  }
}
```

## Sitios de Noticias Configurados (50)

### Nacionales (12)
- El Tiempo, El Espectador, Semana, RCN Radio, Caracol Radio, Blu Radio, W Radio, La FM, CityTV, Noticias RCN, Red+ Noticias, Canal 1

### Regionales (12)
- El Colombiano, El Heraldo, El Universal, Vanguardia, El País (Cali), La Patria, El Diario del Otún, El Nuevo Siglo, La Opinión, El Informador, HOY Diario del Magdalena, El Meridiano de Córdoba

### Digitales (10)
- Pulzo, Las 2 Orillas, KienyKe, Cambio, Infobae Colombia, Pacifista, El Palpitar, Colombia Informa, Contagio Radio

### Políticos (4)
- La Silla Vacía, Cuestión Pública, Razón Pública, ColombiaCheck

### Económicos (8)
- Portafolio, La República, Dinero, Valora Analitik, Bloomberg Línea, Agronegocios, Empresario, Finanzas Personales

### Deportivos (5)
- Futbolred, Gol Caracol, AS Colombia, Marca Claro, ESPN Colombia

## Análisis de Sentimiento

El sistema usa un analizador de sentimiento especializado para español colombiano con:

### Palabras Clave
- **Positivas (60+)**: éxito, logro, reconocido, líder, excelente, innovador, etc.
- **Negativas (80+)**: corrupción, escándalo, acusación, fraude, denuncia, etc.
- **Neutrales (20+)**: anunció, declaró, presentó, participó, etc.

### Factores Contextuales
- **Negación**: Invierte el sentimiento ("no es corrupto" → positivo)
- **Intensificadores**: Multiplica por 1.5 ("muy corrupto" → más negativo)
- **Puntuación**: Considera signos de interrogación y exclamación

### Score de Sentimiento
- **Rango**: -1.00 (muy negativo) a 1.00 (muy positivo)
- **Umbrales**:
  - Positivo: > 0.2
  - Negativo: < -0.2
  - Neutral: -0.2 a 0.2

### Detección de Crisis
El sistema detecta automáticamente crisis de reputación cuando:
- 3+ palabras negativas en el mismo contexto
- Score de sentimiento < -0.6
- Palabras críticas (corrupción, escándalo, investigación)

## Rate Limiting

Cada sitio tiene límites configurados:
- **Alta frecuencia (15 req/h)**: Pulzo, Infobae Colombia
- **Media frecuencia (12 req/h)**: El Tiempo, El Espectador, Portafolio
- **Baja frecuencia (8-10 req/h)**: Sitios regionales

El scraper respeta estos límites automáticamente y rechaza requests si se exceden.

## Procesamiento Background

### Queue Processor
- Se ejecuta cada 5 minutos via cron
- Procesa hasta 50 sitios por batch
- Prioriza sitios según `check_frequency_minutes`
- 2 segundos de delay entre sitios

### Job States
- **pending**: Esperando procesamiento
- **processing**: Ejecutándose actualmente
- **completed**: Finalizado exitosamente
- **failed**: Error durante scraping

### Cleanup
- Jobs > 7 días se eliminan automáticamente
- Se ejecuta diariamente a las 2 AM

## Seguridad

### Row Level Security (RLS)
Todas las tablas tienen políticas que garantizan:
- Usuarios solo ven sus propios datos
- Service role puede insertar menciones
- Catálogo es público (solo lectura)

### Autenticación
- JWT tokens via Supabase Auth
- Header: `Authorization: Bearer <token>`
- Validación en cada endpoint

### Sanitización
- Términos de búsqueda limitados a 100 caracteres
- Sin regex complejos (previene ReDoS)
- Validación de URLs contra whitelist

## Troubleshooting

### El scraping no encuentra menciones
1. Verificar que el sitio tiene RSS configurado
2. Revisar logs del job en `scraping_jobs` table
3. Validar términos de búsqueda (sensible a mayúsculas)
4. Algunos sitios requieren tiempo para publicar RSS

### Rate limit exceeded
- Reducir `check_frequency_minutes` (mínimo 15)
- Esperar 1 hora para que se reinicie el contador
- Considerar activar menos sitios

### Jobs quedan en "processing"
- Verificar logs de la consola
- Puede ser timeout (> 10s para RSS)
- Reintentar con `/scan-now`

### Menciones duplicadas
- El sistema usa `article_hash` para deduplicación
- Constraint `unique_article_per_user` previene duplicados
- Si ocurren, verificar que las URLs sean consistentes

## Próximas Mejoras

- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Scraping directo HTML con Cheerio/Puppeteer
- [ ] Integración con AI (Gemini) para análisis avanzado
- [ ] Dashboard de métricas y visualizaciones
- [ ] Export de reportes PDF
- [ ] Webhooks para integración externa
- [ ] Soporte para más sitios internacionales
- [ ] Análisis de tendencias y predicciones

## Soporte

Para issues o preguntas:
1. Revisar logs en Supabase Dashboard > Logs
2. Verificar configuración de variables de entorno
3. Consultar documentación de Supabase
4. Contactar soporte técnico

---

**Versión**: 1.0.0
**Fecha**: 2025-01-22
**Autor**: Reputación Online Team
