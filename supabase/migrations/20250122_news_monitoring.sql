-- Migración: Sistema de Monitoreo de Noticias Colombianas
-- Fecha: 2025-01-22
-- Descripción: Tablas para monitoreo en tiempo real de menciones en sitios de noticias

-- Tabla: monitored_news_sites
-- Almacena la configuración de sitios que cada usuario está monitoreando
CREATE TABLE IF NOT EXISTS monitored_news_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id VARCHAR(100) NOT NULL, -- ID del sitio de la lista predefinida
    is_active BOOLEAN DEFAULT true,
    search_terms JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de términos de búsqueda
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    check_frequency_minutes INTEGER DEFAULT 30, -- Frecuencia de chequeo en minutos

    -- Constraints
    CONSTRAINT unique_user_site UNIQUE(user_id, site_id),
    CONSTRAINT valid_search_terms CHECK (jsonb_typeof(search_terms) = 'array')
);

-- Tabla: news_mentions
-- Almacena todas las menciones encontradas en artículos de noticias
CREATE TABLE IF NOT EXISTS news_mentions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    monitored_site_id UUID NOT NULL REFERENCES monitored_news_sites(id) ON DELETE CASCADE,

    -- Datos del artículo
    article_url TEXT NOT NULL,
    article_title TEXT NOT NULL,
    article_author TEXT,
    mention_context TEXT NOT NULL, -- Párrafo donde aparece la mención
    full_content TEXT, -- Contenido completo del artículo (opcional)

    -- Análisis
    sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
    sentiment_score DECIMAL(3,2), -- -1.00 a 1.00
    matched_terms JSONB NOT NULL DEFAULT '[]'::jsonb, -- Términos que coincidieron

    -- Metadata
    published_date TIMESTAMP WITH TIME ZONE,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,

    -- Deduplicación
    article_hash VARCHAR(64), -- Hash del contenido para evitar duplicados

    -- Constraints
    CONSTRAINT unique_article_per_user UNIQUE(user_id, article_hash)
);

-- Tabla: news_sites_catalog
-- Catálogo de sitios de noticias disponibles para monitorear
CREATE TABLE IF NOT EXISTS news_sites_catalog (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    category VARCHAR(50) NOT NULL, -- 'nacional', 'regional', 'digital', 'economico', 'deportivo'

    -- Configuración de scraping
    scraping_method VARCHAR(20) CHECK (scraping_method IN ('rss', 'sitemap', 'scraping')) DEFAULT 'rss',
    rss_url TEXT,
    sitemap_url TEXT,

    -- Selectores para scraping directo (JSONB)
    selectors JSONB DEFAULT '{}'::jsonb,

    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_successful_scrape TIMESTAMP WITH TIME ZONE,
    scrape_failure_count INTEGER DEFAULT 0,

    -- Rate limiting
    max_requests_per_hour INTEGER DEFAULT 12,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: scraping_jobs
-- Queue de trabajos de scraping
CREATE TABLE IF NOT EXISTS scraping_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monitored_site_id UUID NOT NULL REFERENCES monitored_news_sites(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id VARCHAR(100) NOT NULL REFERENCES news_sites_catalog(id),

    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    priority INTEGER DEFAULT 5, -- 1 (alta) a 10 (baja)

    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Resultados
    articles_found INTEGER DEFAULT 0,
    mentions_found INTEGER DEFAULT 0,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: user_notification_preferences
-- Preferencias de notificación para menciones
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Canales de notificación
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,

    -- Condiciones de notificación
    notify_all_mentions BOOLEAN DEFAULT false,
    notify_negative_only BOOLEAN DEFAULT true,

    -- Frecuencia
    digest_frequency VARCHAR(20) CHECK (digest_frequency IN ('realtime', 'hourly', 'daily')) DEFAULT 'realtime',

    -- Umbrales
    min_sentiment_score DECIMAL(3,2) DEFAULT -0.50, -- Solo notificar si es más negativo que esto

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización de queries
CREATE INDEX idx_monitored_sites_user_active ON monitored_news_sites(user_id, is_active);
CREATE INDEX idx_monitored_sites_last_checked ON monitored_news_sites(last_checked_at) WHERE is_active = true;

CREATE INDEX idx_mentions_user_date ON news_mentions(user_id, discovered_at DESC);
CREATE INDEX idx_mentions_unread ON news_mentions(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_mentions_sentiment ON news_mentions(user_id, sentiment);
CREATE INDEX idx_mentions_site ON news_mentions(monitored_site_id);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status, priority, created_at);
CREATE INDEX idx_scraping_jobs_user ON scraping_jobs(user_id, created_at DESC);

CREATE INDEX idx_sites_catalog_active ON news_sites_catalog(is_active) WHERE is_active = true;
CREATE INDEX idx_sites_catalog_category ON news_sites_catalog(category);

-- Row Level Security (RLS) Policies

-- monitored_news_sites policies
ALTER TABLE monitored_news_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own monitored sites"
    ON monitored_news_sites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitored sites"
    ON monitored_news_sites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitored sites"
    ON monitored_news_sites FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitored sites"
    ON monitored_news_sites FOR DELETE
    USING (auth.uid() = user_id);

-- news_mentions policies
ALTER TABLE news_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mentions"
    ON news_mentions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert mentions for users"
    ON news_mentions FOR INSERT
    WITH CHECK (true); -- Service role solo

CREATE POLICY "Users can update their own mentions"
    ON news_mentions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- news_sites_catalog policies (público, solo lectura)
ALTER TABLE news_sites_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active news sites"
    ON news_sites_catalog FOR SELECT
    USING (is_active = true);

-- scraping_jobs policies
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scraping jobs"
    ON scraping_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- user_notification_preferences policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
    ON user_notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Funciones auxiliares

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_monitored_news_sites_updated_at
    BEFORE UPDATE ON monitored_news_sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_sites_catalog_updated_at
    BEFORE UPDATE ON news_sites_catalog
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON user_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener sitios que necesitan scraping
CREATE OR REPLACE FUNCTION get_sites_needing_scraping()
RETURNS TABLE (
    monitored_site_id UUID,
    user_id UUID,
    site_id VARCHAR,
    search_terms JSONB,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    check_frequency_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.user_id,
        m.site_id,
        m.search_terms,
        m.last_checked_at,
        m.check_frequency_minutes
    FROM monitored_news_sites m
    WHERE m.is_active = true
    AND (
        m.last_checked_at IS NULL
        OR m.last_checked_at < NOW() - INTERVAL '1 minute' * m.check_frequency_minutes
    )
    ORDER BY
        COALESCE(m.last_checked_at, '1970-01-01'::timestamp) ASC
    LIMIT 50; -- Procesar máximo 50 sitios por batch
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de usuario
CREATE OR REPLACE FUNCTION get_user_monitoring_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'active_sites', COUNT(DISTINCT m.site_id),
        'total_mentions', COUNT(DISTINCT nm.id),
        'unread_mentions', COUNT(DISTINCT nm.id) FILTER (WHERE nm.is_read = false),
        'negative_mentions', COUNT(DISTINCT nm.id) FILTER (WHERE nm.sentiment = 'negative'),
        'positive_mentions', COUNT(DISTINCT nm.id) FILTER (WHERE nm.sentiment = 'positive'),
        'last_mention_date', MAX(nm.discovered_at)
    ) INTO result
    FROM monitored_news_sites m
    LEFT JOIN news_mentions nm ON m.id = nm.monitored_site_id
    WHERE m.user_id = p_user_id AND m.is_active = true;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios en tablas
COMMENT ON TABLE monitored_news_sites IS 'Configuración de sitios que cada usuario está monitoreando';
COMMENT ON TABLE news_mentions IS 'Menciones encontradas en artículos de noticias';
COMMENT ON TABLE news_sites_catalog IS 'Catálogo de sitios de noticias colombianos disponibles';
COMMENT ON TABLE scraping_jobs IS 'Cola de trabajos de scraping pendientes y completados';
COMMENT ON TABLE user_notification_preferences IS 'Preferencias de notificación del usuario para menciones';
