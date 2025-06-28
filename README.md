# Reputación Online v7

Sistema de monitoreo de reputación online con base de datos SQLite local.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configuración mínima
El proyecto funciona con configuración mínima. Solo necesitas el archivo `.env.local`:

```bash
# JWT Secret (OBLIGATORIO)
JWT_SECRET=reputacion-online-secret-key-2025
```

### 3. Ejecutar el proyecto
```bash
npm run dev
```

## 📦 Características

### ✅ Funcionalidades Implementadas
- ✅ **Autenticación completa** (Login/Registro)
- ✅ **Base de datos SQLite local** (sin configuración)
- ✅ **Dashboard interactivo** con métricas en tiempo real
- ✅ **Onboarding completo** (4 pasos)
- ✅ **Sistema de créditos**
- ✅ **Interfaz responsive**
- ✅ **Animaciones con IA (Sofia)**
- ✅ **Gestión de perfiles**
- ✅ **Notificaciones**

### 🔧 Base de Datos
- **Tipo**: SQLite local
- **Ubicación**: `/data/app.db` (se crea automáticamente)
- **Sin configuración**: No necesita Docker, PostgreSQL, ni configuración externa

### 🎨 Interfaz
- Dashboard moderno con métricas
- Animaciones fluidas con GSAP y Framer Motion
- Tema oscuro/claro
- Responsive design con Tailwind CSS

## 📝 Scripts Disponibles

```bash
npm run dev      # Ejecutar en desarrollo
npm run build    # Construir para producción
npm run start    # Ejecutar en producción
npm run clean    # Limpiar archivos temporales
npm run reset    # Limpiar y reiniciar
```

## 🗂️ Estructura del Proyecto

```
src/
├── app/                 # Rutas y páginas (App Router)
├── components/          # Componentes React
├── context/            # Contextos de React
├── lib/                # Utilidades y configuración
│   └── database.ts     # Base de datos SQLite
├── services/           # Servicios de datos
└── styles/             # Estilos globales

data/
└── app.db              # Base de datos SQLite (auto-generada)
```

## 🔐 Autenticación

- Sistema JWT con cookies seguras
- Registro y login con validaciones
- Protección de rutas con middleware
- Sesiones persistentes

## 📊 Dashboard

- Métricas de reputación en tiempo real
- Menciones por plataforma
- Análisis de sentimientos
- Mapas interactivos
- Sistema de créditos integrado

## 🎯 Onboarding

1. **Datos básicos**: Nombre, empresa, contacto
2. **Categoría**: Personal, político, empresa
3. **Redes sociales**: Conexiones opcionales
4. **Foto de perfil**: Upload de imagen

## 📱 Responsive

- ✅ Mobile First
- ✅ Tablet optimizado
- ✅ Desktop completo
- ✅ Navegación adaptativa

## 🚀 Despliegue

### Vercel (Recomendado)
```bash
# Conectar con Vercel
vercel

# O hacer deploy directo
vercel --prod
```

### VPS/Servidor
```bash
# Construir
npm run build

# Ejecutar
npm start
```

## 🔧 Variables de Entorno

### Obligatorias
```bash
JWT_SECRET=tu-clave-jwt-aqui
```

### Opcionales (solo para funcionalidades avanzadas)
```bash
# OpenAI (para ChatSofia con IA real)
OPENAI_API_KEY=tu-clave-openai

# OAuth redes sociales (para conexiones reales)
GOOGLE_CLIENT_ID=tu-google-id
FACEBOOK_CLIENT_ID=tu-facebook-id
TWITTER_CLIENT_ID=tu-twitter-id
LINKEDIN_CLIENT_ID=tu-linkedin-id
```

## 📈 Rendimiento

- ⚡ SQLite = Sin latencia de red
- ⚡ Componentes optimizados
- ⚡ Lazy loading implementado
- ⚡ Animaciones de 60fps

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS, Framer Motion, GSAP
- **Base de datos**: SQLite + better-sqlite3
- **Autenticación**: JWT + bcryptjs
- **UI**: Radix UI, Lucide Icons

## 📄 Licencia

ISC License