# 🔧 YouTube Listening - Configuración Requerida

## ⚠️ IMPORTANTE: Credenciales que Debes Crear

Para que el sistema de YouTube funcione, necesitas configurar **3 servicios externos**:

---

## 1. 🎬 Google Cloud Console (YouTube Data API)

### Paso 1: Crear Proyecto en Google Cloud

1. **Ir a:** https://console.cloud.google.com/
2. **Crear nuevo proyecto:**
   - Nombre: "Reputacion Online YouTube"
   - Organización: (opcional)
   - Clic en "CREAR"

### Paso 2: Habilitar YouTube Data API v3

1. **Ir a:** https://console.cloud.google.com/apis/library
2. **Buscar:** "YouTube Data API v3"
3. **Clic en:** "YouTube Data API v3"
4. **Clic en:** "HABILITAR"

### Paso 3: Crear Credenciales OAuth 2.0

1. **Ir a:** https://console.cloud.google.com/apis/credentials
2. **Clic en:** "CREAR CREDENCIALES" → "ID de cliente de OAuth"
3. **Configurar pantalla de consentimiento:**
   - Tipo: Externo
   - Nombre de la aplicación: "Reputación Online"
   - Correo de asistencia: tu-email@gmail.com
   - Dominio de la aplicación: https://tu-dominio.com
   - Correo del desarrollador: tu-email@gmail.com
   - **Scopes necesarios:**
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
   - Guardar y continuar

4. **Crear credenciales OAuth:**
   - Tipo de aplicación: "Aplicación web"
   - Nombre: "Reputación Online - YouTube"
   - **URIs de redireccionamiento autorizados:**
     ```
     http://localhost:3000/api/auth/callback/google
     https://tu-dominio.com/api/auth/callback/google
     ```
   - Clic en "CREAR"

5. **Copiar credenciales:**
   ```
   GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
   ```

### Paso 4: Verificar Cuotas

1. **Ir a:** https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
2. **Cuota gratuita:** 10,000 unidades/día
3. **Consumo por operación:**
   - Leer canal: 1 unidad
   - Leer video: 1 unidad
   - Leer comentarios: 1 unidad
   - **Sincronización típica (20 videos + 1000 comentarios):** ~1,021 unidades

4. **Si necesitas más cuota:**
   - Clic en "SOLICITAR AUMENTO DE CUOTA"
   - Justificación: "Sistema de análisis de reputación online"
   - Cuota solicitada: 50,000 unidades/día
   - Esperar aprobación (1-3 días)

---

## 2. 🤖 Google AI Studio (Gemini API)

### Paso 1: Obtener API Key de Gemini

1. **Ir a:** https://aistudio.google.com/app/apikey
2. **Iniciar sesión** con tu cuenta de Google
3. **Clic en:** "Get API Key" o "Create API Key"
4. **Seleccionar proyecto:**
   - Usar el mismo proyecto de Google Cloud creado antes
   - O crear uno nuevo
5. **Copiar API Key:**
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

### Paso 2: Verificar Límites Gratuitos

- **Modelo:** gemini-1.5-flash (recomendado para producción)
- **Cuota gratuita:**
  - 15 requests/minuto
  - 1 millón tokens/minuto
  - 1,500 requests/día
- **Límites de producción:**
  - Si necesitas más, considera upgrade a plan de pago

### Paso 3: Alternativa - DeepSeek (Opcional)

Si no tienes Gemini, el sistema puede usar DeepSeek como fallback:

1. **Ir a:** https://platform.deepseek.com/
2. **Crear cuenta** y obtener API key
3. **Agregar a .env.local:**
   ```
   DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx
   ```

---

## 3. 🔐 Configurar Variables de Entorno

### Archivo: `.env.local`

Crear o actualizar el archivo `.env.local` en la raíz del proyecto:

```bash
# ========================================
# YOUTUBE DATA API (Google Cloud Console)
# ========================================
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# ========================================
# GEMINI AI (Google AI Studio)
# ========================================
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Alternativa si no tienes Gemini (opcional)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxx

# ========================================
# WORKER AUTHENTICATION
# ========================================
# Puedes usar este mismo o generar uno nuevo con:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WORKER_SECRET=youtube-worker-secret-key-2025

# ========================================
# NEXTAUTH & JWT (Ya configurados)
# ========================================
JWT_SECRET=reputacion-online-secret-key-2025
NEXTAUTH_SECRET=tu-nextauth-secret-existente
NEXTAUTH_URL=http://localhost:3000

# Para producción:
# NEXTAUTH_URL=https://tu-dominio.com

# ========================================
# SUPABASE (Ya configurados)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://jvplyvvsuzbcqxutzhvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-key
```

---

## 4. ⚙️ Configurar Supabase (Ya Hecho ✅)

### Variables de Configuración en Supabase

El cron job necesita acceder a la URL de tu aplicación. Configura en Supabase:

1. **Ir a:** https://supabase.com/dashboard/project/jvplyvvsuzbcqxutzhvp/settings/vault
2. **Agregar secretos:**

```sql
-- Ejecutar en SQL Editor de Supabase
ALTER DATABASE postgres SET app.settings.nextauth_url = 'http://localhost:3000';
-- Para producción:
-- ALTER DATABASE postgres SET app.settings.nextauth_url = 'https://tu-dominio.com';

ALTER DATABASE postgres SET app.settings.worker_secret = 'youtube-worker-secret-key-2025';
```

O usar la interfaz de Vault:
- **Secret Name:** `app.settings.nextauth_url`
- **Secret Value:** `http://localhost:3000`

---

## 5. 🧪 Verificar Configuración

### Test 1: Verificar Google OAuth

```bash
# Iniciar servidor
npm run dev

# Abrir en navegador
http://localhost:3000/api/auth/signin/google?callbackUrl=/dashboard&scope=https://www.googleapis.com/auth/youtube.readonly
```

**Debe:**
- Redirigir a Google Login
- Mostrar pantalla de consentimiento
- Pedir permisos de YouTube
- Redirigir de vuelta al dashboard

### Test 2: Verificar Gemini AI

```bash
# Crear archivo de prueba: test-gemini.js
cat > test-gemini.js << 'EOF'
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Analiza el sentimiento de: "Me encanta este video"');
    const response = await result.response;
    console.log('✅ Gemini funciona correctamente');
    console.log('Respuesta:', response.text());
  } catch (error) {
    console.error('❌ Error con Gemini:', error.message);
  }
}

testGemini();
EOF

# Ejecutar test
node test-gemini.js
```

### Test 3: Verificar Worker

```bash
# Llamar manualmente al worker
curl -X GET http://localhost:3000/api/youtube/worker \
  -H "Authorization: Bearer youtube-worker-secret-key-2025"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "No hay jobs pendientes",
  "processed": 0
}
```

---

## 6. 📋 Checklist de Configuración

Marca cada item cuando esté completado:

### Google Cloud Console
- [ ] Proyecto creado en Google Cloud
- [ ] YouTube Data API v3 habilitada
- [ ] Credenciales OAuth 2.0 creadas
- [ ] URIs de redirección configurados
- [ ] Scopes de YouTube agregados
- [ ] `GOOGLE_CLIENT_ID` copiado a `.env.local`
- [ ] `GOOGLE_CLIENT_SECRET` copiado a `.env.local`

### Google AI Studio (Gemini)
- [ ] API Key de Gemini obtenida
- [ ] `GEMINI_API_KEY` copiado a `.env.local`
- [ ] (Opcional) DeepSeek API configurada como fallback

### Variables de Entorno
- [ ] Archivo `.env.local` actualizado
- [ ] `WORKER_SECRET` configurado
- [ ] Variables de Supabase presentes
- [ ] `NEXTAUTH_URL` apunta a URL correcta

### Supabase
- [ ] Secretos configurados en Vault (opcional)
- [ ] pg_cron activo (✅ ya configurado)
- [ ] Cron job funcionando (✅ ya configurado)

### Tests
- [ ] OAuth de Google funciona
- [ ] Gemini AI responde correctamente
- [ ] Worker responde al llamado manual
- [ ] Sincronización de prueba exitosa

---

## 7. 💰 Costos Estimados

### Cuota Gratuita (Suficiente para empezar)

**YouTube Data API:**
- 10,000 unidades/día GRATIS
- ~10 sincronizaciones completas/día
- Para 100+ sincronizaciones/día → solicitar aumento de cuota (gratis)

**Gemini API:**
- 1,500 requests/día GRATIS
- Suficiente para ~1,500 comentarios analizados/día
- Para producción → $0.00025 por 1K caracteres (muy económico)

**Total para empezar:** $0 USD/mes

### Producción Escalada

**YouTube Data API:**
- Cuotas altas disponibles sin costo
- Simplemente solicitar aumento

**Gemini API (si excedes cuota gratuita):**
- ~$0.10 por 1,000 comentarios analizados
- Ejemplo: 100,000 comentarios/mes = ~$10 USD

---

## 8. 🚨 Solución de Problemas

### Error: "Invalid OAuth credentials"
**Solución:**
1. Verificar que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` sean correctos
2. Verificar que los URIs de redirección coincidan exactamente
3. Verificar que YouTube Data API esté habilitada

### Error: "API quota exceeded"
**Solución:**
1. Verificar consumo en: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
2. Solicitar aumento de cuota
3. Reducir `maxVideos` y `maxCommentsPerVideo` temporalmente

### Error: "Gemini API error"
**Solución:**
1. Verificar que `GEMINI_API_KEY` sea válida
2. Verificar límites en: https://aistudio.google.com/app/apikey
3. El sistema automáticamente usará fallback de keywords

### Error: "Worker not executing"
**Solución:**
1. Verificar que pg_cron esté activo:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'youtube-worker-hourly';
   ```
2. Verificar logs:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobname = 'youtube-worker-hourly'
   ORDER BY start_time DESC LIMIT 5;
   ```
3. Verificar que `NEXTAUTH_URL` esté accesible desde Supabase

---

## 9. 📞 Recursos Útiles

### Documentación Oficial
- YouTube Data API: https://developers.google.com/youtube/v3
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- Gemini API: https://ai.google.dev/docs
- Supabase pg_cron: https://supabase.com/docs/guides/database/extensions/pgcron

### Consolas de Administración
- Google Cloud Console: https://console.cloud.google.com/
- Google AI Studio: https://aistudio.google.com/
- Supabase Dashboard: https://supabase.com/dashboard

### Monitoreo de Uso
- YouTube API Quotas: https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
- Gemini API Usage: https://aistudio.google.com/app/apikey

---

## ✅ Siguiente Paso

Una vez completado el checklist, ejecuta tu primera sincronización:

```bash
# 1. Conectar YouTube
# Ir a: http://localhost:3000/dashboard → Conectar YouTube

# 2. Sincronizar
curl -X POST http://localhost:3000/api/youtube/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=TU_TOKEN" \
  -d '{"maxVideos": 5, "maxCommentsPerVideo": 10}'

# 3. Ver dashboard
curl http://localhost:3000/api/youtube/dashboard \
  -H "Cookie: auth-token=TU_TOKEN"
```

**¡Sistema listo para producción! 🚀**
