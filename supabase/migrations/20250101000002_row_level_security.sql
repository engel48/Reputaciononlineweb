-- ================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================
-- Fecha: 2025-01-01
-- Descripción: Políticas de seguridad a nivel de fila
-- Garantiza que cada usuario solo pueda acceder a sus propios datos

-- ================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_media_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Tablas públicas (sin RLS)
-- social_platforms, media_sources, monitoring_sources son de solo lectura para todos

-- ================================================
-- POLÍTICAS PARA USERS
-- ================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id);

-- Los usuarios pueden eliminar su propia cuenta
CREATE POLICY "Users can delete own account"
    ON users FOR DELETE
    USING (auth.uid()::text = id);

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- ================================================
-- POLÍTICAS PARA SOCIAL_MEDIA
-- ================================================

-- Los usuarios pueden ver sus propias conexiones de redes sociales
CREATE POLICY "Users can view own social media"
    ON social_media FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden crear nuevas conexiones
CREATE POLICY "Users can create own social media"
    ON social_media FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden actualizar sus conexiones
CREATE POLICY "Users can update own social media"
    ON social_media FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus conexiones
CREATE POLICY "Users can delete own social media"
    ON social_media FOR DELETE
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA USER_STATS
-- ================================================

-- Los usuarios pueden ver sus propias estadísticas
CREATE POLICY "Users can view own stats"
    ON user_stats FOR SELECT
    USING (auth.uid()::text = user_id);

-- Solo el sistema puede actualizar estadísticas (via service_role)
-- Los usuarios normales no pueden modificarlas directamente

-- ================================================
-- POLÍTICAS PARA NOTIFICATIONS
-- ================================================

-- Los usuarios pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden marcar como leídas sus notificaciones
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus notificaciones
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA ALERTS
-- ================================================

-- Los usuarios pueden ver sus propias alertas
CREATE POLICY "Users can view own alerts"
    ON alerts FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden crear alertas
CREATE POLICY "Users can create own alerts"
    ON alerts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden actualizar sus alertas
CREATE POLICY "Users can update own alerts"
    ON alerts FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus alertas
CREATE POLICY "Users can delete own alerts"
    ON alerts FOR DELETE
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA REPORTS
-- ================================================

-- Los usuarios pueden ver sus propios reportes
CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden crear reportes
CREATE POLICY "Users can create own reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus reportes
CREATE POLICY "Users can delete own reports"
    ON reports FOR DELETE
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA ACTIVITIES
-- ================================================

-- Los usuarios pueden ver su propio historial de actividades
CREATE POLICY "Users can view own activities"
    ON activities FOR SELECT
    USING (auth.uid()::text = user_id);

-- Solo el sistema puede crear actividades (via service_role)

-- Los administradores pueden ver todas las actividades
CREATE POLICY "Admins can view all activities"
    ON activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()::text AND role = 'admin'
        )
    );

-- ================================================
-- POLÍTICAS PARA USER_MEDIA_SOURCES
-- ================================================

-- Los usuarios pueden ver sus fuentes de medios seleccionadas
CREATE POLICY "Users can view own media sources"
    ON user_media_sources FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden seleccionar/deseleccionar fuentes
CREATE POLICY "Users can manage own media sources"
    ON user_media_sources FOR ALL
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA MENTIONS
-- ================================================

-- Los usuarios pueden ver sus propias menciones
CREATE POLICY "Users can view own mentions"
    ON mentions FOR SELECT
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden crear menciones
CREATE POLICY "Users can create own mentions"
    ON mentions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden actualizar sus menciones
CREATE POLICY "Users can update own mentions"
    ON mentions FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus menciones
CREATE POLICY "Users can delete own mentions"
    ON mentions FOR DELETE
    USING (auth.uid()::text = user_id);

-- ================================================
-- POLÍTICAS PARA NEWS (Lectura pública)
-- ================================================

-- Todas las noticias son visibles para usuarios autenticados
CREATE POLICY "Authenticated users can view news"
    ON news FOR SELECT
    TO authenticated
    USING (true);

-- Solo el sistema puede crear/actualizar/eliminar noticias (via service_role)

-- ================================================
-- POLÍTICAS PARA TABLAS PÚBLICAS
-- ================================================

-- social_platforms: Lectura pública
ALTER TABLE social_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view social platforms"
    ON social_platforms FOR SELECT
    TO authenticated
    USING (is_active = true);

-- media_sources: Lectura pública
ALTER TABLE media_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active media sources"
    ON media_sources FOR SELECT
    TO authenticated
    USING (is_active = true);

-- monitoring_sources: Lectura pública
ALTER TABLE monitoring_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active monitoring sources"
    ON monitoring_sources FOR SELECT
    TO authenticated
    USING (is_active = true);

-- ================================================
-- FUNCIONES HELPER PARA RLS
-- ================================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()::text AND role = 'admin'
    );
END;
$$;

-- Función para verificar si el usuario tiene un plan específico
CREATE OR REPLACE FUNCTION has_plan(plan_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()::text AND plan = plan_name
    );
END;
$$;

-- Función para verificar si el usuario tiene créditos suficientes
CREATE OR REPLACE FUNCTION has_credits(min_credits INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()::text AND credits >= min_credits
    );
END;
$$;

-- ================================================
-- COMENTARIOS
-- ================================================

COMMENT ON POLICY "Users can view own profile" ON users IS
    'Los usuarios solo pueden ver su propio perfil';

COMMENT ON POLICY "Admins can view all users" ON users IS
    'Los administradores pueden ver todos los perfiles';

COMMENT ON FUNCTION is_admin IS
    'Verifica si el usuario actual es administrador';

COMMENT ON FUNCTION has_plan IS
    'Verifica si el usuario tiene un plan específico';

COMMENT ON FUNCTION has_credits IS
    'Verifica si el usuario tiene suficientes créditos';

-- ================================================
-- FIN DE POLÍTICAS RLS
-- ================================================
