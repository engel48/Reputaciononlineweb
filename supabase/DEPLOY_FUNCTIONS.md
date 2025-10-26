# Manual de Deployment de Edge Functions

**Proyecto**: Reputación Online
**Backend Architect**: Agent 2
**Fecha**: 2025-10-25

---

## Estado Actual

| Función              | Estado      | ID                                   |
|----------------------|-------------|--------------------------------------|
| auth-webhook         | ✅ DEPLOYED | 055517f8-5205-4f68-b2c4-9dfffc2ed1fe |
| payment-webhook      | 📝 CREATED  | Pendiente                            |
| amelia-chat          | 📝 CREATED  | Pendiente                            |
| scraping-scheduler   | 📝 CREATED  | Pendiente                            |
| credit-manager       | 📝 CREATED  | Pendiente                            |

---

## Método 1: Deployment via MCP Tool (Recomendado)

### payment-webhook

```typescript
mcp__supabase__deploy_edge_function({
  name: "payment-webhook",
  files: [{
    name: "index.ts",
    content: `[CONTENT FROM /supabase/functions/payment-webhook/index.ts]`
  }]
})
```

### amelia-chat

```typescript
mcp__supabase__deploy_edge_function({
  name: "amelia-chat",
  files: [{
    name: "index.ts",
    content: `[CONTENT FROM /supabase/functions/amelia-chat/index.ts]`
  }]
})
```

### scraping-scheduler

```typescript
mcp__supabase__deploy_edge_function({
  name: "scraping-scheduler",
  files: [{
    name: "index.ts",
    content: `[CONTENT FROM /supabase/functions/scraping-scheduler/index.ts]`
  }]
})
```

### credit-manager

```typescript
mcp__supabase__deploy_edge_function({
  name: "credit-manager",
  files: [{
    name: "index.ts",
    content: `[CONTENT FROM /supabase/functions/credit-manager/index.ts]`
  }]
})
```

---

## Método 2: Deployment via Supabase CLI

### Pre-requisitos

```bash
# Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# Login a Supabase
supabase login

# Vincular proyecto
supabase link --project-ref shiqwhbodviimvpxpszd
```

### Deploy Individual

```bash
# Deploy payment-webhook
supabase functions deploy payment-webhook --project-ref shiqwhbodviimvpxpszd

# Deploy amelia-chat
supabase functions deploy amelia-chat --project-ref shiqwhbodviimvpxpszd

# Deploy scraping-scheduler
supabase functions deploy scraping-scheduler --project-ref shiqwhbodviimvpxpszd

# Deploy credit-manager
supabase functions deploy credit-manager --project-ref shiqwhbodviimvpxpszd
```

### Deploy All at Once

```bash
supabase functions deploy --project-ref shiqwhbodviimvpxpszd
```

---

## Método 3: Deployment via Supabase Dashboard

### Pasos para cada función:

1. Ir a: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/functions

2. Click en "New Function"

3. Configurar:
   - **Name**: payment-webhook (o nombre correspondiente)
   - **Import from file**: Subir archivo `index.ts`
   - **Verify JWT**: ✅ Habilitado (para seguridad)

4. Click "Deploy Function"

5. Repetir para cada función restante

---

## Configurar Variables de Entorno

Después de desplegar las funciones, configurar secrets:

### Via Supabase Dashboard

1. Ir a: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/functions

2. Click en "Edge Functions" → "Settings" → "Secrets"

3. Agregar:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
WOMPI_PUBLIC_KEY=pub_test_or_prod_xxxxx
WOMPI_PRIVATE_KEY=prv_test_or_prod_xxxxx
WOMPI_EVENT_SECRET=your_webhook_verification_secret
```

### Via CLI

```bash
# Set individual secrets
supabase secrets set GEMINI_API_KEY=your_key --project-ref shiqwhbodviimvpxpszd
supabase secrets set WOMPI_PUBLIC_KEY=pub_xxxxx --project-ref shiqwhbodviimvpxpszd
supabase secrets set WOMPI_PRIVATE_KEY=prv_xxxxx --project-ref shiqwhbodviimvpxpszd
supabase secrets set WOMPI_EVENT_SECRET=secret_xxxxx --project-ref shiqwhbodviimvpxpszd

# Set all from .env file
supabase secrets set --env-file .env.production --project-ref shiqwhbodviimvpxpszd
```

---

## Testing Deployments

### Test payment-webhook

```bash
curl -X POST \
  https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/payment-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{
    "event": "transaction.updated",
    "data": {
      "transaction": {
        "id": "test-123",
        "amount_in_cents": 5000000,
        "reference": "user_test-user-id_plan_basico",
        "customer_email": "test@example.com",
        "currency": "COP",
        "status": "APPROVED",
        "payment_method_type": "CARD",
        "created_at": "2025-01-15T10:00:00Z"
      }
    },
    "signature": {
      "properties": [],
      "checksum": "test"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "payment_id": "uuid",
  "credits_added": 1000
}
```

---

### Test amelia-chat

```bash
curl -X POST \
  https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/amelia-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{
    "user_id": "test-user-uuid",
    "message": "Hola Amelia, ¿cómo está mi reputación online?"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "conversation_id": "uuid",
  "response": "¡Hola! Como experta en reputación digital...",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

### Test scraping-scheduler

```bash
curl -X POST \
  https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{
    "trigger": "manual"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "summary": {
    "timestamp": "2025-01-15T10:00:00Z",
    "users_processed": 5,
    "jobs_created": 15,
    "jobs_skipped": 2,
    "platform_breakdown": {
      "facebook": 5,
      "twitter": 5,
      "instagram": 5
    }
  }
}
```

---

### Test credit-manager

```bash
# Check credits
curl -X POST \
  https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/credit-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{
    "action": "check",
    "user_id": "test-user-uuid"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "user_id": "test-user-uuid",
  "balance": 1000,
  "plan": "basico",
  "unlimited": false
}
```

```bash
# Deduct credits
curl -X POST \
  https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/credit-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{
    "action": "deduct",
    "user_id": "test-user-uuid",
    "amount": 50,
    "description": "Reporte básico generado"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "user_id": "test-user-uuid",
  "amount_deducted": 50,
  "balance": 950,
  "description": "Reporte básico generado"
}
```

---

## Verificar Logs

### Via Dashboard

1. Ir a: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/logs/edge-functions

2. Seleccionar función específica

3. Ver logs en tiempo real

### Via CLI

```bash
# Ver logs de función específica
supabase functions logs payment-webhook --project-ref shiqwhbodviimvpxpszd

# Ver logs en tiempo real (follow)
supabase functions logs payment-webhook --follow --project-ref shiqwhbodviimvpxpszd
```

---

## Troubleshooting

### Error: "Module not found"

**Causa**: Imports no resueltos en Deno

**Solución**: Asegurarse de usar JSR imports:
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
```

---

### Error: "Environment variable not set"

**Causa**: GEMINI_API_KEY o WOMPI_* no configurados

**Solución**: Configurar secrets (ver sección "Configurar Variables de Entorno")

---

### Error: "Permission denied"

**Causa**: RLS bloqueando operación

**Solución**: Usar service_role client en Edge Functions:
```typescript
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // ← Service role, no anon key
);
```

---

### Error: "Function timeout"

**Causa**: Operación > 10 segundos

**Solución**:
1. Optimizar queries
2. Implementar timeouts en external API calls
3. Considerar async processing con workers

---

## Monitoreo Post-Deployment

### Métricas a monitorear:

1. **Response Time**
   - Target: < 2 segundos
   - Critical: > 5 segundos

2. **Error Rate**
   - Target: < 1%
   - Critical: > 5%

3. **Invocations**
   - Normal: 100-500/día (desarrollo)
   - Esperado: 10,000+/día (producción)

4. **Memory Usage**
   - Limit: 512MB por función
   - Alert si > 400MB

### Alertas recomendadas:

```yaml
- name: "High Error Rate"
  condition: error_rate > 5%
  action: Email to admin

- name: "Function Timeout"
  condition: duration > 8 seconds
  action: Slack notification

- name: "API Key Invalid"
  condition: status_code = 401 from Gemini/Wompi
  action: Email + SMS to admin
```

---

## Rollback Plan

Si una función falla después del deployment:

### Via Dashboard

1. Ir a: https://supabase.com/dashboard/project/shiqwhbodviimvpxpszd/functions

2. Click en función problemática

3. "Versions" tab

4. "Restore" versión anterior

### Via CLI

```bash
# Ver versiones
supabase functions list --project-ref shiqwhbodviimvpxpszd

# Revertir a versión anterior
supabase functions deploy payment-webhook --version 1 --project-ref shiqwhbodviimvpxpszd
```

---

## Checklist Pre-Production

Antes de marcar como COMPLETADO:

- [ ] 4 funciones desplegadas exitosamente
- [ ] Todas las variables de entorno configuradas
- [ ] Tests de cada endpoint ejecutados y pasados
- [ ] Logs revisados (sin errores críticos)
- [ ] Monitoreo configurado
- [ ] Documentación compartida con Frontend Builder
- [ ] Webhook URLs compartidas con DevOps Orchestrator
- [ ] Plan de rollback documentado

---

## URLs de Producción Final

Una vez desplegadas, estas serán las URLs:

```
✅ https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/auth-webhook
📝 https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/payment-webhook
📝 https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/amelia-chat
📝 https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler
📝 https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/credit-manager
```

Compartir estas URLs con:
- **Frontend Builder** (Agent 3) para integración
- **DevOps Orchestrator** (Agent 4) para monitoring

---

**Última actualización**: 2025-10-25
**Creado por**: Backend Architect (Agent 2)
**Estado**: 📋 Instrucciones listas para ejecución
