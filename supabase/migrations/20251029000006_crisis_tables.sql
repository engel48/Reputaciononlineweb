-- =====================================================
-- MIGRACIÓN: Tabla de alertas de crisis
-- Fecha: 2025-10-29
-- Descripción: Tabla para detectar y gestionar crisis de reputación
-- =====================================================

-- 1. Eliminar tabla existente si tiene estructura incorrecta y recrear
DROP TABLE IF EXISTS crisis_alerts CASCADE;

CREATE TABLE crisis_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}'::JSONB,
  status TEXT DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT crisis_alerts_type_check CHECK (type IN (
    'negative_spike',
    'sentiment_drop',
    'influential_criticism',
    'trending_negative',
    'media_coverage'
  )),
  CONSTRAINT crisis_alerts_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT crisis_alerts_status_check CHECK (status IN ('active', 'acknowledged', 'resolved'))
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_user_id ON crisis_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_status ON crisis_alerts(status);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_severity ON crisis_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_type ON crisis_alerts(type);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_created_at ON crisis_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_user_status ON crisis_alerts(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_crisis_alerts_active ON crisis_alerts(status, severity, created_at DESC) WHERE status = 'active';

-- 3. Trigger para updated_at
CREATE TRIGGER update_crisis_alerts_updated_at
BEFORE UPDATE ON crisis_alerts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Comentarios
COMMENT ON TABLE crisis_alerts IS 'Alertas de crisis de reputación detectadas automáticamente';
COMMENT ON COLUMN crisis_alerts.type IS 'Tipo de crisis detectada: spike negativo, caída sentimiento, crítica influyente, etc.';
COMMENT ON COLUMN crisis_alerts.severity IS 'Severidad de la crisis: low, medium, high, critical';
COMMENT ON COLUMN crisis_alerts.trigger_data IS 'Datos JSON que dispararon la alerta (thresholds, counts, etc.)';
COMMENT ON COLUMN crisis_alerts.status IS 'Estado: active (no atendida), acknowledged (vista), resolved (resuelta)';

-- 5. RLS Policies
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver solo sus propias alertas
CREATE POLICY crisis_alerts_select_own
  ON crisis_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden actualizar el estado de sus alertas
CREATE POLICY crisis_alerts_update_own
  ON crisis_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: El sistema (service_role) puede insertar alertas
CREATE POLICY crisis_alerts_insert_system
  ON crisis_alerts
  FOR INSERT
  WITH CHECK (true);

-- 6. Mejorar tabla scraped_news con campo content_hash si no existe
ALTER TABLE scraped_news ADD COLUMN IF NOT EXISTS content_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_scraped_news_hash ON scraped_news(content_hash) WHERE content_hash IS NOT NULL;

COMMENT ON COLUMN scraped_news.content_hash IS 'SHA-256 hash del contenido para deduplicación';

-- 7. Agregar campo user_keywords a tabla users si no existe (para facilitar scraping)
ALTER TABLE users ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_users_keywords ON users USING GIN (keywords) WHERE keywords != '{}';

COMMENT ON COLUMN users.keywords IS 'Palabras clave para monitorear en redes sociales y noticias';
