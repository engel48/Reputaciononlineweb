# 🚀 Supabase Edge Functions - Reputación Online

Edge Functions para IA sin límites de timeout.

## 📁 Funciones Disponibles

### 1. `julia-chat` - Chat con Julia AI
**Descripción:** Chat interactivo con Julia, la asistente de IA especializada en reputación online

**Features:**
- ✅ Streaming de respuestas (como ChatGPT)
- ✅ Sin límites de timeout
- ✅ Fallback OpenAI → DeepSeek
- ✅ Context awareness

**Uso:**
```typescript
const response = await fetch(
  'https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/julia-chat',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: '¿Cómo puedo mejorar mi reputación online?',
      context: 'Usuario es político con 50k seguidores'
    })
  }
)

// Leer stream
const reader = response.body.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // Procesar chunk
}
```

---

### 2. `sentiment-analysis` - Análisis de Sentimientos
**Descripción:** Analiza el sentimiento de textos (positivo, negativo, neutral)

**Features:**
- ✅ Análisis individual o batch
- ✅ Score de 0-1
- ✅ Explicación del resultado
- ✅ Fallback a keywords si IA falla

**Uso:**
```typescript
// Análisis de un texto
const response = await fetch(
  'https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/sentiment-analysis',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: 'Este producto es excelente'
    })
  }
)

const result = await response.json()
// { sentiment: 'positive', score: 0.85, explanation: '...' }

// Análisis batch
const batchResponse = await fetch(url, {
  method: 'POST',
  body: JSON.stringify({
    texts: ['texto 1', 'texto 2', 'texto 3']
  })
})

const { results } = await batchResponse.json()
// results: Array de SentimentResult
```

---

### 3. `person-search` - Búsqueda de Personas
**Descripción:** Busca información pública sobre personas usando IA

**Features:**
- ✅ Bio profesional
- ✅ Highlights de carrera
- ✅ Presencia en redes sociales
- ✅ Insights de reputación

**Uso:**
```typescript
const response = await fetch(
  'https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/person-search',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Gustavo Petro',
      context: 'Político colombiano'
    })
  }
)

const result = await response.json()
/*
{
  bio: "Presidente de Colombia...",
  highlights: ["Alcalde de Bogotá", "Senador"],
  socialPresence: ["Twitter: @petrogustavo", "Facebook"],
  reputationInsights: "Alto perfil público..."
}
*/
```

---

## 🛠️ Desarrollo Local

### Prerrequisitos
```bash
npm install -g supabase
```

### Setup Inicial
```bash
# 1. Login a Supabase
supabase login

# 2. Link al proyecto
supabase link --project-ref fxyfzktnwugdfwclevdz

# 3. Crear archivo de env
echo "OPENAI_API_KEY=sk-..." > supabase/.env.local
echo "DEEPSEEK_API_KEY=sk-..." >> supabase/.env.local
```

### Correr Localmente
```bash
# Iniciar todas las funciones
supabase functions serve

# O una específica
supabase functions serve julia-chat --env-file supabase/.env.local

# URL local: http://localhost:54321/functions/v1/julia-chat
```

### Test con cURL
```bash
# Get access token del dashboard
# Auth → Users → Copy access token

curl -X POST \
  http://localhost:54321/functions/v1/julia-chat \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola Julia"}'
```

---

## 🚀 Deployment

### Deploy Individual
```bash
supabase functions deploy julia-chat
supabase functions deploy sentiment-analysis
supabase functions deploy person-search
```

### Deploy Todas
```bash
supabase functions deploy
```

### Variables de Entorno en Producción
```bash
# Setear secrets en Supabase
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set DEEPSEEK_API_KEY=sk-...

# Ver secrets
supabase secrets list
```

---

## 📊 Monitoring

### Logs en Vivo
```bash
# Logs de todas las funciones
supabase functions logs

# Logs de una función específica
supabase functions logs julia-chat --tail
```

### Dashboard
Ver logs y métricas en:
https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/functions

---

## 🔧 Configuración de CORS

Las funciones ya tienen CORS configurado para permitir requests desde cualquier origen.

Para restringir a dominios específicos, editar `corsHeaders` en cada función:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://tuapp.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

---

## ⚡ Performance

**Ventajas vs Next.js API Routes:**

| Feature | Next.js API | Edge Functions |
|---------|-------------|----------------|
| Timeout | 60 segundos | Sin límite ⭐ |
| Cold start | ~500ms | ~50ms ⭐ |
| Región | Una sola | Global ⭐ |
| Costo | Por servidor | Por invocación ⭐ |
| Streaming | Complejo | Nativo ⭐ |

---

## 📖 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land)
- [OpenAI API](https://platform.openai.com/docs)
- [DeepSeek API](https://platform.deepseek.com/docs)

---

## 🐛 Troubleshooting

### Error: "Unauthorized"
- Asegúrate de pasar el token de autenticación en el header
- Verificar que el token no haya expirado

### Error: "No AI API keys configured"
- Setear secrets: `supabase secrets set OPENAI_API_KEY=...`
- O agregar a `supabase/.env.local` para desarrollo local

### Function no aparece después de deploy
- Verificar logs: `supabase functions logs`
- Re-deployar: `supabase functions deploy --no-verify-jwt`
- Verificar en Dashboard → Functions

### CORS errors
- Verificar que `corsHeaders` estén en la respuesta
- Verificar preflight request (OPTIONS)

---

## 💰 Costos (Free Tier)

- **2 millones de invocaciones/mes** gratis
- Después: $2 por millón de invocaciones
- Promedio: 100ms por invocación = 20,000 requests gratis/mes

Para tu caso (15 usuarios):
- ~100 requests/día = 3,000/mes
- ✅ **100% dentro del free tier**

---

## 🎯 Próximas Funciones (Opcional)

Ideas para expandir:
- `political-analysis` - Análisis político especializado
- `content-generator` - Generación de contenido para redes
- `trend-detector` - Detección de tendencias
- `crisis-monitor` - Monitor de crisis de reputación
- `report-generator` - Generación de reportes PDF
