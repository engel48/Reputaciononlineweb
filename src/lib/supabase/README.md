# 🗂️ Supabase Clients - Guía de Uso

Este directorio contiene los clientes de Supabase configurados para diferentes contextos de ejecución en Next.js.

---

## 📁 Archivos

### `client.ts` - Cliente del Navegador
**Cuándo usar:**
- ✅ Client Components (`'use client'`)
- ✅ Hooks de React
- ✅ Event handlers del navegador
- ✅ Subscripciones Realtime
- ✅ Uploads de archivos desde el cliente

**Ejemplo:**
```typescript
'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function MyComponent() {
  const supabase = getSupabaseBrowserClient()

  const handleClick = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
  }
}
```

---

### `server.ts` - Cliente del Servidor
**Cuándo usar:**
- ✅ Server Components (por defecto en App Router)
- ✅ API Routes (`app/api/*/route.ts`)
- ✅ Server Actions
- ✅ `generateMetadata()`
- ✅ `generateStaticParams()`

**Ejemplo:**
```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('*')

  return <div>{/* render data */}</div>
}

// API Route
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('*')

  return Response.json(data)
}
```

---

### `middleware.ts` - Cliente de Middleware
**Cuándo usar:**
- ✅ En `middleware.ts` (protección de rutas)
- ✅ Para refrescar sesiones automáticamente
- ✅ Para verificar autenticación antes de acceder a rutas

**Ejemplo:**
```typescript
// middleware.ts (raíz del proyecto)
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)

  // Proteger rutas
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

---

### `admin.ts` - Cliente Administrativo
**Cuándo usar:**
- ⚠️ **SOLO en el servidor** (NUNCA en el cliente)
- ✅ Crear usuarios programáticamente
- ✅ Operaciones que bypassan RLS
- ✅ Migraciones de datos
- ✅ Tareas administrativas

**⚠️ ADVERTENCIA:** Este cliente usa `service_role` key que bypassa toda seguridad RLS.

**Ejemplo:**
```typescript
// Solo en el servidor (API Route, Server Action)
import { createUserAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const user = await createUserAdmin({
    email: 'user@example.com',
    password: 'password123',
    emailConfirmed: true
  })

  return Response.json(user)
}
```

---

## 🔒 Seguridad

### Keys de Supabase

1. **anon key** (pública)
   - ✅ Segura para exponer en el navegador
   - ✅ Respeta Row Level Security (RLS)
   - ✅ Solo accede a datos permitidos por políticas RLS

2. **service_role key** (secreta)
   - ⚠️ NUNCA exponer en el cliente
   - ⚠️ Bypassa Row Level Security
   - ⚠️ Solo usar en el servidor
   - ⚠️ Debe estar en `.env.local` (NO en `NEXT_PUBLIC_*`)

---

## 📊 Diagrama de Decisión

```
┌─────────────────────────────────────┐
│ ¿Dónde corre mi código?             │
└─────────────────────────────────────┘
                │
     ┌──────────┴──────────┐
     │                     │
┌────▼─────┐      ┌────────▼──────┐
│ Navegador│      │   Servidor    │
└────┬─────┘      └────────┬──────┘
     │                     │
     │            ┌────────┴────────┐
     │            │                 │
     │      ┌─────▼──────┐   ┌──────▼──────┐
     │      │ Middleware │   │ Server/API  │
     │      │            │   │             │
     │      │ middleware │   │ server.ts   │
     │      │   .ts      │   │             │
     │      └────────────┘   └──────┬──────┘
     │                              │
┌────▼──────┐               ┌──────▼───────┐
│ client.ts │               │ ¿Necesitas   │
│           │               │ bypass RLS?  │
└───────────┘               └──────┬───────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                      ┌───▼────┐      ┌─────▼─────┐
                      │   NO   │      │    SÍ     │
                      │        │      │           │
                      │server.ts│     │  admin.ts │
                      └────────┘      └───────────┘
```

---

## 🔗 Helpers Disponibles

### Client (Navegador)
- `getSupabaseBrowserClient()` - Obtener cliente singleton
- `getCurrentUser()` - Usuario actual
- `getCurrentSession()` - Sesión actual
- `signOut()` - Cerrar sesión
- `isAuthenticated()` - Verificar autenticación

### Server
- `createClient()` - Crear cliente (async)
- `getCurrentUser()` - Usuario actual (async)
- `getCurrentSession()` - Sesión actual (async)
- `isAuthenticated()` - Verificar autenticación (async)
- `getUserProfile(userId?)` - Perfil completo del usuario
- `requireAuth()` - Lanzar error si no autenticado

### Middleware
- `updateSession(request)` - Refrescar sesión y obtener usuario

### Admin
- `getSupabaseAdmin()` - Cliente admin
- `createUserAdmin(data)` - Crear usuario
- `updateUserAdmin(id, updates)` - Actualizar usuario
- `deleteUserAdmin(id)` - Eliminar usuario
- `listUsersAdmin(page, perPage)` - Listar usuarios
- `queryAsAdmin(table, filters)` - Consultar sin RLS
- `migrateAuthUserToUsersTable(user)` - Migrar usuario

---

## 📝 Ejemplos Comunes

### Obtener usuario en Client Component
```typescript
'use client'
import { getCurrentUser } from '@/lib/supabase/client'

export function ProfileButton() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  return <div>{user?.email}</div>
}
```

### Obtener usuario en Server Component
```typescript
import { getCurrentUser } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Welcome {user.email}</div>
}
```

### Proteger ruta con middleware
```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

### Realtime subscription
```typescript
'use client'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export function RealtimeNotifications() {
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('Nueva notificación:', payload)
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])
}
```

---

## ⚙️ Variables de Entorno Requeridas

### Públicas (NEXT_PUBLIC_*)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Privadas (solo servidor)
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Solo para admin.ts
DATABASE_URL=postgresql://postgres:...  # Para Prisma
```

---

## 🚀 Próximos Pasos

1. Configurar Auth providers en Supabase Dashboard
2. Crear políticas de Row Level Security (RLS)
3. Configurar Storage buckets
4. Crear Edge Functions para IA
5. Habilitar pgvector para búsqueda semántica
