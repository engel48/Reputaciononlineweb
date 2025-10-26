-- ================================================
-- MIGRACIÓN INICIAL - Reputación Online
-- ================================================
-- Fecha: 2025-01-01
-- Descripción: Schema completo para la aplicación de Reputación Online
-- Incluye: Users, Social Media, Stats, Notifications, Alerts, Reports, etc.

-- ================================================
-- TABLAS PRINCIPALES
-- ================================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    company TEXT,
    phone TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    plan TEXT NOT NULL DEFAULT 'free',
    credits INTEGER NOT NULL DEFAULT 0,
    profile_type TEXT,
    category TEXT,
    brand_name TEXT,
    other_category TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    next_billing_date TIMESTAMP WITH TIME ZONE
);

-- Tabla de plataformas sociales disponibles
CREATE TABLE IF NOT EXISTS social_platforms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    oauth_config TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de conexiones de redes sociales de usuarios
CREATE TABLE IF NOT EXISTS social_media (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    username TEXT,
    profile_url TEXT,
    followers INTEGER NOT NULL DEFAULT 0,
    following INTEGER NOT NULL DEFAULT 0,
    posts INTEGER NOT NULL DEFAULT 0,
    engagement DOUBLE PRECISION NOT NULL DEFAULT 0,
    connected BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, platform)
);

-- Tabla de estadísticas de usuario
CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_mentions INTEGER NOT NULL DEFAULT 0,
    positive_mentions INTEGER NOT NULL DEFAULT 0,
    negative_mentions INTEGER NOT NULL DEFAULT 0,
    neutral_mentions INTEGER NOT NULL DEFAULT 0,
    sentiment_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    reach_estimate INTEGER NOT NULL DEFAULT 0,
    engagement_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    influence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    trending_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    monthly_growth DOUBLE PRECISION NOT NULL DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT NOT NULL DEFAULT 'normal',
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de alertas configuradas
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    keywords TEXT NOT NULL,
    platforms TEXT NOT NULL,
    sentiment TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    frequency TEXT NOT NULL DEFAULT 'realtime',
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de reportes generados
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    date_range TEXT NOT NULL,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'generated',
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de actividades del usuario
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de fuentes de medios
CREATE TABLE IF NOT EXISTS media_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabla de selección de fuentes por usuario
CREATE TABLE IF NOT EXISTS user_media_sources (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_source_id TEXT NOT NULL REFERENCES media_sources(id) ON DELETE CASCADE,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, media_source_id)
);

-- Tabla de fuentes de monitoreo
CREATE TABLE IF NOT EXISTS monitoring_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================================

-- Índices de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_media_user_id ON social_media(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON social_media(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_connected ON social_media(connected);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_active ON alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_sources_category ON media_sources(category);
CREATE INDEX IF NOT EXISTS idx_media_sources_is_active ON media_sources(is_active);

-- ================================================
-- TRIGGERS PARA AUTO-UPDATE DE TIMESTAMPS
-- ================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tablas con updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_sources_updated_at BEFORE UPDATE ON media_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitoring_sources_updated_at BEFORE UPDATE ON monitoring_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- DATOS INICIALES
-- ================================================

-- Insertar plataformas sociales por defecto
INSERT INTO social_platforms (id, name, platform, is_active) VALUES
    ('platform_facebook', 'Facebook', 'facebook', TRUE),
    ('platform_x', 'X (Twitter)', 'x', TRUE),
    ('platform_instagram', 'Instagram', 'instagram', TRUE),
    ('platform_linkedin', 'LinkedIn', 'linkedin', TRUE),
    ('platform_youtube', 'YouTube', 'youtube', TRUE),
    ('platform_threads', 'Threads', 'threads', TRUE),
    ('platform_tiktok', 'TikTok', 'tiktok', TRUE)
ON CONFLICT (platform) DO NOTHING;

-- Insertar fuentes de medios colombianos por defecto
INSERT INTO media_sources (id, name, url, category, is_default, is_active) VALUES
    ('source_eltiempo', 'El Tiempo', 'https://www.eltiempo.com', 'nacional', TRUE, TRUE),
    ('source_semana', 'Semana', 'https://www.semana.com', 'nacional', TRUE, TRUE),
    ('source_elespectador', 'El Espectador', 'https://www.elespectador.com', 'nacional', TRUE, TRUE),
    ('source_rcn', 'RCN Noticias', 'https://www.rcnradio.com', 'nacional', TRUE, TRUE),
    ('source_caracol', 'Caracol Radio', 'https://www.caracol.com.co', 'nacional', TRUE, TRUE)
ON CONFLICT (url) DO NOTHING;

-- ================================================
-- COMENTARIOS EN TABLAS
-- ================================================

COMMENT ON TABLE users IS 'Tabla principal de usuarios de la plataforma';
COMMENT ON TABLE social_media IS 'Conexiones de redes sociales por usuario con tokens OAuth';
COMMENT ON TABLE user_stats IS 'Estadísticas agregadas de reputación por usuario';
COMMENT ON TABLE notifications IS 'Notificaciones del sistema para usuarios';
COMMENT ON TABLE alerts IS 'Alertas configuradas por usuarios para monitoreo';
COMMENT ON TABLE reports IS 'Reportes generados para usuarios';
COMMENT ON TABLE activities IS 'Registro de actividades de usuarios (audit log)';
COMMENT ON TABLE media_sources IS 'Fuentes de medios disponibles para monitoreo';
COMMENT ON TABLE monitoring_sources IS 'Fuentes adicionales de monitoreo';

-- ================================================
-- FIN DE MIGRACIÓN INICIAL
-- ================================================
