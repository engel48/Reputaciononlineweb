-- =====================================================
-- MIGRACIÓN: Datos REALES de OAuth y Scraping
-- Fecha: 2025-01-26
-- Descripción: Tablas y funciones para almacenar datos REALES
--              NO simulados de OAuth tokens y noticias scrapeadas
-- =====================================================

-- =====================================================
-- TABLA: oauth_logs
-- Propósito: Auditoría completa de todas las operaciones OAuth
-- =====================================================

CREATE TABLE IF NOT EXISTS oauth_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- connect, disconnect, refresh, validate, error
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  error_code VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para oauth_logs
CREATE INDEX IF NOT EXISTS idx_oauth_logs_user_id ON oauth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_platform ON oauth_logs(platform);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_action ON oauth_logs(action);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_success ON oauth_logs(success);
CREATE INDEX IF NOT EXISTS idx_oauth_logs_created_at ON oauth_logs(created_at DESC);

COMMENT ON TABLE oauth_logs IS 'Log de auditoría de todas las operaciones OAuth (conexiones, desconexiones, refreshes)';
COMMENT ON COLUMN oauth_logs.action IS 'Tipo de acción: connect, disconnect, refresh, validate, error';
COMMENT ON COLUMN oauth_logs.metadata IS 'Información adicional sobre la operación (sin datos sensibles)';

-- =====================================================
-- TABLA: scraped_news
-- Propósito: Almacenar noticias REALES scrapeadas de medios colombianos
-- =====================================================

CREATE TABLE IF NOT EXISTS scraped_news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT, -- Resumen generado por IA
  source VARCHAR(255) NOT NULL,
  source_url TEXT NOT NULL, -- URL del medio (ej: eltiempo.com)
  article_url TEXT UNIQUE NOT NULL, -- URL completa del artículo
  published_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  author VARCHAR(255),
  image_url TEXT,

  -- Análisis de sentimiento
  sentiment VARCHAR(20), -- positive, negative, neutral
  sentiment_score DECIMAL(5,2), -- -100.00 a +100.00
  relevance_score DECIMAL(3,2), -- 0.00 a 1.00

  -- Metadatos
  verified BOOLEAN DEFAULT true, -- TRUE porque proviene de scraping real
  language VARCHAR(10) DEFAULT 'es',
  category VARCHAR(50), -- política, economía, deportes, etc.
  keywords TEXT[], -- Array de palabras clave extraídas
  entities JSONB DEFAULT '{}'::JSONB, -- Entidades nombradas (personas, lugares, organizaciones)
  raw_data JSONB, -- Datos crudos del scraping

  -- Control
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para scraped_news
CREATE INDEX IF NOT EXISTS idx_scraped_news_source ON scraped_news(source);
CREATE INDEX IF NOT EXISTS idx_scraped_news_published_at ON scraped_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_news_scraped_at ON scraped_news(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_news_sentiment ON scraped_news(sentiment);
CREATE INDEX IF NOT EXISTS idx_scraped_news_category ON scraped_news(category);
CREATE INDEX IF NOT EXISTS idx_scraped_news_verified ON scraped_news(verified);
CREATE INDEX IF NOT EXISTS idx_scraped_news_article_url ON scraped_news(article_url);

-- Índice GIN para búsqueda full-text en título y contenido
CREATE INDEX IF NOT EXISTS idx_scraped_news_fulltext ON scraped_news USING GIN(to_tsvector('spanish', title || ' ' || COALESCE(content, '')));

-- Índice GIN para búsqueda en keywords
CREATE INDEX IF NOT EXISTS idx_scraped_news_keywords ON scraped_news USING GIN(keywords);

-- Índice GIN para búsqueda en entities
CREATE INDEX IF NOT EXISTS idx_scraped_news_entities ON scraped_news USING GIN(entities);

COMMENT ON TABLE scraped_news IS 'Noticias REALES scrapeadas de medios colombianos (NO simuladas)';
COMMENT ON COLUMN scraped_news.verified IS 'Siempre TRUE porque proviene de scraping real, no simulación';
COMMENT ON COLUMN scraped_news.entities IS 'Entidades nombradas extraídas: personas, lugares, organizaciones';
COMMENT ON COLUMN scraped_news.keywords IS 'Palabras clave extraídas del contenido';

-- =====================================================
-- FUNCIONES: Operaciones OAuth REALES
-- =====================================================

-- Función: Guardar conexión OAuth REAL
CREATE OR REPLACE FUNCTION save_oauth_connection(
  p_user_id UUID,
  p_platform VARCHAR(50),
  p_access_token TEXT,
  p_refresh_token TEXT DEFAULT NULL,
  p_token_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_username VARCHAR(255) DEFAULT NULL,
  p_profile_url TEXT DEFAULT NULL,
  p_profile_data JSONB DEFAULT '{}'::JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_connection_id UUID;
  v_old_connected BOOLEAN;
BEGIN
  -- Verificar estado anterior
  SELECT connected INTO v_old_connected
  FROM social_media
  WHERE user_id = p_user_id AND platform = p_platform;

  -- Insertar o actualizar conexión
  INSERT INTO social_media (
    user_id,
    platform,
    connected,
    access_token,
    refresh_token,
    token_expiry,
    username,
    profile_url,
    last_sync,
    created_at
  )
  VALUES (
    p_user_id,
    p_platform,
    true,
    p_access_token,
    p_refresh_token,
    p_token_expiry,
    COALESCE(p_username, p_profile_data->>'username'),
    COALESCE(p_profile_url, p_profile_data->>'profile_url'),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, platform)
  DO UPDATE SET
    connected = true,
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_expiry = EXCLUDED.token_expiry,
    username = COALESCE(EXCLUDED.username, social_media.username),
    profile_url = COALESCE(EXCLUDED.profile_url, social_media.profile_url),
    last_sync = NOW()
  RETURNING id INTO v_connection_id;

  -- Log la acción (solo si es nueva conexión o reconexión)
  IF v_old_connected IS NULL OR v_old_connected = false THEN
    INSERT INTO oauth_logs (
      user_id,
      platform,
      action,
      success,
      ip_address,
      user_agent,
      metadata
    )
    VALUES (
      p_user_id,
      p_platform,
      'connect',
      true,
      p_ip_address,
      p_user_agent,
      jsonb_build_object(
        'username', COALESCE(p_username, p_profile_data->>'username'),
        'token_expiry', p_token_expiry,
        'has_refresh_token', (p_refresh_token IS NOT NULL)
      )
    );
  END IF;

  RETURN v_connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION save_oauth_connection IS 'Guarda una conexión OAuth REAL con tokens y metadatos';

-- Función: Desconectar plataforma OAuth
CREATE OR REPLACE FUNCTION disconnect_oauth_platform(
  p_user_id UUID,
  p_platform VARCHAR(50),
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_was_connected BOOLEAN;
BEGIN
  -- Verificar si estaba conectada
  SELECT connected INTO v_was_connected
  FROM social_media
  WHERE user_id = p_user_id AND platform = p_platform;

  IF v_was_connected IS NULL OR v_was_connected = false THEN
    RETURN false; -- Ya estaba desconectada
  END IF;

  -- Desconectar (mantener registro pero limpiar tokens)
  UPDATE social_media
  SET
    connected = false,
    access_token = NULL,
    refresh_token = NULL,
    token_expiry = NULL,
    last_sync = NULL
  WHERE user_id = p_user_id AND platform = p_platform;

  -- Log la desconexión
  INSERT INTO oauth_logs (
    user_id,
    platform,
    action,
    success,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_platform,
    'disconnect',
    true,
    p_ip_address,
    p_user_agent
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION disconnect_oauth_platform IS 'Desconecta una plataforma OAuth y limpia tokens sensibles';

-- Función: Refresh token OAuth
CREATE OR REPLACE FUNCTION refresh_oauth_token(
  p_user_id UUID,
  p_platform VARCHAR(50),
  p_new_access_token TEXT,
  p_new_refresh_token TEXT DEFAULT NULL,
  p_new_token_expiry TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Verificar que la conexión existe
  SELECT EXISTS(
    SELECT 1 FROM social_media
    WHERE user_id = p_user_id AND platform = p_platform AND connected = true
  ) INTO v_exists;

  IF NOT v_exists THEN
    -- Log error
    INSERT INTO oauth_logs (
      user_id,
      platform,
      action,
      success,
      error_message
    )
    VALUES (
      p_user_id,
      p_platform,
      'refresh',
      false,
      'Connection not found or not connected'
    );
    RETURN false;
  END IF;

  -- Actualizar tokens
  UPDATE social_media
  SET
    access_token = p_new_access_token,
    refresh_token = COALESCE(p_new_refresh_token, refresh_token),
    token_expiry = COALESCE(p_new_token_expiry, token_expiry),
    last_sync = NOW()
  WHERE user_id = p_user_id AND platform = p_platform;

  -- Log éxito
  INSERT INTO oauth_logs (
    user_id,
    platform,
    action,
    success,
    metadata
  )
  VALUES (
    p_user_id,
    p_platform,
    'refresh',
    true,
    jsonb_build_object(
      'new_token_expiry', p_new_token_expiry
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_oauth_token IS 'Actualiza tokens OAuth después de un refresh';

-- Función: Obtener tokens que expiran pronto
CREATE OR REPLACE FUNCTION get_expiring_oauth_tokens(
  p_hours_ahead INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  platform VARCHAR(50),
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.id,
    sm.user_id,
    sm.platform::VARCHAR(50),
    sm.refresh_token,
    sm.token_expiry
  FROM social_media sm
  WHERE sm.connected = true
    AND sm.token_expiry IS NOT NULL
    AND sm.token_expiry < NOW() + (p_hours_ahead || ' hours')::INTERVAL
    AND sm.refresh_token IS NOT NULL
  ORDER BY sm.token_expiry ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_expiring_oauth_tokens IS 'Obtiene tokens OAuth que expirarán en las próximas N horas';

-- =====================================================
-- FUNCIONES: Scraping de Noticias REALES
-- =====================================================

-- Función: Guardar noticia scrapeada REAL
CREATE OR REPLACE FUNCTION save_scraped_news(
  p_title TEXT,
  p_content TEXT,
  p_summary TEXT DEFAULT NULL,
  p_source VARCHAR(255),
  p_source_url TEXT,
  p_article_url TEXT,
  p_published_at TIMESTAMP WITH TIME ZONE,
  p_author VARCHAR(255) DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_sentiment VARCHAR(20) DEFAULT NULL,
  p_sentiment_score DECIMAL(5,2) DEFAULT NULL,
  p_relevance_score DECIMAL(3,2) DEFAULT NULL,
  p_category VARCHAR(50) DEFAULT NULL,
  p_keywords TEXT[] DEFAULT NULL,
  p_entities JSONB DEFAULT NULL,
  p_raw_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_news_id UUID;
  v_is_update BOOLEAN;
BEGIN
  -- Verificar si ya existe
  SELECT id INTO v_news_id
  FROM scraped_news
  WHERE article_url = p_article_url;

  v_is_update := (v_news_id IS NOT NULL);

  -- Insertar o actualizar
  INSERT INTO scraped_news (
    title,
    content,
    summary,
    source,
    source_url,
    article_url,
    published_at,
    author,
    image_url,
    sentiment,
    sentiment_score,
    relevance_score,
    category,
    keywords,
    entities,
    raw_data,
    verified,
    scraped_at,
    created_at,
    updated_at
  )
  VALUES (
    p_title,
    p_content,
    p_summary,
    p_source,
    p_source_url,
    p_article_url,
    p_published_at,
    p_author,
    p_image_url,
    p_sentiment,
    p_sentiment_score,
    p_relevance_score,
    p_category,
    p_keywords,
    COALESCE(p_entities, '{}'::JSONB),
    p_raw_data,
    true, -- verified = true porque es scraping real
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (article_url) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    summary = EXCLUDED.summary,
    sentiment = COALESCE(EXCLUDED.sentiment, scraped_news.sentiment),
    sentiment_score = COALESCE(EXCLUDED.sentiment_score, scraped_news.sentiment_score),
    relevance_score = COALESCE(EXCLUDED.relevance_score, scraped_news.relevance_score),
    category = COALESCE(EXCLUDED.category, scraped_news.category),
    keywords = COALESCE(EXCLUDED.keywords, scraped_news.keywords),
    entities = COALESCE(EXCLUDED.entities, scraped_news.entities),
    raw_data = COALESCE(EXCLUDED.raw_data, scraped_news.raw_data),
    updated_at = NOW()
  RETURNING id INTO v_news_id;

  RETURN v_news_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION save_scraped_news IS 'Guarda noticia REAL scrapeada, con deduplicación por URL';

-- Función: Buscar noticias por keywords
CREATE OR REPLACE FUNCTION search_scraped_news(
  p_keywords TEXT[],
  p_sentiment VARCHAR(20) DEFAULT NULL,
  p_sources VARCHAR(255)[] DEFAULT NULL,
  p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_to_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  source VARCHAR(255),
  article_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  sentiment VARCHAR(20),
  sentiment_score DECIMAL(5,2),
  relevance_score DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sn.id,
    sn.title,
    sn.summary,
    sn.source,
    sn.article_url,
    sn.published_at,
    sn.sentiment,
    sn.sentiment_score,
    sn.relevance_score
  FROM scraped_news sn
  WHERE
    -- Filtro por keywords (búsqueda en título, contenido y keywords array)
    (p_keywords IS NULL OR
     sn.keywords && p_keywords OR
     to_tsvector('spanish', sn.title || ' ' || COALESCE(sn.content, '')) @@
     to_tsquery('spanish', array_to_string(p_keywords, ' | ')))
    -- Filtro por sentiment
    AND (p_sentiment IS NULL OR sn.sentiment = p_sentiment)
    -- Filtro por sources
    AND (p_sources IS NULL OR sn.source = ANY(p_sources))
    -- Filtro por rango de fechas
    AND (p_from_date IS NULL OR sn.published_at >= p_from_date)
    AND (p_to_date IS NULL OR sn.published_at <= p_to_date)
    -- Solo noticias verificadas
    AND sn.verified = true
  ORDER BY sn.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_scraped_news IS 'Búsqueda avanzada de noticias scrapeadas por keywords, sentiment, fuentes y fechas';

-- Función: Obtener estadísticas de scraping
CREATE OR REPLACE FUNCTION get_scraping_stats(
  p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
  source VARCHAR(255),
  total_articles BIGINT,
  positive_count BIGINT,
  negative_count BIGINT,
  neutral_count BIGINT,
  avg_sentiment_score DECIMAL(5,2),
  last_scraped TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sn.source,
    COUNT(*) as total_articles,
    COUNT(*) FILTER (WHERE sn.sentiment = 'positive') as positive_count,
    COUNT(*) FILTER (WHERE sn.sentiment = 'negative') as negative_count,
    COUNT(*) FILTER (WHERE sn.sentiment = 'neutral') as neutral_count,
    ROUND(AVG(sn.sentiment_score), 2) as avg_sentiment_score,
    MAX(sn.scraped_at) as last_scraped
  FROM scraped_news sn
  WHERE sn.scraped_at >= p_from_date
  GROUP BY sn.source
  ORDER BY total_articles DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_scraping_stats IS 'Estadísticas de scraping por fuente (últimos 30 días por defecto)';

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE oauth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_news ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: oauth_logs
-- =====================================================

-- Users pueden ver sus propios logs
CREATE POLICY "oauth_logs_select_own" ON oauth_logs FOR SELECT
USING (auth.uid() = user_id);

-- Admins pueden ver todos los logs
CREATE POLICY "oauth_logs_select_admin" ON oauth_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Solo service_role puede insertar logs (operaciones del sistema)
-- No se crean políticas INSERT para usuarios

COMMENT ON POLICY "oauth_logs_select_own" ON oauth_logs IS
'Los usuarios pueden ver sus propios logs de OAuth';

COMMENT ON POLICY "oauth_logs_select_admin" ON oauth_logs IS
'Los admins pueden ver todos los logs de OAuth para auditoría';

-- =====================================================
-- RLS POLICIES: scraped_news
-- =====================================================

-- Noticias scrapeadas son públicas para todos los usuarios autenticados
CREATE POLICY "scraped_news_select_authenticated" ON scraped_news FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo service_role puede insertar/actualizar noticias (scraping automático)
-- No se crean políticas INSERT/UPDATE para usuarios normales

COMMENT ON POLICY "scraped_news_select_authenticated" ON scraped_news IS
'Todos los usuarios autenticados pueden leer noticias scrapeadas';

-- =====================================================
-- TRIGGERS PARA AUTO-UPDATE DE TIMESTAMPS
-- =====================================================

-- Trigger para scraped_news.updated_at
CREATE TRIGGER update_scraped_news_updated_at
BEFORE UPDATE ON scraped_news
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS ÚTILES
-- =====================================================

-- Vista: Noticias recientes por sentimiento
CREATE OR REPLACE VIEW recent_news_by_sentiment AS
SELECT
  sentiment,
  COUNT(*) as total,
  ROUND(AVG(sentiment_score), 2) as avg_score,
  ARRAY_AGG(DISTINCT source) as sources,
  MAX(published_at) as latest_publication
FROM scraped_news
WHERE published_at >= NOW() - INTERVAL '7 days'
  AND verified = true
GROUP BY sentiment;

COMMENT ON VIEW recent_news_by_sentiment IS
'Vista rápida de distribución de sentimiento en noticias de los últimos 7 días';

-- Vista: Top keywords en noticias recientes
CREATE OR REPLACE VIEW trending_keywords AS
SELECT
  keyword,
  COUNT(*) as frequency,
  ARRAY_AGG(DISTINCT source) as sources,
  MAX(published_at) as latest_mention
FROM scraped_news,
     LATERAL unnest(keywords) as keyword
WHERE published_at >= NOW() - INTERVAL '3 days'
  AND verified = true
GROUP BY keyword
ORDER BY frequency DESC
LIMIT 100;

COMMENT ON VIEW trending_keywords IS
'Keywords más mencionados en noticias de los últimos 3 días';

-- =====================================================
-- GRANTS Y PERMISOS
-- =====================================================

-- Revocar acceso público a columnas sensibles de social_media
-- NOTA: Esto se maneja a nivel de aplicación, pero se documenta aquí
COMMENT ON COLUMN social_media.access_token IS
'SENSIBLE: Debe ser encriptado en la capa de aplicación antes de almacenar';

COMMENT ON COLUMN social_media.refresh_token IS
'SENSIBLE: Debe ser encriptado en la capa de aplicación antes de almacenar';

-- =====================================================
-- DATOS INICIALES / SEEDS (Opcional)
-- =====================================================

-- Insertar log inicial del sistema (opcional)
INSERT INTO oauth_logs (
  user_id,
  platform,
  action,
  success,
  metadata
) VALUES (
  NULL, -- System log
  'system',
  'migration_applied',
  true,
  jsonb_build_object(
    'migration', '20250126_real_oauth_and_scraping',
    'timestamp', NOW()
  )
);

-- =====================================================
-- COMENTARIOS FINALES Y ROLLBACK
-- =====================================================

COMMENT ON MIGRATION IS '
MIGRACIÓN: 20250126_real_oauth_and_scraping.sql

PROPÓSITO:
- Eliminar dependencia de datos simulados
- Almacenar SOLO datos REALES de OAuth y scraping
- Proveer funciones para operaciones seguras y auditables

TABLAS CREADAS:
1. oauth_logs - Auditoría de operaciones OAuth
2. scraped_news - Noticias REALES de medios colombianos

FUNCIONES CREADAS:
- save_oauth_connection() - Guardar tokens OAuth reales
- disconnect_oauth_platform() - Desconectar con limpieza de tokens
- refresh_oauth_token() - Actualizar tokens expirados
- get_expiring_oauth_tokens() - Obtener tokens por expirar
- save_scraped_news() - Guardar noticias con deduplicación
- search_scraped_news() - Búsqueda avanzada de noticias
- get_scraping_stats() - Estadísticas de scraping

ROLLBACK:
Para revertir esta migración, ejecutar:

DROP VIEW IF EXISTS trending_keywords;
DROP VIEW IF EXISTS recent_news_by_sentiment;
DROP TRIGGER IF EXISTS update_scraped_news_updated_at ON scraped_news;
DROP FUNCTION IF EXISTS get_scraping_stats(TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS search_scraped_news(TEXT[], VARCHAR, VARCHAR[], TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, INTEGER);
DROP FUNCTION IF EXISTS save_scraped_news(TEXT, TEXT, TEXT, VARCHAR, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, VARCHAR, TEXT, VARCHAR, DECIMAL, DECIMAL, VARCHAR, TEXT[], JSONB, JSONB);
DROP FUNCTION IF EXISTS get_expiring_oauth_tokens(INTEGER);
DROP FUNCTION IF EXISTS refresh_oauth_token(UUID, VARCHAR, TEXT, TEXT, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS disconnect_oauth_platform(UUID, VARCHAR, INET, TEXT);
DROP FUNCTION IF EXISTS save_oauth_connection(UUID, VARCHAR, TEXT, TEXT, TIMESTAMP WITH TIME ZONE, VARCHAR, TEXT, JSONB, INET, TEXT);
DROP TABLE IF EXISTS scraped_news;
DROP TABLE IF EXISTS oauth_logs;
';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
