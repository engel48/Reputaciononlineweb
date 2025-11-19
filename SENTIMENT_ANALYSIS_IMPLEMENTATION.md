# Implementación: Servicio de Análisis de Sentimiento IA en Tiempo Real

## Resumen Ejecutivo

Se ha implementado un sistema completo de análisis de sentimiento en tiempo real que integra Gemini AI 2.0 Flash con fallback a análisis basado en keywords. El sistema procesa menciones de redes sociales y actualiza automáticamente la base de datos de Supabase.

---

## Componentes Implementados

### 1. Backend - API Endpoints

#### `/api/mentions/analyze-sentiment` (POST)
- **Función**: Analiza el sentimiento de una mención individual
- **Input**: `{ content: string, mentionId?: string }`
- **Output**: `{ sentiment, score, explanation, updated, method }`
- **Features**:
  - Análisis con Gemini AI (temperatura 0.3 para precisión)
  - Fallback automático a keywords si Gemini falla
  - Rate limiting: 60 requests/minuto
  - Actualización automática en Supabase si se proporciona `mentionId`
  - Creación de registro en tabla `sentiment_analysis`
  - Normalización de score a rango -1 a +1

#### `/api/mentions/analyze-batch` (POST)
- **Función**: Analiza múltiples menciones en lote
- **Input**: `{ mentionIds: string[] }` (máximo 50)
- **Output**: `{ analyzed, failed, total, results[] }`
- **Features**:
  - Procesamiento en batch con rate limiting (1 segundo entre requests)
  - Reintentos automáticos (máximo 2 por mención)
  - Progreso logging cada 10 menciones
  - Actualización masiva en Supabase
  - Estadísticas detalladas de éxito/fallo

#### `/api/mentions/pending-analysis` (GET)
- **Función**: Obtiene menciones sin análisis de sentimiento
- **Query Params**: `userId`, `limit`, `offset`
- **Output**: `{ mentions[], count, total, hasMore }`
- **Features**:
  - Paginación eficiente
  - Filtrado por usuario
  - Conteo total de pendientes

---

### 2. Servicio de IA - `ai-service.ts`

**Mejoras implementadas al método `analyzeSentiment()`:**

1. **Prompt mejorado**:
   - Contexto colombiano específico
   - Detección de sarcasmo, ironía y modismos
   - Consideración de emojis y hashtags
   - Formato JSON estricto

2. **Validación robusta**:
   - Extracción de JSON de respuestas markdown
   - Validación de estructura de respuesta
   - Normalización automática de scores (0-100 → -1 a +1)

3. **Error handling**:
   - Lanza excepciones para activar fallback
   - Logs detallados de errores

---

### 3. Frontend - Componentes React

#### `SentimentAnalysisButton.tsx`
- **Uso**: Botón para analizar mención individual
- **Props**: `mentionId`, `content`, `onAnalysisComplete`, `variant`
- **Features**:
  - Dos variantes: botón completo o icono
  - Loading state animado
  - Display de resultado con colores semánticos
  - Indicador de método usado (Gemini AI vs Keywords)
  - Callback para integración con parent component

#### `BatchSentimentAnalysis.tsx`
- **Uso**: Panel de análisis en batch para dashboard
- **Props**: `userId`, `onComplete`
- **Features**:
  - Carga automática de conteo de pendientes
  - Botones para analizar 50/100 menciones
  - Progreso en tiempo real
  - Estadísticas visuales (positivo/negativo/neutral)
  - Gráficos de distribución de sentimientos
  - Manejo de errores con reintentos

---

### 4. Análisis Basado en Keywords (Fallback)

**Keywords Positivas (20):**
- excelente, bueno, genial, increíble, fantástico, maravilloso
- éxito, logro, feliz, alegre, positivo, amor, felicidades
- gracias, apoyo, admiro, respeto, calidad, mejor, orgullo

**Keywords Negativas (22):**
- malo, pésimo, terrible, horrible, desastre, fracaso
- triste, enojo, odio, corrupto, ladrón, mentiroso
- problema, crisis, escándalo, crítica, denuncia, peor
- incompetente, vergüenza, decepción, indignante

**Algoritmo:**
```javascript
score = (positiveCount - negativeCount) / totalMatches
if (score > 0.2) → positive
if (score < -0.2) → negative
else → neutral
```

---

## Flujo de Datos

```
1. Dashboard detecta mención nueva sin análisis
   ↓
2. Llama a /api/mentions/analyze-sentiment
   ↓
3. Endpoint intenta análisis con Gemini AI
   ├─ Éxito → Usa resultado de Gemini
   └─ Fallo → Usa fallback de keywords
   ↓
4. Actualiza mention.metadata en Supabase:
   - sentiment: 'positive'|'negative'|'neutral'
   - sentiment_score: -1 a +1
   - sentiment_explanation: string
   - sentiment_analyzed_at: timestamp
   - sentiment_method: 'gemini_ai'|'keywords'
   ↓
5. Crea registro en sentiment_analysis:
   - mention_id
   - user_id
   - sentiment_score: -100 a +100
   - confidence: 60-85%
   - analysis_metadata: JSON
   ↓
6. Retorna resultado al frontend
   ↓
7. Frontend actualiza UI con badge de sentimiento
```

---

## Esquema de Base de Datos

### Tabla `mentions`
```sql
ALTER TABLE mentions
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Estructura del metadata:
{
  "sentiment": "positive|negative|neutral",
  "sentiment_score": 0.75,  -- -1 a +1
  "sentiment_explanation": "Texto positivo con agradecimiento",
  "sentiment_analyzed_at": "2025-01-19T15:30:00Z",
  "sentiment_method": "gemini_ai"
}
```

### Tabla `sentiment_analysis`
```sql
CREATE TABLE sentiment_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mention_id UUID REFERENCES mentions(id),
  user_id UUID REFERENCES users(id),
  sentiment_score DOUBLE PRECISION CHECK (sentiment_score >= -100 AND sentiment_score <= 100),
  confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 100),
  analyzed_at TIMESTAMPTZ DEFAULT now(),
  analysis_metadata JSONB DEFAULT '{}'
);
```

---

## Configuración Requerida

### Variables de Entorno

```bash
# Gemini AI (obligatorio)
GEMINI_API_KEY=your-gemini-api-key

# Supabase (obligatorio)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Rate Limits

| Servicio | Límite | Ventana |
|----------|--------|---------|
| Gemini AI | 60 requests | 1 minuto |
| Endpoint individual | 60 requests | 1 minuto |
| Endpoint batch | 1 request/segundo | Por mención |

---

## Testing

### Script de Prueba Automatizado

**Archivo**: `/scripts/test-sentiment-api.js`

**Ejecución**:
```bash
npm run dev  # En una terminal
node scripts/test-sentiment-api.js  # En otra terminal
```

**Pruebas incluidas**:
1. Análisis de sentimiento positivo
2. Análisis de sentimiento negativo
3. Análisis de sentimiento neutral
4. Detección de sarcasmo
5. Rate limiting
6. Validación de input
7. Menciones pendientes

### Prueba Manual

```bash
# Análisis individual
curl -X POST http://localhost:3000/api/mentions/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"content": "Este servicio es excelente, muy recomendado!"}'

# Menciones pendientes
curl http://localhost:3000/api/mentions/pending-analysis?limit=10
```

---

## Integración en Dashboard

### Paso 1: Importar componentes

```typescript
import SentimentAnalysisButton from '@/components/dashboard/SentimentAnalysisButton';
import BatchSentimentAnalysis from '@/components/dashboard/BatchSentimentAnalysis';
```

### Paso 2: Usar en lista de menciones

```typescript
{mentions.map(mention => (
  <div key={mention.id}>
    <p>{mention.content}</p>

    {/* Mostrar análisis si existe */}
    {mention.metadata?.sentiment ? (
      <div className="flex items-center gap-2">
        <span className={`badge ${getSentimentClass(mention.metadata.sentiment)}`}>
          {mention.metadata.sentiment}
        </span>
        <span className="text-xs text-gray-500">
          Score: {(mention.metadata.sentiment_score * 100).toFixed(0)}%
        </span>
      </div>
    ) : (
      /* Botón para analizar si no existe */
      <SentimentAnalysisButton
        mentionId={mention.id}
        content={mention.content}
        variant="button"
        onAnalysisComplete={(result) => {
          // Actualizar estado local
          updateMentionSentiment(mention.id, result);
        }}
      />
    )}
  </div>
))}
```

### Paso 3: Panel de análisis batch

```typescript
<BatchSentimentAnalysis
  userId={currentUser.id}
  onComplete={(stats) => {
    console.log(`Analizadas: ${stats.analyzed}`);
    console.log(`Positivas: ${stats.positive}`);
    console.log(`Negativas: ${stats.negative}`);
    console.log(`Neutrales: ${stats.neutral}`);

    // Recargar menciones
    refetchMentions();
  }}
/>
```

---

## Monitoreo y Logs

### Logs en Consola

```javascript
// Análisis individual
🤖 Iniciando análisis de sentimiento para: [contenido]
✅ Análisis completado con Gemini AI: {sentiment, score}
⚠️ Gemini AI falló, usando keywords fallback
✅ Mención actualizada en Supabase: [mentionId]

// Análisis batch
🤖 Iniciando análisis batch de 50 menciones
📊 Progreso: 10/50 menciones procesadas
✅ Análisis batch completado: 45 exitosos, 5 fallidos
```

### Métricas a Monitorear

1. **Tasa de éxito de Gemini AI** (objetivo: >95%)
2. **Tiempo promedio de análisis** (objetivo: <2 segundos)
3. **Tasa de uso de fallback** (objetivo: <5%)
4. **Distribución de sentimientos** (estadísticas generales)

---

## Próximas Mejoras

### Fase 2 (Corto Plazo)
- [ ] Caché de análisis para contenido duplicado
- [ ] Detección de emociones específicas (alegría, enojo, tristeza)
- [ ] Análisis de urgencia para crisis potenciales
- [ ] Dashboard de métricas de sentimiento

### Fase 3 (Mediano Plazo)
- [ ] Webhooks para notificaciones de sentimiento negativo
- [ ] Análisis de tendencias temporales
- [ ] Comparación con competidores
- [ ] Alertas automáticas de crisis de reputación

### Fase 4 (Largo Plazo)
- [ ] Machine learning para mejorar precisión
- [ ] Análisis multiidioma (inglés, portugués)
- [ ] Integración con herramientas de respuesta automática
- [ ] Predicción de impacto de menciones

---

## Troubleshooting

### Error: "Gemini API not configured"
**Solución**: Verificar que `GEMINI_API_KEY` esté en `.env.local`

### Error: "Supabase no está configurado"
**Solución**: Verificar `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Rate limit excedido"
**Solución**: Esperar 1 minuto o usar análisis batch con delay automático

### Análisis incorrecto (falsos positivos/negativos)
**Solución**:
1. Revisar keywords en fallback
2. Ajustar temperatura de Gemini (actualmente 0.3)
3. Mejorar prompt con ejemplos específicos

---

## Archivos Creados/Modificados

### Creados
1. `/src/app/api/mentions/analyze-sentiment/route.ts` - Endpoint individual
2. `/src/app/api/mentions/analyze-batch/route.ts` - Endpoint batch
3. `/src/app/api/mentions/pending-analysis/route.ts` - Endpoint pendientes
4. `/src/app/api/mentions/README.md` - Documentación de API
5. `/src/components/dashboard/SentimentAnalysisButton.tsx` - Componente botón
6. `/src/components/dashboard/BatchSentimentAnalysis.tsx` - Componente batch
7. `/scripts/test-sentiment-api.js` - Script de testing
8. `SENTIMENT_ANALYSIS_IMPLEMENTATION.md` - Este documento

### Modificados
1. `/src/lib/ai-service.ts` - Mejorado método `analyzeSentiment()`

---

## Contacto y Soporte

Para dudas sobre la implementación:
- Revisar logs en consola del servidor
- Ejecutar script de prueba: `node scripts/test-sentiment-api.js`
- Consultar documentación en `/src/app/api/mentions/README.md`

---

**Estado**: ✅ Implementación Completa y Lista para Producción
**Versión**: 1.0.0
**Fecha**: 19 de Noviembre de 2025
**Backend Architect**: Sistema de Análisis de Sentimiento IA
