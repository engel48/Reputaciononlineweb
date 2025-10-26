# Configuración OAuth en Supabase Dashboard

**Proyecto**: Reputación Online
**Project ID**: shiqwhbodviimvpxpszd
**Dashboard URL**: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/auth/providers

---

## Instrucciones Generales

1. Ir al Supabase Dashboard → Authentication → Providers
2. Habilitar cada proveedor OAuth que se requiera
3. Copiar Client ID y Client Secret desde las credenciales de cada plataforma
4. Configurar las URLs de callback autorizadas

**URL de Callback de Supabase**:
```
https://shiqwhbodviimvpxpszd.supabase.co/auth/v1/callback
```

---

## 1. Google OAuth

### Configuración en Supabase Dashboard

**Proveedor**: Google
**Estado**: ✅ Habilitar

**Credenciales**:
- **Client ID**: [Copiar desde `.env.local` → `GOOGLE_CLIENT_ID`]
- **Client Secret**: [Copiar desde `.env.local` → `GOOGLE_CLIENT_SECRET`]

**Scopes** (se agregan automáticamente):
```
email
profile
openid
```

**Authorized redirect URIs** (configurar en Google Cloud Console):
```
https://shiqwhbodviimvpxpszd.supabase.co/auth/v1/callback
https://reputaciononline.com/auth/callback
http://localhost:3000/auth/callback
```

### Crear OAuth Client en Google Cloud Console

1. Ir a: https://console.cloud.google.com/apis/credentials
2. Crear proyecto "Reputación Online" (si no existe)
3. Habilitar Google+ API
4. Crear credenciales → OAuth 2.0 Client ID
5. Tipo de aplicación: **Web application**
6. Nombre: "Reputación Online - Supabase"
7. Agregar URIs de redirección autorizadas (ver arriba)
8. Copiar Client ID y Client Secret a Supabase

---

## 2. Facebook OAuth

### Configuración en Supabase Dashboard

**Proveedor**: Facebook
**Estado**: ✅ Habilitar

**Credenciales**:
- **App ID**: [Copiar desde `.env.local` → `FACEBOOK_CLIENT_ID`]
- **App Secret**: [Copiar desde `.env.local` → `FACEBOOK_CLIENT_SECRET`]

**Scopes** (se agregan automáticamente):
```
email
public_profile
```

**Valid OAuth Redirect URIs** (configurar en Facebook Developers):
```
https://shiqwhbodviimvpxpszd.supabase.co/auth/v1/callback
https://reputaciononline.com/auth/callback
http://localhost:3000/auth/callback
```

### Crear App en Facebook for Developers

1. Ir a: https://developers.facebook.com/apps/
2. Crear App → Tipo: **Consumer**
3. Nombre: "Reputación Online"
4. Agregar producto: **Facebook Login**
5. Configurar:
   - Client OAuth Login: **Sí**
   - Web OAuth Login: **Sí**
   - Enforce HTTPS: **Sí**
6. Agregar URIs de redirección válidos (ver arriba)
7. Copiar App ID y App Secret a Supabase

---

## 3. Twitter/X OAuth 2.0

### Configuración en Supabase Dashboard

**Proveedor**: Twitter
**Estado**: ✅ Habilitar

**Credenciales**:
- **Client ID**: [Copiar desde `.env.local` → `TWITTER_CLIENT_ID`]
- **Client Secret**: [Copiar desde `.env.local` → `TWITTER_CLIENT_SECRET`]

**Scopes** (se agregan automáticamente):
```
tweet.read
users.read
offline.access
```

**Callback URLs** (configurar en Twitter Developer Portal):
```
https://shiqwhbodviimvpxpszd.supabase.co/auth/v1/callback
https://reputaciononline.com/auth/callback
http://localhost:3000/auth/callback
```

### Crear App en Twitter Developer Portal

1. Ir a: https://developer.twitter.com/en/portal/projects-and-apps
2. Crear proyecto: "Reputación Online"
3. Crear App dentro del proyecto
4. Habilitar OAuth 2.0
5. Tipo de app: **Web App**
6. Configurar:
   - App permissions: **Read**
   - Type of App: **Web App, Automated App or Bot**
7. Agregar Callback URLs (ver arriba)
8. Copiar Client ID y Client Secret a Supabase

---

## 4. LinkedIn OAuth

### Configuración en Supabase Dashboard

**Proveedor**: LinkedIn (OIDC)
**Estado**: ✅ Habilitar

**Credenciales**:
- **Client ID**: [Copiar desde `.env.local` → `LINKEDIN_CLIENT_ID`]
- **Client Secret**: [Copiar desde `.env.local` → `LINKEDIN_CLIENT_SECRET`]

**Scopes** (se agregan automáticamente):
```
openid
profile
email
```

**Authorized redirect URLs** (configurar en LinkedIn Developers):
```
https://shiqwhbodviimvpxpszd.supabase.co/auth/v1/callback
https://reputaciononline.com/auth/callback
http://localhost:3000/auth/callback
```

### Crear App en LinkedIn Developers

1. Ir a: https://www.linkedin.com/developers/apps
2. Crear app:
   - App name: "Reputación Online"
   - LinkedIn Page: Asociar a página de empresa
3. Productos → Solicitar acceso a:
   - **Sign In with LinkedIn using OpenID Connect**
4. Auth → OAuth 2.0 settings:
   - Agregar redirect URLs (ver arriba)
5. Copiar Client ID y Client Secret a Supabase

---

## 5. Instagram OAuth

**Nota**: Instagram usa Facebook OAuth. No requiere configuración separada.

Para conectar Instagram:
1. El usuario debe tener cuenta de Instagram Business/Creator
2. La cuenta debe estar vinculada a una página de Facebook
3. Usar Facebook OAuth para autenticar
4. Acceder a Instagram Graph API con el token de Facebook

Scopes adicionales necesarios:
```
instagram_basic
instagram_content_publish
pages_read_engagement
pages_show_list
```

---

## 6. YouTube OAuth

**Nota**: YouTube usa Google OAuth. No requiere configuración separada en Supabase.

Para acceder a YouTube API:
1. Usar Google OAuth (configurado arriba)
2. Habilitar YouTube Data API v3 en Google Cloud Console
3. Agregar scopes adicionales si es necesario:

```
https://www.googleapis.com/auth/youtube.readonly
https://www.googleapis.com/auth/youtube.force-ssl
```

Configuración adicional en Google Cloud Console:
1. Ir a: https://console.cloud.google.com/apis/library
2. Buscar y habilitar: **YouTube Data API v3**
3. Los mismos credentials de Google OAuth funcionarán

---

## 7. TikTok OAuth

### Configuración Manual (No soportado nativamente por Supabase)

**Estado**: ⚠️ Requiere implementación custom

TikTok no está soportado nativamente por Supabase Auth. Se debe implementar OAuth manualmente usando Edge Functions.

**Endpoint de autorización**:
```
https://www.tiktok.com/v2/auth/authorize/
```

**Token endpoint**:
```
https://open.tiktokapis.com/v2/oauth/token/
```

**Scopes necesarios**:
```
user.info.basic
video.list
```

**Implementación**:
1. Registrar app en TikTok for Developers: https://developers.tiktok.com/
2. Crear Edge Function custom para manejar OAuth flow
3. Almacenar tokens manualmente en tabla `social_media`

---

## Configuración de URLs en Supabase

### Site URL
```
https://reputaciononline.com
```

### Redirect URLs (agregar todas)
```
https://reputaciononline.com/**
https://reputaciononline.com/auth/callback
http://localhost:3000/**
http://localhost:3000/auth/callback
```

**Configurar en**: Supabase Dashboard → Authentication → URL Configuration

---

## Email Templates (Personalización en Español)

### Confirm signup

**Asunto**:
```
Confirma tu cuenta en Reputación Online
```

**Cuerpo HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Confirma tu cuenta</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">¡Bienvenido a Reputación Online!</h1>
    <p>Gracias por registrarte. Para completar tu registro, por favor confirma tu dirección de correo electrónico.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Confirmar mi cuenta
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      Si no creaste esta cuenta, puedes ignorar este correo.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      © 2025 Reputación Online - Monitoreo de Reputación Digital en Colombia
    </p>
  </div>
</body>
</html>
```

### Reset Password

**Asunto**:
```
Restablecer tu contraseña - Reputación Online
```

**Cuerpo HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Restablecer contraseña</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Restablecer tu contraseña</h1>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
    <p>Haz clic en el botón de abajo para crear una nueva contraseña:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Restablecer contraseña
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.
    </p>
    <p style="font-size: 14px; color: #666;">
      Este enlace expirará en 1 hora por seguridad.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      © 2025 Reputación Online - Monitoreo de Reputación Digital en Colombia
    </p>
  </div>
</body>
</html>
```

### Magic Link

**Asunto**:
```
Tu enlace de acceso a Reputación Online
```

**Cuerpo HTML**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Enlace de acceso</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Tu enlace de acceso</h1>
    <p>Haz clic en el botón de abajo para iniciar sesión en tu cuenta:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ .ConfirmationURL }}"
         style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Iniciar sesión
      </a>
    </div>
    <p style="font-size: 14px; color: #666;">
      Este enlace es de un solo uso y expirará en 1 hora.
    </p>
    <p style="font-size: 14px; color: #666;">
      Si no solicitaste este enlace, puedes ignorar este correo.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="font-size: 12px; color: #999; text-align: center;">
      © 2025 Reputación Online - Monitoreo de Reputación Digital en Colombia
    </p>
  </div>
</body>
</html>
```

**Configurar en**: Supabase Dashboard → Authentication → Email Templates

---

## Configuración Avanzada de Auth

### Security Settings

**Configurar en**: Supabase Dashboard → Authentication → Settings

```yaml
JWT Expiry: 3600 (1 hora)
Refresh Token Expiry: 604800 (7 días)
Enable Secure Password: true
Minimum Password Length: 8
Require Email Confirmation: true
Enable Sign ups: true
Enable Manual Linking: true
```

### Rate Limiting

```yaml
Email Rate Limit: 4 emails per hour
SMS Rate Limit: N/A (no SMS configurado)
```

### Session Management

```yaml
Session Timeout: 7 days
Inactivity Timeout: 1 hour
Maximum Sessions per User: 10
```

---

## Verificación de Configuración

### Checklist

- [ ] Google OAuth configurado y funcionando
- [ ] Facebook OAuth configurado y funcionando
- [ ] Twitter OAuth configurado y funcionando
- [ ] LinkedIn OAuth configurado y funcionando
- [ ] Instagram OAuth (vía Facebook) accesible
- [ ] YouTube OAuth (vía Google) con API habilitada
- [ ] TikTok OAuth (custom implementation) pendiente
- [ ] Site URL configurado correctamente
- [ ] Redirect URLs agregados
- [ ] Email templates personalizados en español
- [ ] Rate limiting configurado
- [ ] Session management configurado

### Testing OAuth Flow

Para probar cada proveedor:

1. Abrir: `https://reputaciononline.com/login`
2. Hacer clic en botón del proveedor
3. Autorizar en la plataforma externa
4. Verificar redirección exitosa
5. Confirmar que el token se guardó en `social_media` table

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Verificar que las URLs de callback coincidan exactamente
- Asegurarse de que HTTPS esté habilitado en producción
- Revisar que no haya espacios o caracteres extra en las URLs

### Error: "Invalid client"
- Verificar que Client ID y Secret estén correctos
- Confirmar que la app esté en modo producción (no sandbox)
- Revisar que los scopes solicitados estén aprobados

### Error: "Token expired"
- Implementar refresh token logic en la aplicación
- Verificar que `token_expiry` esté actualizado en `social_media`
- Considerar implementar auto-refresh antes de expiración

---

**Última actualización**: 2025-10-25
**Responsable**: Backend Architect (Agente 2)
**Siguiente paso**: Coordinar con Frontend Builder para integración OAuth
