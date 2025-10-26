# Integración Frontend de Supabase - COMPLETADA

Este documento detalla la integración completa de Supabase en el frontend de "Reputación Online" con Next.js 14 App Router.

---

## RESUMEN DE CAMBIOS COMPLETADOS

### 1. Dependencias Instaladas

Se agregaron las siguientes dependencias a `package.json`:

```json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.47.14"
}
```

**Ejecutar:** `npm install` (ya ejecutado)

---

### 2. Variables de Entorno Actualizadas

Archivo: `.env.local`

```env
# Supabase Project Settings (Nuevo proyecto: shiqwhbodviimvpxpszd)
NEXT_PUBLIC_SUPABASE_URL=https://shiqwhbodviimvpxpszd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini API Key (para Amelia AI Assistant)
GEMINI_API_KEY=your_gemini_api_key_here
```

**IMPORTANTE:** Reemplaza `your_gemini_api_key_here` con tu API key real de Google Gemini.

---

### 3. Tipos de TypeScript Generados

Archivo: `/src/types/supabase.ts`

- Generado automáticamente desde el schema de Supabase
- Contiene types para todas las tablas: `users`, `user_stats`, `social_media`, `notifications`, `alerts`, `reports`, etc.
- Provee autocompletado y type-safety en toda la aplicación

**Regenerar types:**
```bash
npm run supabase:types
```

---

### 4. Clientes de Supabase Creados

#### `/src/lib/supabase/client.ts` - Cliente del navegador
- Para Client Components (`'use client'`)
- Hooks de React, event handlers
- Realtime subscriptions

**Uso:**
```typescript
import { useSupabase } from '@/components/providers/SupabaseProvider'

const { supabase } = useSupabase()
const { data } = await supabase.from('users').select('*')
```

#### `/src/lib/supabase/server.ts` - Cliente del servidor
- Para Server Components
- API Routes
- Server Actions

**Uso:**
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('users').select('*')
```

#### `/src/lib/supabase/middleware.ts` - Cliente de middleware
- Para `middleware.ts`
- Refresca sesiones automáticamente
- Verifica autenticación antes de acceder a rutas

#### `/src/lib/supabase/admin.ts` - Cliente administrativo
- Usa service_role key (bypassa RLS)
- Solo para operaciones de administración
- NUNCA exponer en el cliente

---

### 5. Middleware de Autenticación

Archivo: `/src/middleware.ts`

**Cambios:**
- Reemplazado sistema JWT personalizado por Supabase Auth
- Protege rutas automáticamente
- Refresca tokens en cada request
- Verifica roles de admin para rutas `/admin/*`
- Redirige usuarios autenticados que intentan acceder a `/login` o `/register`

**Rutas protegidas:**
- `/dashboard`, `/settings`, `/reports`, `/alerts`, `/analytics`, `/amelia`, `/onboarding`

**Rutas de admin:**
- `/admin/*` (requiere role = 'admin')

---

### 6. Providers y Contextos

#### `/src/components/providers/SupabaseProvider.tsx`
- Proveedor principal de Supabase
- Maneja estado de autenticación
- Escucha cambios de sesión en tiempo real

#### `/src/contexts/UserContext.tsx`
- Contexto de usuario con datos del perfil
- Combina auth.users con tabla `users`
- Hooks: `useUserContext()`, `useUser()`, `useUserData()`

**Uso:**
```typescript
import { useUserContext } from '@/contexts/UserContext'

const { user, userData, loading, signOut, refreshUser } = useUserContext()
```

#### `/src/contexts/CreditsContext.tsx`
- Contexto de créditos del usuario
- Realtime updates cuando cambian los créditos
- Deducción de créditos con registro de actividad

**Uso:**
```typescript
import { useCredits } from '@/contexts/CreditsContext'

const { credits, plan, refreshCredits, deductCredits } = useCredits()

// Deducir créditos
await deductCredits(10, 'Búsqueda de persona')
```

---

### 7. Layout Principal Actualizado

Archivo: `/src/app/layout.tsx`

```typescript
<SupabaseProvider>
  <UserProvider>
    <CreditsProvider>
      <ClientWrapper>
        {children}
      </ClientWrapper>
    </CreditsProvider>
  </UserProvider>
</SupabaseProvider>
```

**Orden de providers:**
1. SupabaseProvider (base)
2. UserProvider (depende de Supabase)
3. CreditsProvider (depende de User)
4. ClientWrapper (contextos existentes)

---

### 8. Página de Login con OAuth

Archivo: `/src/app/login/page.tsx`

**Nueva implementación:**
- Autenticación email/password con Supabase
- OAuth con Google, Facebook, Twitter (X), LinkedIn
- Manejo de errores en español
- Redirección automática después del login
- UI moderna con Tailwind CSS

**Backup del login anterior:**
- `/src/app/login/page.tsx.backup`

---

### 9. Callback de OAuth

Archivo: `/src/app/auth/callback/route.ts`

- Route Handler para manejar callbacks de OAuth providers
- Intercambia código por sesión
- Redirige al dashboard o ruta especificada

**URL de callback en Supabase Dashboard:**
```
http://localhost:3000/auth/callback
```

---

### 10. Hook Personalizado useAmelia

Archivo: `/src/hooks/useAmelia.ts`

**Funcionalidades:**
- Enviar mensajes a Amelia (Edge Function + fallback a API)
- Crear conversaciones
- Obtener historial de conversaciones
- Obtener mensajes de una conversación
- Eliminar conversaciones

**Uso:**
```typescript
import { useAmelia } from '@/hooks/useAmelia'

const { sendMessage, loading, error } = useAmelia()

const response = await sendMessage('¿Cómo está mi reputación?', conversationId)
```

---

### 11. Ejemplo de Dashboard

Archivo: `/src/examples/dashboard-supabase-example.tsx`

**Demuestra:**
- Uso de `useSupabase`, `useUserContext`, `useCredits`
- Queries a múltiples tablas
- Realtime subscriptions a notificaciones
- Actualización de datos (marcar notificaciones como leídas)
- UI con métricas, redes sociales, notificaciones

**Referencia para implementar en componentes reales del dashboard**

---

## PRÓXIMOS PASOS

### 1. Configurar OAuth en Supabase Dashboard

Ir a: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/auth/providers

**Habilitar providers:**
- Google OAuth
- Facebook OAuth
- Twitter (X) OAuth
- LinkedIn OAuth

**Callback URLs:**
- Development: `http://localhost:3000/auth/callback`
- Production: `https://tudominio.com/auth/callback`

### 2. Obtener API Key de Google Gemini

1. Ir a: https://makersuite.google.com/app/apikey
2. Crear API key
3. Agregar a `.env.local`:
   ```env
   GEMINI_API_KEY=tu-api-key-aqui
   ```

### 3. Migrar Componentes Existentes

**Componentes a actualizar:**

1. **Dashboard principal** (`/src/app/dashboard/page.tsx`)
   - Usar ejemplo de `/src/examples/dashboard-supabase-example.tsx`
   - Reemplazar queries SQLite con Supabase

2. **Componentes de redes sociales** (`/src/components/dashboard/`)
   - Usar `social_media` table
   - Implementar OAuth para conectar cuentas

3. **Página de alertas** (`/src/app/alerts/`)
   - Query a `alerts` table
   - Realtime updates cuando se activa una alerta

4. **Página de reportes** (`/src/app/reports/`)
   - Query a `reports` table
   - Generar PDFs con datos de Supabase

5. **Notificaciones** (`/src/components/notifications/`)
   - Usar hook `useNotifications` (crear si no existe)
   - Realtime subscriptions

### 4. Crear Edge Functions de Supabase

**Funciones necesarias:**

1. **credit-manager** - Gestión de créditos
2. **amelia-chat** - Chat con Gemini
3. **search-person** - Búsqueda de personas
4. **sentiment-analysis** - Análisis de sentimiento
5. **report-generator** - Generación de reportes PDF

**Ubicación:** `/supabase/functions/`

### 5. Testing

**Tests a ejecutar:**

```bash
# 1. Verificar que la app compila
npm run build

# 2. Iniciar en desarrollo
npm run dev

# 3. Probar login
# - Ir a http://localhost:3000/login
# - Probar email/password
# - Probar OAuth (requiere configuración en Supabase)

# 4. Verificar middleware
# - Intentar acceder a /dashboard sin auth → redirige a /login
# - Hacer login → redirige a /dashboard
# - Intentar acceder a /admin sin ser admin → redirige a /dashboard
```

---

## ESTRUCTURA DE ARCHIVOS CREADOS/MODIFICADOS

```
/src/
  /types/
    supabase.ts                          # NUEVO - Types generados de Supabase

  /lib/supabase/
    client.ts                            # ACTUALIZADO - Agregado Database type
    server.ts                            # ACTUALIZADO - Agregado Database type
    middleware.ts                        # EXISTÍA - Sin cambios
    admin.ts                             # ACTUALIZADO - Agregado Database type

  /components/providers/
    SupabaseProvider.tsx                 # NUEVO - Provider de Supabase

  /contexts/
    UserContext.tsx                      # NUEVO - Contexto de usuario
    CreditsContext.tsx                   # NUEVO - Contexto de créditos

  /hooks/
    useAmelia.ts                         # NUEVO - Hook para Amelia AI

  /app/
    layout.tsx                           # ACTUALIZADO - Agregados providers

    /login/
      page.tsx                           # ACTUALIZADO - Nueva UI con OAuth
      page.tsx.backup                    # NUEVO - Backup del login anterior

    /auth/callback/
      route.ts                           # NUEVO - Callback de OAuth

  /examples/
    dashboard-supabase-example.tsx       # NUEVO - Ejemplo de dashboard

  middleware.ts                          # ACTUALIZADO - Supabase Auth

package.json                             # ACTUALIZADO - Dependencias de Supabase
.env.local                               # ACTUALIZADO - Credenciales de Supabase
```

---

## COMANDOS ÚTILES

```bash
# Generar types de TypeScript desde Supabase
npm run supabase:types

# Iniciar desarrollo
npm run dev

# Build de producción
npm run build

# Linter
npm run lint
```

---

## RECURSOS Y DOCUMENTACIÓN

- **Supabase Docs:** https://supabase.com/docs
- **Next.js + Supabase:** https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **Google Gemini API:** https://ai.google.dev/docs

---

## SOPORTE

Si tienes problemas con la integración:

1. Verifica que las variables de entorno estén correctas en `.env.local`
2. Asegúrate de que las tablas existen en Supabase (ejecuta migraciones del Agente 1)
3. Verifica que las Edge Functions están desplegadas (trabajo del Agente 2)
4. Consulta la consola del navegador para errores de autenticación
5. Revisa los logs de Supabase Dashboard para errores de backend

---

**INTEGRACIÓN FRONTEND COMPLETADA** ✅

Siguiente paso: Coordinar con **Agente 4 (DevOps)** para deployment.
