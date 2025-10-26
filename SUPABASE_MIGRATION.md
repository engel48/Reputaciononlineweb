# 🚀 Migración Completa a Supabase - Reputación Online

## 📊 Resumen de Migración

Este documento describe la migración completa del proyecto Reputación Online a Supabase, aprovechando todas sus capacidades para IA y funcionalidades avanzadas.

---

## 🎯 Features de Supabase que Usaremos

### 1. **Supabase Database (PostgreSQL)**
- ✅ Reemplaza SQLite actual
- ✅ Schema completo con Prisma
- ✅ Backups automáticos
- ✅ Escalabilidad ilimitada

### 2. **Supabase Auth**
- ✅ Reemplaza NextAuth + JWT custom
- ✅ OAuth para 7 plataformas (Facebook, X, LinkedIn, Instagram, YouTube, Threads, TikTok)
- ✅ Row Level Security automático
- ✅ Email verification
- ✅ Password reset
- ✅ Session management

### 3. **Supabase Storage**
- ✅ Avatars de usuario
- ✅ Reportes en PDF
- ✅ Screenshots de menciones
- ✅ Archivos de análisis
- ✅ CDN global integrado

### 4. **Supabase Edge Functions (Para IA)**
- ✅ Julia AI (chat assistant)
- ✅ Análisis de sentimientos
- ✅ Búsqueda de personas
- ✅ Análisis político
- ✅ Generación de contenido
- ✅ Sin límites de timeout (vs Next.js API)

### 5. **Supabase Vector (pgvector)**
- ✅ Embeddings de menciones
- ✅ Búsqueda semántica de noticias
- ✅ Recomendaciones personalizadas
- ✅ Detección de menciones similares

### 6. **Supabase Realtime**
- ✅ Dashboard en vivo sin polling
- ✅ Notificaciones instantáneas
- ✅ Actualizaciones de menciones en tiempo real
- ✅ Chat con Julia en streaming

---

## 🏗️ Arquitectura Nueva vs Actual

### **Antes (Actual)**
```
Next.js App
├── SQLite local (488KB)
├── PostgreSQL manual (backup)
├── NextAuth (OAuth)
├── JWT custom (auth)
├── AI Service (OpenAI/DeepSeek)
├── Polling para updates
└── Next.js API Routes (timeout 60s)
```

### **Después (Con Supabase)**
```
Next.js App
├── Supabase PostgreSQL (managed)
├── Supabase Auth (OAuth integrado)
├── Supabase Storage (archivos)
├── Supabase Edge Functions (IA sin timeout)
├── Supabase Vector (búsqueda semántica)
├── Supabase Realtime (WebSockets)
└── Row Level Security (seguridad automática)
```

---

## 📦 Dependencias a Instalar

```bash
# Supabase core
npm install @supabase/supabase-js @supabase/ssr

# Para Auth en App Router de Next.js
npm install @supabase/auth-helpers-nextjs

# Vector search
npm install @supabase/vecs

# Edge Functions CLI (desarrollo local)
npm install -g supabase
```

---

## 🔧 Configuración de Supabase

### **1. Crear Proyecto en Supabase**

1. Ir a https://supabase.com/dashboard
2. Crear nuevo proyecto
3. Guardar credenciales:
   - `Project URL`
   - `anon (public) key`
   - `service_role (secret) key`
   - `Database password`

### **2. Variables de Entorno Nuevas**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_PASSWORD=your-db-password

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres

# AI Services (se moverán a Edge Functions)
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...

# OAuth Providers (ahora en Supabase Auth)
# Ya no necesitas NEXTAUTH_SECRET, NEXTAUTH_URL
# Las credenciales OAuth se configuran en Supabase Dashboard
```

### **3. Eliminar Variables Obsoletas**

```env
# Ya NO necesitas:
# FORCE_SQLITE=true
# DATABASE_URL_LOCAL=file:./data/app.db
# JWT_SECRET=...
# NEXTAUTH_SECRET=...
# NEXTAUTH_URL=...
```

---

## 📁 Estructura de Archivos Nueva

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Cliente Supabase para cliente
│   │   ├── server.ts           # Cliente Supabase para servidor
│   │   ├── middleware.ts       # Middleware con Supabase
│   │   └── admin.ts            # Cliente admin (service_role)
│   ├── ai/
│   │   ├── embeddings.ts       # Generación de embeddings
│   │   └── vector-search.ts    # Búsqueda semántica
│   └── storage/
│       ├── avatars.ts          # Gestión de avatars
│       └── reports.ts          # Gestión de reportes
│
├── app/
│   ├── auth/
│   │   └── callback/           # OAuth callback (Supabase)
│   └── api/
│       └── (endpoints actuales se simplifican)
│
└── middleware.ts               # Reescrito con Supabase Auth

supabase/
├── functions/                  # Edge Functions
│   ├── julia-chat/             # Chat con Julia AI
│   ├── sentiment-analysis/     # Análisis de sentimientos
│   ├── person-search/          # Búsqueda de personas
│   ├── political-analysis/     # Análisis político
│   └── content-generator/      # Generación de contenido
│
├── migrations/                 # Migraciones SQL
│   ├── 001_initial_schema.sql  # Schema desde Prisma
│   ├── 002_enable_vector.sql   # Habilitar pgvector
│   └── 003_rls_policies.sql    # Row Level Security
│
└── config.toml                 # Configuración local
```

---

## 🔐 Row Level Security (RLS) Policies

Cada tabla tendrá políticas de seguridad automáticas:

```sql
-- Ejemplo: Usuarios solo ven sus propios datos
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Ejemplo: Social media solo del usuario
CREATE POLICY "Users can view own social media"
  ON social_media FOR SELECT
  USING (auth.uid() = user_id);

-- Ejemplo: Notificaciones solo del usuario
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🤖 Edge Functions para IA

### **Ventajas sobre Next.js API Routes:**

| Feature | Next.js API | Edge Functions |
|---------|-------------|----------------|
| Timeout | 60 segundos | Sin límite |
| Cold start | ~500ms | ~50ms |
| Región | Una sola | Global |
| Costo | Por servidor | Por request |
| Streaming | Complejo | Nativo |

### **Example: Julia Chat Edge Function**

```typescript
// supabase/functions/julia-chat/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth automático
    const authHeader = req.headers.get('Authorization')!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verificar usuario
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Procesar request
    const { message } = await req.json()

    // Llamar a OpenAI/DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Eres Julia, asistente de reputación online...' },
          { role: 'user', content: message }
        ],
        stream: true // STREAMING NATIVO
      })
    })

    // Retornar stream
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        ...corsHeaders
      }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
})
```

---

## 🔍 Vector Search para Menciones

### **Setup pgvector**

```sql
-- Habilitar extensión
CREATE EXTENSION IF NOT EXISTS vector;

-- Agregar columna de embedding a menciones
ALTER TABLE mentions
ADD COLUMN embedding vector(1536);

-- Índice para búsqueda rápida
CREATE INDEX ON mentions
USING ivfflat (embedding vector_cosine_ops);

-- Función de búsqueda semántica
CREATE FUNCTION search_similar_mentions(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  FROM mentions
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### **Uso en Código**

```typescript
// Generar embedding del query
const { data: embedding } = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: 'búsqueda de menciones sobre política'
})

// Buscar menciones similares
const { data: mentions } = await supabase.rpc('search_similar_mentions', {
  query_embedding: embedding.data[0].embedding,
  match_threshold: 0.78,
  match_count: 10
})
```

---

## ⚡ Realtime para Dashboard

```typescript
// Suscribirse a cambios en tiempo real
const channel = supabase
  .channel('dashboard-updates')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    console.log('Nueva notificación:', payload.new)
    // Actualizar UI automáticamente
    setNotifications(prev => [payload.new, ...prev])
  })
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

---

## 📦 Storage Buckets

```typescript
// Crear buckets (una vez)
await supabase.storage.createBucket('avatars', {
  public: true,
  fileSizeLimit: 2097152 // 2MB
})

await supabase.storage.createBucket('reports', {
  public: false // Privado, solo usuario
})

// Upload avatar
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

// Get URL pública
const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)
```

---

## 🔄 Proceso de Migración

### **Fase 1: Setup Inicial (30 min)**
1. ✅ Crear proyecto en Supabase
2. ✅ Instalar dependencias
3. ✅ Configurar variables de entorno
4. ✅ Crear archivos de configuración

### **Fase 2: Database (1 hora)**
5. ✅ Migrar schema de Prisma
6. ✅ Copiar datos de SQLite
7. ✅ Configurar RLS policies
8. ✅ Habilitar pgvector

### **Fase 3: Authentication (2 horas)**
9. ✅ Configurar OAuth providers
10. ✅ Reescribir middleware
11. ✅ Migrar páginas de login/register
12. ✅ Actualizar session handling

### **Fase 4: Storage (30 min)**
13. ✅ Crear buckets
14. ✅ Migrar uploads existentes
15. ✅ Actualizar componentes

### **Fase 5: Edge Functions (3 horas)**
16. ✅ Crear función Julia chat
17. ✅ Crear función sentiment analysis
18. ✅ Crear función person search
19. ✅ Actualizar frontend para usar Edge Functions

### **Fase 6: Vector Search (1 hora)**
20. ✅ Configurar pgvector
21. ✅ Generar embeddings de menciones
22. ✅ Implementar búsqueda semántica

### **Fase 7: Realtime (1 hora)**
23. ✅ Implementar suscripciones
24. ✅ Actualizar dashboard
25. ✅ Configurar notificaciones en vivo

### **Fase 8: Testing (1 hora)**
26. ✅ Probar autenticación
27. ✅ Probar Edge Functions
28. ✅ Probar Realtime
29. ✅ Verificar RLS

---

## 💰 Costos Estimados

### **Supabase Free Tier:**
- ✅ 500 MB de database
- ✅ 1 GB de file storage
- ✅ 2 million Edge Function invocations/mes
- ✅ Realtime ilimitado
- ✅ 50,000 monthly active users

### **Tu Proyecto Actual:**
- Database: ~500 KB (✅ Cabe en free tier)
- Usuarios: 15 (✅ Muy por debajo del límite)
- Storage: Mínimo (✅ Cabe en free tier)

**Conclusión: Gratis durante desarrollo y primeros clientes**

Cuando crezcas:
- **Pro Plan**: $25/mes → 8 GB DB, 100 GB storage
- **Team Plan**: $599/mes → 1 TB DB, ilimitado

---

## 🎯 Beneficios Específicos para Reputación Online

1. **Búsqueda Semántica de Menciones**
   - Encuentra menciones similares aunque usen palabras diferentes
   - Ejemplo: "excelente político" = "gran líder" = "buen gobernante"

2. **Dashboard en Tiempo Real**
   - Nuevas menciones aparecen automáticamente
   - No más polling cada 30 segundos

3. **IA Sin Timeouts**
   - Análisis profundos que toman minutos
   - Generación de reportes extensos

4. **Seguridad Automática**
   - Cada usuario solo ve sus datos (RLS)
   - No más validaciones manuales en cada query

5. **Escalabilidad**
   - De 15 usuarios a 100,000 sin cambios de código

---

## 🚀 Próximos Pasos

¿Listo para comenzar? Voy a:

1. ✅ Instalar todas las dependencias
2. ✅ Crear configuración de Supabase
3. ✅ Migrar base de datos
4. ✅ Configurar autenticación
5. ✅ Crear Edge Functions para IA
6. ✅ Implementar vector search
7. ✅ Activar Realtime

**Tiempo total estimado: 6-8 horas**

**¿Empezamos? Responde "sí" para que comience la migración.**
