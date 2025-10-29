-- =====================================================
-- MIGRACIÓN: Corregir estructura de payments
-- Fecha: 2025-10-29
-- Descripción: Agregar campos faltantes que usa payment-webhook
-- =====================================================

-- 1. Agregar columnas faltantes
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credits_purchased INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Actualizar constraint de status para incluir 'completed' y 'failed'
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'approved', 'declined', 'voided', 'completed', 'failed'));

-- 3. Hacer subscription_id opcional (puede haber pagos sin suscripción, ej: compra de créditos)
ALTER TABLE payments ALTER COLUMN subscription_id DROP NOT NULL;

-- 4. Índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_wompi_transaction_id ON payments(wompi_transaction_id) WHERE wompi_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_plan_type ON payments(plan_type) WHERE plan_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);

-- 5. Trigger para updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios para documentación
COMMENT ON COLUMN payments.plan_type IS 'Plan adquirido con este pago (basico, profesional, empresarial, politico)';
COMMENT ON COLUMN payments.credits_purchased IS 'Cantidad de créditos comprados con este pago';
COMMENT ON COLUMN payments.transaction_id IS 'ID genérico de transacción (se recomienda usar en lugar de wompi_transaction_id)';
COMMENT ON COLUMN payments.wompi_transaction_id IS 'ID de transacción específico de Wompi (legacy, usar transaction_id)';
COMMENT ON COLUMN payments.status IS 'Estado del pago: pending, approved, declined, voided, completed, failed';
COMMENT ON COLUMN payments.updated_at IS 'Timestamp de última actualización (auto-actualizado por trigger)';

-- 7. Actualizar RLS policies si es necesario (mantener las existentes)
