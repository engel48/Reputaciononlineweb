# 🚀 Guía de Deployment - Migración Completa a Supabase

Esta guía te llevará paso a paso desde la configuración inicial hasta tener tu aplicación completamente funcionando con Supabase.

---

## ✅ Pre-requisitos

Antes de empezar, asegúrate de tener:

- [x] Cuenta de Supabase creada
- [x] Proyecto de Supabase creado (`fxyfzktnwugdfwclevdz`)
- [x] Node.js >= 20.0.0 instalado
- [x] npm >= 9.0.0 instalado
- [x] Todos los archivos de migración en tu proyecto

---

## 📋 FASE 1: Configurar Credenciales de Supabase

### Paso 1.1: Obtener Database Password

1. Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/settings/database
2. En la sección "Connection String", busca "URI"
3. Si necesitas un nuevo password, click en "Reset Database Password"
4. Copia el password (se muestra solo una vez)

**Actualizar `.env.local` (línea 12):**
```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD_AQUI@db.fxyfzktnwugdfwclevdz.supabase.co:5432/postgres
```

### Paso 1.2: Obtener Service Role Key

1. Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/settings/api
2. En "Project API keys", busca `service_role` (secret)
3. Click en "Copy"

**Agregar a `.env.local`:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 1.3: Verificar Variables de Entorno

Tu `.env.local` debe tener:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://fxyfzktnwugdfwclevdz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:TU_PASSWORD@db.fxyfzktnwugdfwclevdz.supabase.co:5432/postgres

# AI Services
OPENAI_API_KEY=sk-... (opcional)
DEEPSEEK_API_KEY=sk-f2e5fc3f3e2e448ba0c757ea91c0f88c
```

✅ **Checkpoint:** Variables configuradas

---

## 📋 FASE 2: Ejecutar Migraciones SQL

### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/sql/new
2. Ejecuta cada migración en orden:

**Migración 1: Schema Inicial**
```bash
# Copiar contenido de:
supabase/migrations/20250101000000_initial_schema.sql
# Pegar en SQL Editor
# Click "Run"
```

**Migración 2: pgvector**
```bash
# Copiar contenido de:
supabase/migrations/20250101000001_enable_pgvector.sql
# Pegar en SQL Editor
# Click "Run"
```

**Migración 3: Row Level Security**
```bash
# Copiar contenido de:
supabase/migrations/20250101000002_row_level_security.sql
# Pegar en SQL Editor
# Click "Run"
```

### Opción B: Desde Terminal (Avanzado)

```bash
# 1. Instalar Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link al proyecto
supabase link --project-ref fxyfzktnwugdfwclevdz

# 4. Aplicar migraciones
supabase db push
```

### Verificar Migraciones

Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/editor

Deberías ver:
- [x] 13 tablas creadas
- [x] Extensión `vector` habilitada
- [x] Políticas RLS activas

✅ **Checkpoint:** Migraciones ejecutadas

---

## 📋 FASE 3: Configurar OAuth Providers

1. Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/auth/providers

2. Habilitar y configurar cada provider:

### Google
- [x] Habilitar
- Client ID: (de tu Google Cloud Console)
- Client Secret: (de tu Google Cloud Console)
- Redirect URL: `https://fxyfzktnwugdfwclevdz.supabase.co/auth/v1/callback`

### Facebook
- [x] Habilitar
- App ID: (de Facebook Developers)
- App Secret: (de Facebook Developers)
- Redirect URL: `https://fxyfzktnwugdfwclevdz.supabase.co/auth/v1/callback`

### Twitter
- [x] Habilitar
- API Key: (de Twitter Developer Portal)
- API Secret: (de Twitter Developer Portal)
- Redirect URL: `https://fxyfzktnwugdfwclevdz.supabase.co/auth/v1/callback`

### LinkedIn
- [x] Habilitar
- Client ID: (de LinkedIn Developers)
- Client Secret: (de LinkedIn Developers)
- Redirect URL: `https://fxyfzktnwugdfwclevdz.supabase.co/auth/v1/callback`

**Nota:** Si no tienes las credenciales OAuth, las plataformas seguirán funcionando con datos simulados.

✅ **Checkpoint:** OAuth configurado

---

## 📋 FASE 4: Crear Storage Buckets

1. Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/storage/buckets

2. Crear 3 buckets:

### Bucket: `avatars`
- [x] Click "New bucket"
- Name: `avatars`
- Public: ✅ Yes
- File size limit: 2MB
- Allowed MIME types: `image/png, image/jpeg, image/webp, image/gif`

### Bucket: `reports`
- [x] Click "New bucket"
- Name: `reports`
- Public: ❌ No
- File size limit: 10MB
- Allowed MIME types: `application/pdf`

### Bucket: `mentions-screenshots`
- [x] Click "New bucket"
- Name: `mentions-screenshots`
- Public: ❌ No
- File size limit: 5MB
- Allowed MIME types: `image/png, image/jpeg`

✅ **Checkpoint:** Storage configurado

---

## 📋 FASE 5: Migrar Datos de SQLite

### Paso 5.1: Verificar Conexión

```bash
# Test de conexión
node -e "console.log(process.env.DATABASE_URL)"
# Debe mostrar tu DATABASE_URL
```

### Paso 5.2: Ejecutar Migración

```bash
node scripts/migrate-to-supabase.js
```

**Output esperado:**
```
🚀 INICIANDO MIGRACIÓN SQLITE → SUPABASE
==========================================
📂 SQLite: /path/to/data/app.db
🔗 Supabase: https://fxyfzktnwugdfwclevdz.supabase.co

✅ Conexión a Supabase exitosa

📦 Migrando USERS...
   Encontrados: 15 usuarios
   ✅ 1/15 - user1@example.com
   ✅ 2/15 - user2@example.com
   ...
   ✅ 15/15 - user15@example.com

📦 Migrando SOCIAL_MEDIA...
   ✅ Migrados: X/Y

📦 Migrando USER_STATS...
   ✅ Migrados: X/Y

==========================================
📊 RESUMEN DE MIGRACIÓN
==========================================
✅ Usuarios:        15
✅ Social Media:    X
✅ User Stats:      X
✅ Notificaciones:  X
✅ Alertas:         X
✅ Reportes:        X

🎉 MIGRACIÓN COMPLETADA
```

### Paso 5.3: Verificar Datos

Ve a: https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz/editor

```sql
-- Verificar usuarios
SELECT COUNT(*) FROM users;
-- Debe retornar: 15

-- Verificar conexiones sociales
SELECT platform, COUNT(*) FROM social_media GROUP BY platform;
```

✅ **Checkpoint:** Datos migrados

---

## 📋 FASE 6: Activar Middleware de Supabase

### Paso 6.1: Reemplazar Middleware

```bash
# Backup del middleware anterior
mv src/middleware.ts src/middleware.old.ts

# Activar nuevo middleware
mv src/middleware.new.ts src/middleware.ts
```

### Paso 6.2: Verificar Rutas Protegidas

El nuevo middleware protege:
- `/dashboard/*` - Requiere autenticación
- `/admin/*` - Requiere role = 'admin'
- `/onboarding/*` - Requiere autenticación

✅ **Checkpoint:** Middleware actualizado

---

## 📋 FASE 7: Deployar Edge Functions (Opcional pero Recomendado)

### Paso 7.1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Paso 7.2: Login y Link

```bash
# Login
supabase login

# Link al proyecto
supabase link --project-ref fxyfzktnwugdfwclevdz
```

### Paso 7.3: Setear Secrets

```bash
# Secrets para Edge Functions
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set DEEPSEEK_API_KEY=sk-f2e5fc3f3e2e448ba0c757ea91c0f88c
```

### Paso 7.4: Deploy Functions

```bash
# Deploy todas las funciones
cd supabase/functions
supabase functions deploy julia-chat
supabase functions deploy sentiment-analysis
supabase functions deploy person-search
```

**Output esperado:**
```
Deploying julia-chat (version xxx)
✅ Deployed
Function URL: https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/julia-chat
```

### Paso 7.5: Test Function

```bash
curl -X POST \
  https://fxyfzktnwugdfwclevdz.supabase.co/functions/v1/julia-chat \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola Julia"}'
```

✅ **Checkpoint:** Edge Functions deployadas

---

## 📋 FASE 8: Testing Completo

### Test 1: Autenticación

```bash
# Iniciar app
npm run dev

# Ir a: http://localhost:3000/login
# Intentar login con usuario migrado
```

### Test 2: Dashboard

```bash
# Login exitoso → Redirige a /dashboard
# Verificar que carga datos del usuario
```

### Test 3: Realtime

```bash
# En dashboard, debería ver notificaciones en tiempo real
# Crear una notificación manual en Supabase Dashboard
# Debería aparecer automáticamente
```

### Test 4: Storage

```bash
# En dashboard, cambiar avatar
# Verificar que se sube a Supabase Storage
# URL debe ser: https://fxyfzktnwugdfwclevdz.supabase.co/storage/v1/object/public/avatars/...
```

### Test 5: Vector Search (Si tienes OpenAI API key)

```bash
# En consola del navegador:
const result = await fetch('/api/search-mentions', {
  method: 'POST',
  body: JSON.stringify({ query: 'política' })
})
```

✅ **Checkpoint:** Todo funcionando

---

## 📋 FASE 9: Deployment a Producción

### Opción 1: Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Setear env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DATABASE_URL
vercel env add DEEPSEEK_API_KEY
vercel env add OPENAI_API_KEY

# 5. Re-deploy
vercel --prod
```

### Opción 2: Railway

```bash
# 1. Ir a railway.app
# 2. New Project → Deploy from GitHub
# 3. Seleccionar tu repo
# 4. Agregar variables de entorno
# 5. Deploy
```

### Opción 3: Coolify

```bash
# 1. Conectar repo en Coolify
# 2. Agregar variables de entorno
# 3. Deploy
```

✅ **Checkpoint:** En producción

---

## 🎯 Checklist Final

### Configuración
- [ ] Variables de entorno en `.env.local`
- [ ] DATABASE_URL con password correcto
- [ ] SUPABASE_SERVICE_ROLE_KEY configurada

### Base de Datos
- [ ] 3 migraciones SQL ejecutadas
- [ ] 13 tablas creadas
- [ ] pgvector habilitado
- [ ] RLS políticas activas
- [ ] 15 usuarios migrados

### Auth
- [ ] OAuth providers configurados (mínimo 1)
- [ ] Email auth habilitado
- [ ] Middleware actualizado

### Storage
- [ ] Bucket `avatars` (público)
- [ ] Bucket `reports` (privado)
- [ ] Bucket `mentions-screenshots` (privado)

### Edge Functions
- [ ] julia-chat deployada
- [ ] sentiment-analysis deployada
- [ ] person-search deployada
- [ ] Secrets configurados

### Testing
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Realtime funciona
- [ ] Storage funciona
- [ ] Vector search funciona (opcional)

### Producción
- [ ] App deployada
- [ ] Variables de entorno en producción
- [ ] SSL/HTTPS configurado
- [ ] Dominio apuntado (opcional)

---

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
**Solución:**
1. Verificar DATABASE_URL en `.env.local`
2. Verificar que el password es correcto
3. Ir a Settings → Database → Reset password

### Error: "User not found" después de migración
**Solución:**
1. Verificar que el script de migración se ejecutó
2. Ir a Auth → Users en Supabase Dashboard
3. Verificar que los usuarios existen

### Error: "CORS error" en Edge Functions
**Solución:**
1. Verificar que las funciones están deployadas
2. Verificar corsHeaders en las funciones
3. Ver logs: `supabase functions logs`

### Error: "RLS policy violation"
**Solución:**
1. Verificar que las políticas RLS están activas
2. Verificar que el usuario está autenticado
3. Usar service_role key temporalmente para debug

---

## 📚 Recursos

- **Supabase Dashboard:** https://supabase.com/dashboard/project/fxyfzktnwugdfwclevdz
- **Documentación Supabase:** https://supabase.com/docs
- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Edge Functions Docs:** https://supabase.com/docs/guides/functions

---

## 🎉 ¡Felicidades!

Si llegaste aquí y todos los checkpoints están completos, **tu migración a Supabase está completada**.

Ahora tienes:
- ✅ Base de datos PostgreSQL escalable
- ✅ Auth con OAuth en 7 plataformas
- ✅ Realtime sin polling
- ✅ Storage profesional
- ✅ Edge Functions para IA sin timeouts
- ✅ Búsqueda semántica con pgvector
- ✅ Row Level Security automática

**Tu aplicación está lista para escalar a millones de usuarios.** 🚀
