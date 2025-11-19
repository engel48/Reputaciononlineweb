# API de Análisis de Sentimiento en Tiempo Real

Servicio de análisis de sentimiento usando Gemini AI con fallback a keywords para menciones de redes sociales.

## Endpoints Disponibles

### 1. Análisis Individual
Analiza el sentimiento de una sola mención.

**Endpoint:** `POST /api/mentions/analyze-sentiment`

**Body:**
```json
{
  "content": "Texto a analizar",
  "mentionId": "uuid-opcional" // Si se proporciona, actualiza la mención en Supabase
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "sentiment": "positive|negative|neutral",
    "score": 0.75, // -1 a +1
    "explanation": "Explicación del análisis",
    "updated": true, // true si se actualizó en Supabase
    "method": "gemini_ai|keywords" // Método usado
  }
}
```

**Rate Limit:** 60 requests/minuto

---

### 2. Análisis en Batch
Analiza múltiples menciones en lote.

**Endpoint:** `POST /api/mentions/analyze-batch`

**Body:**
```json
{
  "mentionIds": ["uuid1", "uuid2", "uuid3"] // Máximo 50
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "analyzed": 45,
    "failed": 5,
    "total": 50,
    "results": [
      {
        "mentionId": "uuid1",
        "sentiment": "positive",
        "score": 0.8
      },
      // ... más resultados
    ]
  }
}
```

**Características:**
- Máximo 50 menciones por batch
- Rate limiting automático (1 segundo entre requests)
- Reintentos automáticos (máximo 2)
- Actualiza `metadata` en Supabase
- Crea registros en `sentiment_analysis`

---

### 3. Menciones Pendientes
Obtiene menciones sin análisis de sentimiento.

**Endpoint:** `GET /api/mentions/pending-analysis`

**Query Params:**
- `userId` (opcional): Filtrar por usuario
- `limit` (opcional, default: 100): Cantidad de resultados
- `offset` (opcional, default: 0): Offset para paginación

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "mentions": [
      {
        "id": "uuid",
        "platform": "facebook",
        "content": "Texto de la mención",
        "author_name": "Nombre del autor",
        "published_at": "2025-01-15T10:30:00Z",
        "metadata": {}
      }
    ],
    "count": 25,
    "total": 150,
    "hasMore": true
  }
}
```

---

## Estructura de Datos

### Tabla `mentions`
El análisis se almacena en el campo `metadata` (JSONB):

```json
{
  "sentiment": "positive|negative|neutral",
  "sentiment_score": 0.75, // -1 a +1
  "sentiment_explanation": "Texto explicativo",
  "sentiment_analyzed_at": "2025-01-15T10:30:00Z",
  "sentiment_method": "gemini_ai|keywords"
}
```

### Tabla `sentiment_analysis`
Se crea un registro adicional con información detallada:

```sql
{
  "mention_id": "uuid",
  "user_id": "uuid",
  "sentiment_score": 75.0, // -100 a +100
  "confidence": 85,
  "analyzed_at": "timestamp",
  "analysis_metadata": {
    "method": "gemini_ai",
    "sentiment": "positive",
    "explanation": "..."
  }
}
```

---

## Uso desde el Dashboard

### Ejemplo: Analizar mención nueva

```typescript
// En componente de menciones
async function handleAnalyzeMention(content: string, mentionId: string) {
  try {
    const response = await fetch('/api/mentions/analyze-sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, mentionId })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Sentimiento:', result.data.sentiment);
      console.log('Score:', result.data.score);
      // Actualizar UI con el resultado
    }
  } catch (error) {
    console.error('Error al analizar:', error);
  }
}
```

### Ejemplo: Análisis batch de menciones pendientes

```typescript
async function analyzeAllPending() {
  // 1. Obtener menciones pendientes
  const pendingResponse = await fetch('/api/mentions/pending-analysis?limit=50');
  const pendingData = await pendingResponse.json();

  if (!pendingData.success || pendingData.data.count === 0) {
    console.log('No hay menciones pendientes');
    return;
  }

  // 2. Analizar en batch
  const mentionIds = pendingData.data.mentions.map(m => m.id);

  const batchResponse = await fetch('/api/mentions/analyze-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mentionIds })
  });

  const batchData = await batchResponse.json();

  if (batchData.success) {
    console.log(`Analizadas: ${batchData.data.analyzed}/${batchData.data.total}`);
    console.log(`Fallidas: ${batchData.data.failed}`);
  }
}
```

---

## Fallback a Keywords

Si Gemini AI falla (API no disponible, rate limit, error), el sistema usa análisis basado en keywords:

**Keywords Positivas:**
- excelente, bueno, genial, increíble, fantástico, maravilloso
- éxito, logro, feliz, alegre, positivo, amor, felicidades
- gracias, apoyo, admiro, respeto, calidad, mejor, orgullo

**Keywords Negativas:**
- malo, pésimo, terrible, horrible, desastre, fracaso
- triste, enojo, odio, corrupto, ladrón, mentiroso
- problema, crisis, escándalo, crítica, denuncia, peor
- incompetente, vergüenza, decepción, indignante

El método de fallback calcula un score basado en la proporción de keywords positivas vs negativas.

---

## Configuración Requerida

**Variables de Entorno:**

```bash
# Gemini AI (obligatorio)
GEMINI_API_KEY=your-gemini-api-key

# Supabase (obligatorio para actualizar menciones)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Rate Limits

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| `/analyze-sentiment` | 60 requests | 1 minuto |
| `/analyze-batch` | 1 request/segundo | Por mención |
| `/pending-analysis` | Sin límite | - |

**Gemini API:** 60 requests/minuto (gestionado automáticamente)

---

## Monitoreo y Logs

Todos los endpoints registran logs detallados:

```
🤖 Iniciando análisis de sentimiento...
✅ Análisis completado con Gemini AI
⚠️ Gemini AI falló, usando keywords fallback
❌ Error al actualizar mención en Supabase
📊 Progreso: 10/50 menciones procesadas
```

---

## Errores Comunes

### Error 400: Campo "content" requerido
**Solución:** Asegúrate de enviar el campo `content` en el body

### Error 429: Rate limit excedido
**Solución:** Espera 1 minuto antes de reintentar

### Error 500: Supabase no configurado
**Solución:** Verifica las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

---

## Testing

### Prueba manual con curl

```bash
# Análisis individual
curl -X POST http://localhost:3000/api/mentions/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"content": "Este producto es excelente, muy buena calidad!"}'

# Menciones pendientes
curl http://localhost:3000/api/mentions/pending-analysis?limit=10
```

### Prueba con código JavaScript

```javascript
// Prueba de análisis individual
const testSentiment = async () => {
  const response = await fetch('/api/mentions/analyze-sentiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Este servicio es pésimo, muy mala atención!'
    })
  });

  const data = await response.json();
  console.log(data);
  // Esperado: sentiment: "negative", score: < 0
};
```

---

## Integración con Dashboard

Para integrar en el dashboard de menciones:

1. Al cargar menciones nuevas, verificar si tienen `metadata.sentiment`
2. Si no tienen, mostrar botón "Analizar sentimiento"
3. Al hacer clic, llamar a `/analyze-sentiment` con el `mentionId`
4. Actualizar la UI con el resultado en tiempo real
5. Opcionalmente, ejecutar análisis batch automático cada hora para menciones pendientes

---

## Próximas Mejoras

- [ ] Caché de análisis para contenido duplicado
- [ ] Análisis de emociones específicas (alegría, enojo, tristeza)
- [ ] Detección de sarcasmo mejorada
- [ ] Análisis de urgencia (crisis potencial)
- [ ] Dashboard de métricas de sentimiento
- [ ] Webhooks para notificaciones de sentimiento negativo
