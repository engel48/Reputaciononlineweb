-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- Reputación Online - Supabase Migration
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE amelia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE amelia_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE amelia_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABLA: users
-- =====================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "users_select_own" ON users FOR SELECT
USING (auth.uid()::text = id);

-- Los admins pueden ver todos los usuarios
CREATE POLICY "users_select_admin" ON users FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "users_update_own" ON users FOR UPDATE
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Solo admins pueden insertar usuarios (o se hace vía auth webhook)
CREATE POLICY "users_insert_admin" ON users FOR INSERT
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- Solo admins pueden eliminar usuarios
CREATE POLICY "users_delete_admin" ON users FOR DELETE
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- =====================================================
-- POLÍTICAS PARA TABLA: user_stats
-- =====================================================

-- Los usuarios pueden ver sus propias estadísticas
CREATE POLICY "user_stats_select_own" ON user_stats FOR SELECT
USING (auth.uid()::text = user_id);

-- Los admins pueden ver todas las estadísticas
CREATE POLICY "user_stats_select_admin" ON user_stats FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- Solo el sistema (service_role) puede actualizar estadísticas
-- No se crean políticas UPDATE para usuarios normales

-- =====================================================
-- POLÍTICAS PARA TABLA: social_media
-- =====================================================

-- Los usuarios pueden ver sus propias conexiones sociales
CREATE POLICY "social_media_select_own" ON social_media FOR SELECT
USING (auth.uid()::text = user_id);

-- Los usuarios pueden insertar sus propias conexiones
CREATE POLICY "social_media_insert_own" ON social_media FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden actualizar sus propias conexiones
CREATE POLICY "social_media_update_own" ON social_media FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Los usuarios pueden eliminar sus propias conexiones
CREATE POLICY "social_media_delete_own" ON social_media FOR DELETE
USING (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA: notifications
-- =====================================================

-- Los usuarios pueden gestionar todas sus notificaciones
CREATE POLICY "notifications_all_own" ON notifications FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA: alerts
-- =====================================================

-- Los usuarios pueden gestionar todas sus alertas
CREATE POLICY "alerts_all_own" ON alerts FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA: reports
-- =====================================================

-- Los usuarios pueden gestionar todos sus reportes
CREATE POLICY "reports_all_own" ON reports FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA TABLA: activities
-- =====================================================

-- Los usuarios solo pueden ver sus propias actividades (no modificar)
CREATE POLICY "activities_select_own" ON activities FOR SELECT
USING (auth.uid()::text = user_id);

-- Los admins pueden ver todas las actividades
CREATE POLICY "activities_select_admin" ON activities FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- =====================================================
-- POLÍTICAS PARA AMELIA IA
-- =====================================================

-- CONVERSACIONES: Los usuarios pueden gestionar sus propias conversaciones
CREATE POLICY "amelia_conversations_all_own" ON amelia_conversations FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- MENSAJES: Los usuarios pueden ver mensajes de sus conversaciones
CREATE POLICY "amelia_messages_select_own_conversation" ON amelia_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM amelia_conversations
    WHERE id = amelia_messages.conversation_id
    AND user_id = auth.uid()::text
  )
);

-- MENSAJES: Los usuarios pueden insertar mensajes en sus conversaciones
CREATE POLICY "amelia_messages_insert_own_conversation" ON amelia_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM amelia_conversations
    WHERE id = amelia_messages.conversation_id
    AND user_id = auth.uid()::text
  )
);

-- EMBEDDINGS: Los usuarios pueden ver sus propios embeddings
CREATE POLICY "amelia_embeddings_select_own" ON amelia_embeddings FOR SELECT
USING (auth.uid()::text = user_id);

-- EMBEDDINGS: Los usuarios pueden insertar sus propios embeddings
CREATE POLICY "amelia_embeddings_insert_own" ON amelia_embeddings FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA SCRAPING Y MENCIONES
-- =====================================================

-- MENCIONES: Los usuarios pueden gestionar todas sus menciones
CREATE POLICY "mentions_all_own" ON mentions FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- ANÁLISIS DE SENTIMIENTO: Los usuarios pueden ver sus análisis
CREATE POLICY "sentiment_analysis_select_own" ON sentiment_analysis FOR SELECT
USING (auth.uid()::text = user_id);

-- ALERTAS DE CRISIS: Los usuarios pueden gestionar sus alertas de crisis
CREATE POLICY "crisis_alerts_all_own" ON crisis_alerts FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- SCRAPING JOBS: Los usuarios pueden gestionar sus jobs de scraping
CREATE POLICY "scraping_jobs_all_own" ON scraping_jobs FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA ANALYTICS
-- =====================================================

-- SOCIAL METRICS HISTORY: Los usuarios pueden ver su historial de métricas
CREATE POLICY "social_metrics_history_select_own" ON social_metrics_history FOR SELECT
USING (auth.uid()::text = user_id);

-- TRENDING TOPICS: Los usuarios pueden ver sus trending topics
CREATE POLICY "trending_topics_select_own" ON trending_topics FOR SELECT
USING (auth.uid()::text = user_id);

-- TRENDING TOPICS: Los usuarios pueden insertar sus trending topics
CREATE POLICY "trending_topics_insert_own" ON trending_topics FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- COMPETITOR ANALYSIS: Los usuarios pueden gestionar análisis de competidores
CREATE POLICY "competitor_analysis_all_own" ON competitor_analysis FOR ALL
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- =====================================================
-- POLÍTICAS PARA PAGOS Y SUSCRIPCIONES
-- =====================================================

-- SUBSCRIPTIONS: Solo lectura propia, modificación por service_role
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
USING (auth.uid()::text = user_id);

-- PAYMENTS: Solo lectura propia
CREATE POLICY "payments_select_own" ON payments FOR SELECT
USING (auth.uid()::text = user_id);

-- Los admins pueden ver todos los pagos
CREATE POLICY "payments_select_admin" ON payments FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- CREDIT TRANSACTIONS: Solo lectura propia
CREATE POLICY "credit_transactions_select_own" ON credit_transactions FOR SELECT
USING (auth.uid()::text = user_id);

-- Los admins pueden ver todas las transacciones de créditos
CREATE POLICY "credit_transactions_select_admin" ON credit_transactions FOR SELECT
USING (
  (SELECT role FROM users WHERE id = auth.uid()::text) = 'admin'
);

-- =====================================================
-- FUNCIONES HELPER PARA RLS
-- =====================================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es el propietario
CREATE OR REPLACE FUNCTION is_owner(resource_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid()::text = resource_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS FINALES
-- =====================================================

-- Todas las políticas RLS han sido creadas
-- Las políticas siguen el principio de "least privilege"
-- Los usuarios solo pueden acceder a sus propios datos
-- Los admins tienen acceso completo para administración
-- Las Edge Functions usan service_role para operaciones del sistema

COMMENT ON POLICY "users_select_own" ON users IS
'Los usuarios pueden ver su propio perfil';

COMMENT ON POLICY "amelia_conversations_all_own" ON amelia_conversations IS
'Los usuarios tienen control completo sobre sus conversaciones con Amelia';

COMMENT ON POLICY "mentions_all_own" ON mentions IS
'Los usuarios pueden gestionar todas sus menciones de redes sociales';

COMMENT ON POLICY "payments_select_own" ON payments IS
'Los usuarios pueden ver su historial de pagos pero no modificarlo';
