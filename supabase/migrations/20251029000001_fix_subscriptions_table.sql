-- =====================================================
-- MIGRACIÓN: Corregir estructura de subscriptions
-- Fecha: 2025-10-29
-- Descripción: Agregar campos faltantes que usa payment-webhook
-- =====================================================

-- 1. Renombrar columna 'plan' a 'plan_type' para consistencia con código
ALTER TABLE subscriptions RENAME COLUMN plan TO plan_type;

-- 2. Agregar campo cancel_at_period_end
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- 3. Agregar campo metadata para datos adicionales (last_payment_id, wompi_transaction_id)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

-- 4. Agregar campo updated_at para tracking
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Trigger para updated_at (usar función existente)
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status) WHERE status = 'active';

-- 7. Comentarios para documentación
COMMENT ON COLUMN subscriptions.plan_type IS 'Tipo de plan: basico, profesional, empresarial, politico';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Si la suscripción se cancelará al final del periodo actual';
COMMENT ON COLUMN subscriptions.metadata IS 'Metadatos adicionales JSON: last_payment_id, wompi_transaction_id, etc.';
COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp de última actualización (auto-actualizado por trigger)';

-- 8. Actualizar RLS policies si es necesario (mantener las existentes)
-- Las policies existentes deben seguir funcionando con plan_type en lugar de plan
