# 🤝 Handoff: Backend Architect → Frontend Builder

**De**: Backend Architect (Agente 2)
**Para**: Frontend Builder (Agente 3)
**Proyecto**: Reputación Online - Migración a Supabase
**Fecha**: 2025-10-25

---

## 📦 Entrega Completada

He completado toda la infraestructura backend necesaria para que puedas construir el frontend:

✅ **Edge Functions**: 5 funciones listas (1 desplegada, 4 por desplegar)
✅ **Seguridad**: RLS completo en 11 tablas
✅ **Storage**: 3 buckets configurados
✅ **OAuth**: 7 plataformas documentadas
✅ **Automatización**: Cron jobs configurados

---

## 🔗 URLs y Endpoints Disponibles

### Supabase Project
```
Project ID: shiqwhbodviimvpxpszd
URL: https://shiqwhbodviimvpxpszd.supabase.co
Dashboard: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd
```

### Edge Functions Base URL
```
https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/
```

### Edge Functions Endpoints

#### ✅ auth-webhook (DEPLOYED)
```
POST /auth-webhook
Status: ACTIVE ✅
Purpose: Maneja eventos de autenticación automáticamente
Note: Solo para uso interno de Supabase Auth
```

#### 📝 payment-webhook (READY)
```
POST /payment-webhook
Status: Created, pending deployment 📝
Purpose: Recibe webhooks de Wompi para procesar pagos
Auth: Wompi signature verification
```

#### 📝 amelia-chat (READY)
```
POST /amelia-chat
Status: Created, pending deployment 📝
Purpose: Chat con Amelia AI (Gemini 1.5 Pro)
Auth: Bearer token (anon key or user JWT)

Request:
{
  "user_id": "uuid",
  "message": "¿Cómo está mi reputación?",
  "conversation_id": "uuid" // optional
}

Response:
{
  "success": true,
  "conversation_id": "uuid",
  "response": "Respuesta de Amelia...",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

#### 📝 scraping-scheduler (READY)
```
POST /scraping-scheduler
Status: Created, pending deployment 📝
Purpose: Crea jobs de scraping automáticamente (llamado por cron)
Auth: Service role key only
Note: Se ejecuta cada 15 min automáticamente
```

#### 📝 credit-manager (READY)
```
POST /credit-manager
Status: Created, pending deployment 📝
Purpose: Gestiona créditos del usuario (check, deduct, add)
Auth: Bearer token (user JWT)

Request (Check):
{
  "action": "check",
  "user_id": "uuid"
}

Request (Deduct):
{
  "action": "deduct",
  "user_id": "uuid",
  "amount": 50,
  "description": "Reporte generado"
}

Response:
{
  "success": true,
  "balance": 950,
  "unlimited": false
}

Error (Insufficient):
{
  "success": false,
  "error": "Créditos insuficientes",
  "balance": 30,
  "required": 50,
  "deficit": 20
}
```

---

## 🔑 Autenticación para Frontend

### Obtener Keys de Supabase

**Anon Key** (público, usar en frontend):
```typescript
const SUPABASE_ANON_KEY = "..." // Obtener de Dashboard → Settings → API
```

**Service Role Key** (privado, NUNCA en frontend):
```typescript
// Solo para backend/server-side code
const SUPABASE_SERVICE_KEY = "..." // Mantener en secreto
```

### Inicializar Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://shiqwhbodviimvpxpszd.supabase.co',
  SUPABASE_ANON_KEY
)
```

### Autenticación de Usuarios

#### 1. Login con Email/Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

if (data.user) {
  // Usuario autenticado
  const userId = data.user.id
  const token = data.session.access_token
}
```

#### 2. Login con OAuth (Google, Facebook, etc.)

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://reputaciononline.com/auth/callback'
  }
})
```

Proveedores disponibles:
- `google` (incluye YouTube)
- `facebook` (incluye Instagram)
- `twitter`
- `linkedin`

**Ver documentación completa**: `/supabase/OAUTH_CONFIG.md`

#### 3. Obtener Usuario Actual

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}
```

#### 4. Logout

```typescript
await supabase.auth.signOut()
```

---

## 📊 Acceso a Datos (Queries)

### Leer Datos del Usuario

```typescript
// Perfil del usuario
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

console.log('Plan:', user.plan)
console.log('Créditos:', user.credits)
```

### Estadísticas

```typescript
const { data: stats } = await supabase
  .from('user_stats')
  .select('*')
  .eq('user_id', userId)
  .single()

console.log('Total menciones:', stats.total_mentions)
console.log('Sentimiento:', stats.sentiment_score)
```

### Notificaciones

```typescript
const { data: notifications } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false })
  .limit(10)
```

### Actualizar Datos

```typescript
// Marcar notificación como leída
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('id', notificationId)
```

**Nota**: RLS está habilitado, los usuarios solo pueden ver/modificar sus propios datos.

---

## 🎨 Storage (Archivos)

### Upload Avatar

```typescript
const file = event.target.files[0]

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file, {
    upsert: true,
    contentType: 'image/jpeg'
  })

// URL pública
const avatarUrl = `https://shiqwhbodviimvpxpszd.supabase.co/storage/v1/object/public/avatars/${userId}/avatar.jpg`
```

### Download Report (Privado)

```typescript
// Generar signed URL
const { data: signedUrl } = await supabase.storage
  .from('reports')
  .createSignedUrl(`${userId}/report-123.pdf`, 3600) // 1 hora

// Abrir en nueva pestaña
window.open(signedUrl.signedUrl, '_blank')
```

---

## 💬 Chat con Amelia AI

### Iniciar Conversación

```typescript
const { data, error } = await supabase.functions.invoke('amelia-chat', {
  body: {
    user_id: userId,
    message: '¿Cómo está mi reputación online?'
  }
})

if (data.success) {
  console.log('Respuesta:', data.response)
  console.log('Conversation ID:', data.conversation_id)
}
```

### Continuar Conversación

```typescript
const { data } = await supabase.functions.invoke('amelia-chat', {
  body: {
    user_id: userId,
    conversation_id: existingConversationId,
    message: 'Dame más detalles'
  }
})
```

### Ver Historial de Conversación

```typescript
const { data: messages } = await supabase
  .from('amelia_messages')
  .select('*')
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true })
```

---

## 💳 Sistema de Créditos

### Consultar Balance

```typescript
const { data } = await supabase.functions.invoke('credit-manager', {
  body: {
    action: 'check',
    user_id: userId
  }
})

console.log('Balance:', data.balance)
console.log('Plan:', data.plan)
console.log('Ilimitado:', data.unlimited)
```

### Deducir Créditos (al generar reporte)

```typescript
const { data, error } = await supabase.functions.invoke('credit-manager', {
  body: {
    action: 'deduct',
    user_id: userId,
    amount: 50, // Costo de reporte básico
    description: 'Reporte básico generado'
  }
})

if (!data.success) {
  // Mostrar modal: "Créditos insuficientes"
  alert(`Te faltan ${data.deficit} créditos. ¿Deseas recargar?`)
}
```

### Ver Historial de Transacciones

```typescript
const { data: transactions } = await supabase
  .from('credit_transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20)
```

---

## 🔔 Notificaciones en Tiempo Real

### Suscribirse a Nuevas Notificaciones

```typescript
const channel = supabase
  .channel('notifications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Nueva notificación:', payload.new)
      // Mostrar toast/notification
      showToast(payload.new.title, payload.new.message)
    }
  )
  .subscribe()
```

### Suscribirse a Cambios de Créditos

```typescript
const channel = supabase
  .channel('user-credits')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`
    },
    (payload) => {
      // Actualizar balance en UI
      setCredits(payload.new.credits)
    }
  )
  .subscribe()
```

---

## 📋 Costos de Operaciones (Créditos)

Al llamar operaciones que consumen créditos, deducir antes de ejecutar:

| Operación                | Créditos | Función                   |
|--------------------------|----------|---------------------------|
| Reporte básico           | 50       | credit-manager (deduct)   |
| Reporte avanzado         | 200      | credit-manager (deduct)   |
| Análisis de competencia  | 100      | credit-manager (deduct)   |
| Análisis de sentimiento  | 20       | credit-manager (deduct)   |
| Query a Amelia AI        | 10       | credit-manager (deduct)   |
| Exportar PDF             | 25       | credit-manager (deduct)   |
| Exportar Excel           | 15       | credit-manager (deduct)   |

**Plan Político**: Créditos ilimitados, no deduce nada.

---

## 🔒 Seguridad y Mejores Prácticas

### ✅ Hacer

1. **Usar Anon Key** en el frontend
2. **Validar permisos** antes de operaciones sensibles
3. **Manejar errores** de autenticación gracefully
4. **Verificar balance** antes de operaciones costosas
5. **Usar RLS** para proteger datos (ya configurado)

### ❌ NO Hacer

1. **NO exponer Service Role Key** en frontend
2. **NO saltarse verificación de créditos**
3. **NO hacer queries sin filtro user_id** (RLS lo bloquea de todos modos)
4. **NO asumir que usuario está autenticado** (siempre verificar)
5. **NO hardcodear user IDs** en código

---

## 🎨 UI/UX Recomendaciones

### Componentes Críticos a Implementar

1. **Credit Balance Badge**
   - Mostrar en navbar/header
   - Color verde si > 500, amarillo si < 100, rojo si < 50
   - Click para ver historial de transacciones

2. **Amelia Chat Widget**
   - Botón flotante en esquina inferior derecha
   - Modal o sidebar para conversación
   - Indicador de "Amelia está escribiendo..."
   - Historial de conversaciones

3. **Notifications Center**
   - Campana con badge de notificaciones no leídas
   - Dropdown con últimas 5 notificaciones
   - Link a página completa de notificaciones

4. **OAuth Login Buttons**
   - Botones con logos oficiales de cada plataforma
   - Ver `/supabase/OAUTH_CONFIG.md` para colores de marca

5. **Credit Purchase Modal**
   - Mostrar cuando créditos < 50
   - Opciones de planes (Básico, Profesional, Empresarial, Político)
   - Integración con Wompi payment gateway

---

## 📁 Archivos de Referencia

Estos archivos contienen documentación detallada:

```
/supabase/
├── BACKEND_DEPLOYMENT.md       # Estado de Edge Functions
├── OAUTH_CONFIG.md              # Configuración OAuth completa
├── CRON_SETUP.sql               # Cron jobs configurados
├── DEPLOY_FUNCTIONS.md          # Instrucciones de deployment
└── functions/
    ├── auth-webhook/            # ✅ Desplegado
    ├── payment-webhook/         # 📝 Listo
    ├── amelia-chat/             # 📝 Listo
    ├── scraping-scheduler/      # 📝 Listo
    └── credit-manager/          # 📝 Listo

/BACKEND_ARCHITECT_REPORT.md     # Reporte completo del backend
/HANDOFF_TO_FRONTEND_BUILDER.md  # Este archivo
```

---

## 🚀 Próximos Pasos para Ti

### 1. Configurar Supabase Client

```bash
npm install @supabase/supabase-js
```

Crear `/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. Implementar Auth Flow

- Páginas de login/register
- OAuth buttons para Google, Facebook, LinkedIn, Twitter
- Protected routes con middleware
- User context provider

### 3. Construir Dashboard Principal

- Credit balance display
- Recent notifications
- Quick stats (menciones, sentimiento)
- Amelia chat widget

### 4. Implementar Amelia Chat

- Chat interface
- Message history
- Typing indicator
- Conversation list

### 5. Sistema de Créditos UI

- Balance badge en navbar
- Modal de créditos insuficientes
- Purchase flow con Wompi
- Historial de transacciones

---

## 🐛 Troubleshooting

### Error: "Invalid JWT"

**Causa**: Token expirado o inválido

**Solución**:
```typescript
supabase.auth.refreshSession()
```

### Error: "Row level security"

**Causa**: Intento de acceder a datos de otro usuario

**Solución**: Verificar que filtras por `user_id` correcto

### Error: "Function not found"

**Causa**: Edge Function aún no desplegada

**Solución**: Ver `/supabase/DEPLOY_FUNCTIONS.md` para desplegar

---

## 📞 Coordinación

### Para coordinar conmigo (Backend Architect):

**Necesitas**:
- Cambios en Edge Functions
- Nuevas políticas RLS
- Nuevas tablas/columnas
- Modificación de Storage

**Contáctame vía**: Este chat / Issue en repo

---

### Para coordinar con DevOps (Agent 4):

**Él necesitará**:
- Environment variables (.env.production)
- Deployment scripts
- Monitoring setup

**Después de ti**: Frontend deployment en Vercel/Netlify

---

## ✅ Checklist de Inicio

Antes de comenzar a codear, verifica:

- [ ] Supabase Project accesible
- [ ] Anon Key obtenida
- [ ] OAuth providers configurados (si necesitas login social)
- [ ] Edge Functions desplegadas (o usar mocks temporales)
- [ ] Documentación de API revisada
- [ ] Ejemplos de código probados

---

## 🎯 Entregable Esperado

Cuando completes tu parte, deberías entregar:

1. **Frontend completo** funcionando con Supabase
2. **Auth flow** con login/register y OAuth
3. **Dashboard** con datos reales del backend
4. **Amelia chat** integrada
5. **Sistema de créditos** funcionando
6. **Notificaciones** en tiempo real
7. **Documentación** de componentes

---

**¡Éxito con el frontend!** 🚀

Si tienes dudas sobre los endpoints, revisa:
- `/BACKEND_ARCHITECT_REPORT.md` para detalles completos
- `/supabase/BACKEND_DEPLOYMENT.md` para Edge Functions
- `/supabase/OAUTH_CONFIG.md` para autenticación

---

**Entregado por**: Backend Architect (Agente 2)
**Fecha**: 2025-10-25
**Estado**: ✅ BACKEND COMPLETO Y LISTO PARA INTEGRACIÓN
