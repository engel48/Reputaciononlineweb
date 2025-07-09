# 🗄️ Configuración SQLite Local

Este documento explica cómo usar SQLite como base de datos local temporal sin eliminar la configuración de PostgreSQL.

## 🚀 Cómo Activar SQLite Local

### 1. Editar `.env.local`

**LA LÍNEA `FORCE_SQLITE=true` YA ESTÁ ACTIVADA** en tu archivo `.env.local`:

```bash
# CONFIGURACIÓN TEMPORAL: Para usar SQLite local, descomenta la línea FORCE_SQLITE
# Para volver a PostgreSQL, simplemente comenta FORCE_SQLITE

# Forzar uso de SQLite (comentar para usar PostgreSQL)
FORCE_SQLITE=true

# IMPORTANTE: Cuando FORCE_SQLITE=true, el sistema ignorará DATABASE_URL y usará SQLite local
# Esto funciona tanto en desarrollo como en producción/Coolify

# Base de datos PostgreSQL en Coolify (VPS) - CREDENCIALES CORRECTAS
DATABASE_URL=postgres://postgres:ghxdiIxvNX8kjwafpuvS03B6e7M0ECSoZdEqPtLJsEW3WxBxn1f6USpp4vb42HIc@aswcsw80wsoskcskkscwscoo:5432/postgres

# Base de datos SQLite para desarrollo local (respaldo)
DATABASE_URL_LOCAL=file:./data/app.db
```

### 2. Iniciar el Servidor

```bash
npm run dev
```

### 3. Verificar que está usando SQLite

En los logs del servidor deberías ver:

```
🔄 ENV-LOADER: FORCE_SQLITE detectado - SALTANDO configuración de PostgreSQL
💡 ENV-LOADER: Sistema usará SQLite local en lugar de PostgreSQL
🔄 DATABASE ADAPTER: FORCE_SQLITE activado - usando SQLite local
💡 DATABASE ADAPTER: Para volver a PostgreSQL, comenta FORCE_SQLITE en .env.local
📋 DATABASE ADAPTER: Saltando configuración de PostgreSQL completamente
🧹 DATABASE ADAPTER: Limpiando DATABASE_URL para forzar SQLite
```

Y también:
```
🔍 ADMIN API: Configuración DB: {
  isProduction: true,
  hasPostgresUrl: undefined,
  usePostgres: undefined,
  databaseEngine: 'SQLite'
}
✅ ADMIN API: Usuarios obtenidos: 14
```

## 📋 Funcionalidades Disponibles

Con SQLite local puedes usar **TODAS** las funcionalidades del sistema:

### ✅ Autenticación
- ✅ Registro de usuarios
- ✅ Login/logout
- ✅ Cambio de contraseña
- ✅ Verificación de email

### ✅ Dashboard
- ✅ Analíticas en tiempo real
- ✅ Monitoreo de redes sociales
- ✅ Búsqueda de personas
- ✅ Chat con Sofia AI

### ✅ Redes Sociales
- ✅ Conexión de plataformas
- ✅ Análisis de sentimientos
- ✅ Métricas de engagement

### ✅ Administración
- ✅ Gestión de usuarios
- ✅ Configuración del sistema
- ✅ Créditos y planes

## 🔧 Gestión de Datos

### Base de Datos SQLite

La base de datos SQLite se encuentra en:
```
/data/app.db
```

### Tablas Disponibles

```sql
- users              # Usuarios del sistema
- social_media       # Conexiones de redes sociales
- user_stats         # Estadísticas de usuarios
- notifications      # Notificaciones
- alerts            # Alertas configuradas
- reports           # Reportes generados
- activities        # Actividades del sistema
- media_sources     # Fuentes de medios
- user_media_sources # Fuentes seleccionadas por usuario
- social_platforms  # Plataformas sociales disponibles
- system_settings   # Configuración del sistema
```

### Comandos Útiles

```bash
# Probar conexión SQLite
node test-sqlite-simple.js

# Inicializar base de datos desde cero
node scripts/init-database.js

# Migrar datos de PostgreSQL a SQLite (si es necesario)
node scripts/migrate-sqlite-to-postgres.js
```

## 🔄 Volver a PostgreSQL

Para volver a usar PostgreSQL:

### 1. Comentar FORCE_SQLITE

En `.env.local`:
```bash
# Forzar uso de SQLite (comentar para usar PostgreSQL)
# FORCE_SQLITE=true
```

### 2. Reiniciar el servidor

```bash
npm run dev
```

### 3. Verificar conexión

En los logs deberías ver:
```
🐘 DATABASE ADAPTER: Intentando conectar a PostgreSQL...
✅ DATABASE ADAPTER: PostgreSQL conectado exitosamente
```

## 📊 Estado Actual

- ✅ **SQLite configurado y funcionando**
- ✅ **14 usuarios existentes en la base de datos**
- ✅ **Todas las tablas creadas correctamente**
- ✅ **Fallback automático configurado**

## 🚨 Importante

- **No elimines nada**: Toda la configuración de PostgreSQL se mantiene intacta
- **Cambio temporal**: Puedes cambiar entre SQLite y PostgreSQL cuando quieras
- **Datos locales**: Los datos en SQLite son independientes de PostgreSQL
- **Desarrollo local**: Ideal para desarrollo y pruebas locales

## 🔧 Solución de Problemas

### Si no funciona SQLite:

1. **Verificar dependencias**:
   ```bash
   npm install
   ```

2. **Verificar archivo de BD**:
   ```bash
   ls -la data/app.db
   ```

3. **Reinicializar base de datos**:
   ```bash
   node scripts/init-database.js
   ```

4. **Probar conexión**:
   ```bash
   node test-sqlite-simple.js
   ```

## 📱 Próximos Pasos

1. **Usar el sistema normalmente** con SQLite
2. **Registrar nuevos usuarios** para probar
3. **Configurar redes sociales** 
4. **Probar todas las funcionalidades**
5. **Cuando esté listo, volver a PostgreSQL**

¡El sistema está listo para usar con SQLite local! 🎉