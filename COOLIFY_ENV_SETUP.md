# Configuración de Variables de Entorno en Coolify

## Variables de Entorno Requeridas

Debes configurar las siguientes variables de entorno en tu aplicación de Coolify:

### 1. DATABASE_URL (OBLIGATORIA)
```
DATABASE_URL=postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres
```

### 2. Variables de Autenticación
```
JWT_SECRET=reputacion-online-secret-key-2025
NEXTAUTH_SECRET=reputacion-online-super-secret-key-2025
```

### 3. Variable Opcional (para acceso externo)
```
EXTERNAL_DATABASE_URL=postgres://thor3:thor44@31.97.138.249:5437/postgres
```

## Cómo Configurar en Coolify

1. Ve al panel de tu aplicación en Coolify
2. Busca la sección de "Environment Variables" o "Variables de Entorno"
3. Agrega cada variable con su valor correspondiente
4. Guarda los cambios
5. Redeploy la aplicación

## Verificación

El sistema detecta automáticamente el entorno de Coolify, pero NECESITA que `DATABASE_URL` esté configurada correctamente.

Si ves este error:
```
Host: rkgwkkss048ck00skskc08gs
Contraseña: admin123
```

Significa que la DATABASE_URL no está configurada correctamente en Coolify.

## URLs de Base de Datos

**Para uso interno (dentro de Coolify):**
```
postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres
```

**Para uso externo (desde tu computadora local):**
```
postgres://thor3:thor44@31.97.138.249:5437/postgres
```

## Notas Importantes

- El host `rkgwkkss048ck00skskc08gs` es INCORRECTO
- El host correcto es `aswcsw80wsoskcskkscwscoo`
- La contraseña `admin123` es INCORRECTA
- La contraseña correcta es la larga de 64 caracteres mostrada arriba