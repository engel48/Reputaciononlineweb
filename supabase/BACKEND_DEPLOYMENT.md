# Backend Deployment Progress - Supabase Edge Functions

## Deployed Edge Functions

### ✅ 1. auth-webhook
- **Status**: DEPLOYED
- **Version**: 1
- **ID**: 055517f8-5205-4f68-b2c4-9dfffc2ed1fe
- **Location**: `/supabase/functions/auth-webhook/index.ts`
- **Purpose**: Maneja eventos de autenticación (registro, login, eliminación)
- **Features**:
  - Inicializa perfil de usuario automáticamente
  - Asigna 100 créditos de bienvenida
  - Crea `user_stats` con valores por defecto
  - Registra actividades de login
  - Gestiona transacciones de créditos

**Webhook URL**: `https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/auth-webhook`

---

### 📝 2. payment-webhook
- **Status**: CREATED (pending deployment)
- **Location**: `/supabase/functions/payment-webhook/index.ts`
- **Purpose**: Integración con Wompi (pagos Colombia)
- **Features**:
  - Verifica firma de Wompi para seguridad
  - Procesa pagos aprobados (APPROVED)
  - Asigna créditos según plan
  - Crea/actualiza suscripciones
  - Envía notificaciones de pago
  - Maneja pagos rechazados (DECLINED)

**Required ENV Variables**:
- `WOMPI_EVENT_SECRET`
- `WOMPI_PUBLIC_KEY`
- `WOMPI_PRIVATE_KEY`

**Webhook URL**: `https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/payment-webhook`

**Planes y Créditos**:
- Básico: 1,000 créditos - 50,000 COP
- Profesional: 5,000 créditos - 200,000 COP
- Empresarial: 20,000 créditos - 800,000 COP
- Político: Ilimitados - 1,500,000 COP

---

### 📝 3. amelia-chat
- **Status**: CREATED (pending deployment)
- **Location**: `/supabase/functions/amelia-chat/index.ts`
- **Purpose**: Interface con Gemini 1.5 Pro para Amelia AI
- **Features**:
  - Gestiona conversaciones con contexto
  - Integra con Gemini 1.5 Pro API
  - Mantiene personalidad de Amelia (experta en reputación colombiana)
  - Guarda historial de mensajes
  - Soporte para embeddings (pgvector - opcional)

**Required ENV Variables**:
- `GEMINI_API_KEY`

**Endpoint URL**: `https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/amelia-chat`

**Gemini Configuration**:
- Model: gemini-1.5-pro
- Temperature: 0.7
- Max tokens: 8,192
- Context: Últimos 10 mensajes

**System Prompt**: Amelia es experta en:
- Reputación digital en Colombia
- Política colombiana (congreso, alcaldías, gobernaciones)
- Monitoreo de medios (El Tiempo, Semana, RCN, Caracol)
- Crisis management
- Tendencias en redes sociales colombianas

---

### 📝 4. scraping-scheduler
- **Status**: CREATED (pending deployment)
- **Location**: `/supabase/functions/scraping-scheduler/index.ts`
- **Purpose**: Orquestador automático de scraping
- **Features**:
  - Ejecuta cada 15 minutos vía pg_cron
  - Crea jobs según plan del usuario
  - Prioriza por urgencia (Político > Empresarial > Profesional)
  - Evita duplicados
  - Limpia jobs antiguos (> 7 días)

**Endpoint URL**: `https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler`

**Configuración por Plan**:

| Plan          | Prioridad | Lookback | Frecuencia |
|---------------|-----------|----------|------------|
| Político      | 1         | 1 hora   | 5 min      |
| Empresarial   | 2         | 2 horas  | 15 min     |
| Profesional   | 3         | 4 horas  | 30 min     |
| Básico        | 4         | 24 horas | 60 min     |

**Plataformas Soportadas**:
- Facebook, Twitter/X, Instagram
- LinkedIn, YouTube, TikTok, Threads

**Cron Job**: Ver sección "Configuración pg_cron" abajo

---

### 📝 5. credit-manager
- **Status**: CREATED (pending deployment)
- **Location**: `/supabase/functions/credit-manager/index.ts`
- **Purpose**: Gestión centralizada de créditos
- **Features**:
  - Acción `check`: Consultar balance
  - Acción `deduct`: Deducir créditos
  - Acción `add`: Agregar créditos
  - Validación de balance insuficiente
  - Plan político = ilimitados
  - Notificaciones de créditos bajos (< 100)
  - Registro completo en `credit_transactions`

**Endpoint URL**: `https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/credit-manager`

**Costos de Operaciones**:
- Reporte básico: 50 créditos
- Reporte avanzado: 200 créditos
- Análisis de competencia: 100 créditos
- Análisis de sentimiento: 20 créditos
- Detección de crisis: 30 créditos
- Procesamiento de mención: 1 crédito
- Query a Amelia AI: 10 créditos
- Exportar PDF: 25 créditos
- Exportar Excel: 15 créditos

**Request Format**:
```json
{
  "action": "deduct|add|check",
  "user_id": "uuid",
  "amount": 100,
  "description": "Descripción de la operación"
}
```

**Response**:
```json
{
  "success": true,
  "user_id": "uuid",
  "balance": 900,
  "amount_deducted": 100
}
```

---

## Deployment Instructions

### Manual Deployment (MCP Tool)

Use the Supabase MCP tool to deploy each function:

```typescript
mcp__supabase__deploy_edge_function({
  name: "function-name",
  files: [{ name: "index.ts", content: "..." }]
})
```

### Environment Variables Required

Configure in Supabase Dashboard → Edge Functions → Settings:

```bash
# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Payment Provider (Wompi)
WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_EVENT_SECRET=your_webhook_secret

# Email Service (future)
RESENDER_API_KEY=re_xxxxx
```

### Configuración pg_cron para Scraping

Execute in Supabase SQL Editor:

```sql
-- Crear extension pg_cron si no existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Ejecutar scraping-scheduler cada 15 minutos
SELECT cron.schedule(
  'scraping-scheduler-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler',
        headers:=jsonb_build_object(
          'Content-Type','application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        )
    ) AS request_id;
  $$
);

-- Ver jobs programados
SELECT * FROM cron.job;

-- Ver historial de ejecución
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## Next Steps

### 1. Deploy Remaining Functions
- [ ] Deploy payment-webhook
- [ ] Deploy amelia-chat
- [ ] Deploy scraping-scheduler
- [ ] Deploy credit-manager

### 2. Configure Environment Variables
- [ ] Add GEMINI_API_KEY to Supabase
- [ ] Add WOMPI credentials to Supabase

### 3. Setup Database Hooks
- [ ] Configure auth webhook trigger
- [ ] Setup pg_cron for scraping

### 4. Create RLS Policies
- [ ] Users table policies
- [ ] Amelia conversations policies
- [ ] Mentions and analytics policies
- [ ] Payments and subscriptions policies

### 5. Configure Storage Buckets
- [ ] Create `avatars` bucket (public)
- [ ] Create `reports` bucket (private)
- [ ] Create `media` bucket (private)

### 6. Setup OAuth Providers
- [ ] Configure Google OAuth
- [ ] Configure Facebook OAuth
- [ ] Configure Twitter OAuth
- [ ] Configure LinkedIn OAuth

---

## Testing Edge Functions

### Test auth-webhook
```bash
curl -X POST https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/auth-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "users",
    "record": {
      "id": "test-user-id",
      "email": "test@example.com"
    }
  }'
```

### Test credit-manager
```bash
curl -X POST https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/credit-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "check",
    "user_id": "user-uuid"
  }'
```

### Test amelia-chat
```bash
curl -X POST https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/amelia-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "user_id": "user-uuid",
    "message": "Hola Amelia, ¿cómo está mi reputación online?"
  }'
```

---

## Function Dependencies

### Database Functions (from Database Architect - Agent 1)
These Edge Functions depend on SQL functions created by Agent 1:

- `add_user_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)`
- `deduct_user_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)`

Make sure these functions exist before deploying payment-webhook and credit-manager.

### Tables Required
All functions depend on tables created by Database Architect:

- `users`, `user_stats`, `activities`
- `amelia_conversations`, `amelia_messages`, `amelia_embeddings`
- `payments`, `subscriptions`, `credit_transactions`
- `scraping_jobs`, `mentions`, `sentiment_analysis`
- `notifications`, `alerts`, `reports`

---

## Monitoring and Logs

View function logs in Supabase Dashboard:
https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/logs/edge-functions

Or via CLI:
```bash
npx supabase functions logs auth-webhook --project-ref shiqwhbodviimvpxpszd
```

---

## Coordination with Other Agents

### Agent 1 (Database Architect)
- ✅ Provides SQL functions: `add_user_credits`, `deduct_user_credits`
- ✅ Creates all tables used by Edge Functions
- ✅ Sets up pgvector for Amelia embeddings

### Agent 3 (Frontend Builder)
- 📡 Will consume these Edge Function URLs
- 📡 Needs endpoint documentation
- 📡 Requires authentication headers

### Agent 4 (DevOps Orchestrator)
- 🔧 Needs environment variable list
- 🔧 Must configure secrets in Supabase Dashboard
- 🔧 Will setup monitoring and alerts

---

**Generated**: 2025-10-25
**Status**: Functions Created, Awaiting Deployment
**Next Action**: Deploy remaining 4 functions via MCP or CLI
