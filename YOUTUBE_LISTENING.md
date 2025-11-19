# 🎬 Sistema YouTube Listening - Documentación Completa

## 📋 Descripción General

Sistema completo de monitoreo y análisis de reputación para YouTube que incluye:

- **OAuth 2.0** para conectar cuentas de YouTube
- **Extracción automática** de videos, comentarios y métricas
- **Análisis de sentimiento con IA** usando Google Gemini
- **Monitoreo continuo** con scraping jobs programados
- **Dashboard de visualización** con métricas en tiempo real
- **Score de reputación** calculado automáticamente

---

## 🎯 Funcionalidades Principales

### 1. Conexión de Cuenta YouTube
- OAuth 2.0 con Google
- Permisos: `youtube.readonly`
- Almacenamiento seguro de tokens
- Refresh automático

### 2. Extracción de Datos
- ✅ Perfil del canal (suscriptores, videos totales)
- ✅ Videos recientes (configurab

le: 10-100)
- ✅ Comentarios por video (configurable: 10-100)
- ✅ Métricas de engagement (vistas, likes, comentarios)

### 3. Análisis de Sentimiento IA
- **Motor**: Google Gemini AI
- **Idiomas**: Español e Inglés
- **Detección**:
  - Sentimiento: positive/negative/neutral
  - Score: -100 a +100
  - Confianza: high/medium/low
  - Explicación contextual
  - Detección de sarcasmo

### 4. Monitoreo Continuo
- **Scraping Jobs** programables
- **Frecuencias**: hourly, daily, weekly, monthly
- **Worker automático** procesa jobs
- **Priorización** por plan de usuario

### 5. Métricas y Dashboard
- Score de reputación (0-100)
- Distribución de sentimientos
- Tendencias temporales (7/30 días)
- Top videos por engagement
- Menciones recientes

---

## 🚀 Guía de Uso

### PASO 1: Conectar YouTube

```typescript
// Frontend: Botón de conexión
<button onClick={() => window.location.href = '/api/auth/signin/google?callbackUrl=/dashboard&scope=https://www.googleapis.com/auth/youtube.readonly'}>
  Conectar YouTube
</button>
```

**Flujo**:
1. Usuario hace clic en "Conectar YouTube"
2. Redirige a Google OAuth
3. Usuario autoriza permisos
4. Callback guarda token en `social_media` table
5. Usuario redirigido al dashboard

---

### PASO 2: Sincronización Manual

```bash
# POST /api/youtube/sync
curl -X POST http://localhost:3000/api/youtube/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "maxVideos": 20,
    "maxCommentsPerVideo": 50,
    "lookbackDays": 30
  }'
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "channel": {
      "id": "UC...",
      "title": "Mi Canal",
      "subscribers": "10000",
      "total_videos": "150"
    },
    "metrics": {
      "reputation_score": 78,
      "total_mentions": 245,
      "positive_mentions": 180,
      "negative_mentions": 30,
      "neutral_mentions": 35,
      "sentiment_score": 45.2,
      "engagement_rate": 4.5
    },
    "videos_analyzed": 20,
    "comments_analyzed": 245
  },
  "message": "Sincronización completada"
}
```

---

### PASO 3: Programar Scraping Automático

```bash
# POST /api/youtube/scraping-job
curl -X POST http://localhost:3000/api/youtube/scraping-job \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "frequency": "daily",
    "max_videos": 20,
    "max_comments_per_video": 50,
    "lookback_days": 7,
    "auto_start": true
  }'
```

**Frecuencias disponibles**:
- `hourly` - Cada hora (Plan Pro/Enterprise)
- `daily` - Cada 24 horas (Plan Básico+)
- `weekly` - Cada 7 días (Todos los planes)
- `monthly` - Cada 30 días (Todos los planes)

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "job_id": "uuid-...",
    "status": "pending",
    "scheduled_at": "2025-01-20T10:00:00Z",
    "frequency": "daily",
    "message": "Job creado y ejecutándose en segundo plano"
  }
}
```

---

### PASO 4: Ver Dashboard

```bash
# GET /api/youtube/dashboard
curl http://localhost:3000/api/youtube/dashboard \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "channel": {
      "name": "Mi Canal",
      "followers": 10000,
      "engagement_rate": 4.5
    },
    "overview": {
      "reputation_score": 78,
      "total_mentions": 245,
      "positive_mentions": 180,
      "negative_mentions": 30,
      "avg_sentiment_score": 45.2
    },
    "sentiment_distribution": {
      "positive_percentage": 73.5,
      "negative_percentage": 12.2,
      "neutral_percentage": 14.3
    },
    "trends": {
      "last_7_days": [
        { "date": "2025-01-14", "total": 30, "positive": 22, "negative": 3 },
        { "date": "2025-01-15", "total": 35, "positive": 28, "negative": 2 }
      ]
    },
    "top_videos": [
      {
        "video_title": "Mi video más popular",
        "total_comments": 120,
        "positive_comments": 95,
        "avg_sentiment": 72.5
      }
    ],
    "recent_mentions": [
      {
        "content": "¡Excelente video!",
        "author": "Juan Pérez",
        "sentiment": "positive",
        "sentiment_score": 85,
        "likes": 15,
        "video_title": "Tutorial de programación"
      }
    ]
  }
}
```

---

## ⚙️ Configuración del Worker Automático

### Opción 1: Supabase pg_cron (Recomendado)

```sql
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar extensión pg_cron (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Programar worker cada hora
SELECT cron.schedule(
  'youtube-worker-hourly',           -- Nombre del job
  '0 * * * *',                       -- Cron expression: cada hora en minuto 0
  $$
  SELECT
    net.http_get(
      url := 'https://tu-dominio.com/api/youtube/worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer youtube-worker-secret-key-2025'
      )
    ) as request_id;
  $$
);

-- 3. Verificar que está programado
SELECT * FROM cron.job;

-- 4. Ver historial de ejecuciones
SELECT * FROM cron.job_run_details
WHERE jobname = 'youtube-worker-hourly'
ORDER BY start_time DESC
LIMIT 10;
```

### Opción 2: Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/youtube/worker",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Opción 3: Cron Externo (cron-job.org, EasyCron)

1. Crear cuenta en https://cron-job.org
2. Añadir nuevo cron job:
   - **URL**: `https://tu-dominio.com/api/youtube/worker`
   - **Frecuencia**: Cada hora
   - **Headers**:
     ```
     Authorization: Bearer youtube-worker-secret-key-2025
     ```
3. Guardar y activar

---

## 📊 Estructura de Datos

### Tabla: `social_media`
```sql
- user_id: UUID
- platform: 'youtube'
- username: string (channel ID)
- followers: integer (suscriptores)
- posts: integer (total videos)
- engagement: float (engagement rate %)
- connected: boolean
- access_token: encrypted string
- refresh_token: encrypted string
- last_sync: timestamp
```

### Tabla: `mentions`
```sql
- user_id: UUID
- platform: 'youtube'
- content: text (comentario)
- author_name: string
- author_username: string (channel ID)
- url: string (link al comentario)
- published_at: timestamp
- likes: integer
- metadata: jsonb {
    video_id, video_title, sentiment,
    sentiment_score, ai_explanation
  }
```

### Tabla: `scraping_jobs`
```sql
- user_id: UUID
- platform: 'youtube'
- job_type: 'sync'
- status: pending | running | completed | failed
- priority: 1-5
- config: jsonb {
    frequency, max_videos,
    max_comments_per_video, lookback_days
  }
- scheduled_at: timestamp
- started_at: timestamp
- completed_at: timestamp
- result: jsonb
```

---

## 🔐 Seguridad y Permisos

### Variables de Entorno Requeridas

```bash
# .env.local
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GEMINI_API_KEY=your-gemini-api-key
WORKER_SECRET=youtube-worker-secret-key-2025
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

### OAuth Scopes Necesarios

```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/youtube.force-ssl
```

---

## 📈 Cálculo del Score de Reputación

```typescript
// Fórmula del Reputation Score (0-100)

const sentimentScore = (positiveMentions / totalMentions) * 100;
const engagementScore = Math.min(engagementRate * 100, 100);
const growthScore = (monthlyGrowthRate / 10) * 100;

const reputationScore = Math.round(
  sentimentScore * 0.4 +    // 40% peso
  engagementScore * 0.3 +   // 30% peso
  growthScore * 0.3         // 30% peso
);
```

**Interpretación**:
- 80-100: Excelente reputación
- 60-79: Buena reputación
- 40-59: Reputación neutra
- 20-39: Reputación negativa
- 0-19: Crisis de reputación

---

## 🎨 Ejemplos de Implementación Frontend

### React Component - Dashboard YouTube

```tsx
import { useEffect, useState } from 'react';

interface YouTubeDashboard {
  channel: {
    name: string;
    followers: number;
    engagement_rate: number;
  };
  overview: {
    reputation_score: number;
    total_mentions: number;
    positive_mentions: number;
    negative_mentions: number;
  };
  trends: {
    last_7_days: Array<{
      date: string;
      total: number;
      positive: number;
      negative: number;
    }>;
  };
}

export default function YouTubeDashboardWidget() {
  const [dashboard, setDashboard] = useState<YouTubeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/youtube/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncNow = async () => {
    setLoading(true);
    try {
      await fetch('/api/youtube/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxVideos: 20,
          maxCommentsPerVideo: 50
        })
      });
      await fetchDashboard();
    } catch (error) {
      console.error('Error syncing:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!dashboard) return <div>No hay datos disponibles</div>;

  return (
    <div className="youtube-dashboard">
      <h2>{dashboard.channel.name}</h2>

      <div className="metrics">
        <div className="metric">
          <h3>Score de Reputación</h3>
          <div className="score">{dashboard.overview.reputation_score}/100</div>
        </div>

        <div className="metric">
          <h3>Menciones Totales</h3>
          <div>{dashboard.overview.total_mentions}</div>
        </div>

        <div className="sentiment-breakdown">
          <div className="positive">{dashboard.overview.positive_mentions} positivas</div>
          <div className="negative">{dashboard.overview.negative_mentions} negativas</div>
        </div>
      </div>

      <button onClick={syncNow} disabled={loading}>
        Sincronizar Ahora
      </button>

      <div className="trends">
        <h3>Tendencia (7 días)</h3>
        {dashboard.trends.last_7_days.map(day => (
          <div key={day.date} className="trend-day">
            <span>{day.date}</span>
            <span>{day.total} comentarios</span>
            <span className="positive">{day.positive}</span>
            <span className="negative">{day.negative}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🐛 Troubleshooting

### Error: "YouTube no está conectado"
**Solución**: El usuario debe conectar su cuenta primero en `/dashboard/configuracion`

### Error: "Token expirado"
**Solución**: El sistema intenta refresh automático. Si falla, pedir reconexión.

### Error: "Quota exceeded"
**Solución**: YouTube Data API tiene cuota de 10,000 unidades/día. Optimizar requests o solicitar aumento de cuota.

### Jobs no se ejecutan automáticamente
**Solución**:
1. Verificar que pg_cron esté configurado
2. Revisar logs con `SELECT * FROM cron.job_run_details`
3. Verificar WORKER_SECRET está configurado

---

## 📝 Changelog

### v1.0.0 (2025-01-20)
- ✅ OAuth YouTube completo
- ✅ Sincronización manual
- ✅ Análisis de sentimiento con Gemini AI
- ✅ Scraping jobs programables
- ✅ Worker automático
- ✅ Dashboard con métricas
- ✅ Score de reputación

---

## 📚 Referencias

- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Google Gemini API](https://ai.google.dev/docs)
- [Supabase pg_cron](https://supabase.com/docs/guides/database/extensions/pgcron)
- [OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

---

## 💡 Próximas Mejoras

- [ ] Detección de crisis en tiempo real
- [ ] Alertas por email/SMS cuando sentimiento negativo > 30%
- [ ] Análisis de competidores
- [ ] Identificación de influencers
- [ ] Respuestas automatizadas sugeridas por IA
- [ ] Exportación de reportes PDF
- [ ] Integración con otras plataformas (Instagram, TikTok)

---

## 👨‍💻 Soporte

Para soporte técnico, contactar:
- Email: soporte@reputaciononline.com
- Documentación: https://docs.reputaciononline.com
- GitHub Issues: https://github.com/tu-repo/issues
