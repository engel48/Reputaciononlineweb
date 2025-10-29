-- =====================================================
-- MIGRACIÓN: Corregir estructura de scraping_jobs
-- Fecha: 2025-10-29
-- Descripción: Agregar campos faltantes para el worker de scraping
-- =====================================================

-- 1. Agregar columnas faltantes
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::JSONB;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS worker_id TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS result JSONB;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE scraping_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Migrar datos de parameters a config si existen
UPDATE scraping_jobs
SET config = parameters
WHERE config = '{}'::JSONB
  AND parameters IS NOT NULL
  AND parameters != '{}'::JSONB;

-- 3. Constraint para priority (1-5, donde 1 es máxima prioridad)
DO $$
BEGIN
  ALTER TABLE scraping_jobs ADD CONSTRAINT scraping_jobs_priority_check
    CHECK (priority BETWEEN 1 AND 5);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Índices adicionales para performance
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_user_id ON scraping_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status ON scraping_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_platform ON scraping_jobs(platform);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_priority ON scraping_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_scheduled_at ON scraping_jobs(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);

-- Índice compuesto para consultas frecuentes del worker
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_pending_queue
  ON scraping_jobs(status, priority, scheduled_at, created_at)
  WHERE status = 'pending';

-- Índice para retry monitoring
CREATE INDEX IF NOT EXISTS idx_scraping_jobs_retry
  ON scraping_jobs(retry_count, status)
  WHERE retry_count > 0;

-- 5. Trigger para updated_at
CREATE TRIGGER update_scraping_jobs_updated_at
BEFORE UPDATE ON scraping_jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentarios para documentación
COMMENT ON COLUMN scraping_jobs.priority IS 'Prioridad del job (1=máxima, 5=mínima) según plan del usuario';
COMMENT ON COLUMN scraping_jobs.config IS 'Configuración del job: lookback_hours, keywords, access_token, etc.';
COMMENT ON COLUMN scraping_jobs.scheduled_at IS 'Cuándo debe ejecutarse el job (para programación futura)';
COMMENT ON COLUMN scraping_jobs.worker_id IS 'ID del worker que procesó este job';
COMMENT ON COLUMN scraping_jobs.retry_count IS 'Número de reintentos realizados (máximo 3)';
COMMENT ON COLUMN scraping_jobs.result IS 'Resultado del job en formato JSON (items scraped, etc.)';
COMMENT ON COLUMN scraping_jobs.error_message IS 'Mensaje de error si el job falló';
COMMENT ON COLUMN scraping_jobs.parameters IS 'DEPRECADO: Usar config en su lugar';

-- 7. Actualizar constraint de status si no incluye 'processing'
ALTER TABLE scraping_jobs DROP CONSTRAINT IF EXISTS scraping_jobs_status_check;
ALTER TABLE scraping_jobs ADD CONSTRAINT scraping_jobs_status_check
  CHECK (status IN ('pending', 'processing', 'running', 'completed', 'failed'));
