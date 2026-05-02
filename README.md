# Reputación Online

Plataforma SaaS para monitoreo y gestión de reputación digital orientada al mercado colombiano. Permite a marcas, empresas y figuras políticas analizar su presencia online en redes sociales y medios de comunicación, detectar crisis a tiempo y responder con estrategia.

## Funcionalidades de la plataforma

### Monitoreo de redes sociales
Conexión OAuth con Facebook, X (Twitter), Instagram, YouTube y TikTok. Sincronización automática cada 30 minutos para extraer publicaciones, métricas, comentarios y menciones. Soporte multi-cuenta de la misma red para el plan Enterprise (hasta 8 cuentas conectadas).

### Monitoreo de medios colombianos
Scraping en vivo de los principales medios digitales del país (El Tiempo, El Espectador, Semana, La FM, Caracol, RCN, entre otros). Detección de menciones por palabras clave configurables, con histórico de noticias para análisis de tendencias.

### Análisis de sentimiento con IA
Procesamiento automático de menciones con clasificación positiva, negativa o neutra. Asistente virtual "Julia" con memoria persistente entre sesiones, capaz de mantener conversaciones contextuales, dar recomendaciones estratégicas y analizar situaciones de crisis para el usuario.

### Dashboard y reportes
Métricas en tiempo real: alcance, engagement, score de reputación, evolución de menciones, distribución por plataforma. Reportes ejecutivos con datos agregados de los últimos 7, 30 o 90 días.

### Detección de crisis reputacional
Alertas automáticas ante picos de menciones negativas, trending topics hostiles o cobertura mediática crítica. El sistema sugiere protocolos de respuesta según severidad.

### Búsqueda de personas
Análisis reputacional de cualquier figura pública con histórico de menciones, sentimiento agregado y presencia en medios colombianos.

### Sistema de planes y créditos
Cuatro planes (Free, Basic, Pro, Enterprise) con límites diferenciados de cuentas conectadas, créditos mensuales y funcionalidades. Renovación automática mensual de créditos y compra de paquetes adicionales mediante pasarela Wompi.

### Panel administrativo
Gestión de usuarios, asignación masiva de créditos, supervisión de pagos, configuración del sistema y consulta de transacciones. Acceso restringido por rol.

## Stack técnico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Estilos**: Tailwind CSS, Radix UI, Framer Motion, GSAP
- **Base de datos**: Supabase (PostgreSQL con Row-Level Security)
- **Autenticación**: NextAuth.js y JWT con cookies HTTP-only
- **Inteligencia artificial**: Groq (Llama 3.3 70B), con DeepSeek y OpenAI como respaldo
- **Pagos**: Wompi Colombia con validación HMAC en webhook
- **Tareas programadas**: pg_cron y Edge Functions de Supabase
- **Despliegue**: Coolify

## Instalación

### Requisitos previos
- Node.js 20 o superior
- npm 9 o superior
- Proyecto de Supabase configurado con las migraciones aplicadas

### Pasos

```bash
npm install
cp .env.example .env.local
# Editar .env.local con las credenciales requeridas
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

### Variables de entorno principales

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `JWT_SECRET` | Clave para firmar tokens de sesión |
| `NEXTAUTH_SECRET` | Secret usado por NextAuth.js |
| `NEXTAUTH_URL` | URL pública del despliegue |
| `GROQ_API_KEY` | API key para el asistente Julia |
| `WOMPI_PUBLIC_KEY` | Llave pública de Wompi |
| `WOMPI_PRIVATE_KEY` | Llave privada de Wompi |
| `WOMPI_EVENTS_SECRET` | Secret para validar webhooks de Wompi |

Las credenciales OAuth de cada red social (Facebook, X, Instagram, YouTube, TikTok) se configuran de forma opcional según las plataformas que se quieran habilitar.

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Compilación para producción
npm run start     # Servidor de producción
npm run lint      # Linter de Next.js
```

## Estructura del proyecto

```
src/
  app/
    admin/          Panel administrativo
    dashboard/      Panel del usuario final
    api/            Endpoints REST
  components/       Componentes de UI
  context/          Contextos globales (User, Plan, Credits)
  lib/              Servicios, utilidades e integraciones
supabase/
  migrations/       Migraciones SQL versionadas
  functions/        Edge Functions en Deno
```

## Licencia

ISC License
