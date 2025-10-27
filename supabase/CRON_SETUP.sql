-- =====================================================
-- PG_CRON CONFIGURATION
-- Scraping Scheduler Automation
-- Reputación Online - Supabase
-- =====================================================

-- Habilitar extensión pg_cron (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- CRON JOB: Scraping Scheduler (cada 15 minutos)
-- =====================================================

-- Eliminar job existente si existe (para reconfiguración)
SELECT cron.unschedule('scraping-scheduler-15min');

-- Programar ejecución del scraping scheduler cada 15 minutos
SELECT cron.schedule(
  'scraping-scheduler-15min',  -- Nombre del job
  '*/15 * * * *',               -- Cron expression: cada 15 minutos
  $$
  SELECT
    net.http_post(
        url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body:=jsonb_build_object(
          'trigger', 'cron',
          'timestamp', now()
        )
    ) AS request_id;
  $$
);

-- =====================================================
-- CRON JOB ADICIONAL: Cleanup de datos antiguos (diario)
-- =====================================================

-- Eliminar job existente si existe
SELECT cron.unschedule('daily-cleanup');

-- Programar limpieza diaria a las 3:00 AM (hora Colombia UTC-5)
SELECT cron.schedule(
  'daily-cleanup',
  '0 8 * * *',  -- 8:00 UTC = 3:00 AM Colombia
  $$
  -- Eliminar notificaciones leídas de más de 30 días
  DELETE FROM notifications
  WHERE is_read = true
  AND created_at < NOW() - INTERVAL '30 days';

  -- Eliminar actividades de más de 90 días (excepto login y payment)
  DELETE FROM activities
  WHERE action NOT IN ('login', 'payment')
  AND created_at < NOW() - INTERVAL '90 days';

  -- Actualizar estadísticas de limpieza
  INSERT INTO activities (user_id, action, description, metadata)
  VALUES (
    '00000000-0000-0000-0000-000000000000',  -- System user
    'system_cleanup',
    'Limpieza automática de datos antiguos ejecutada',
    jsonb_build_object(
      'timestamp', now(),
      'trigger', 'cron'
    )
  );
  $$
);

-- =====================================================
-- CRON JOB: Refresh de tokens OAuth (cada 30 minutos)
-- =====================================================

-- Eliminar job existente si existe
SELECT cron.unschedule('refresh-oauth-tokens-30min');

-- Programar refresh de tokens OAuth cada 30 minutos
SELECT cron.schedule(
  'refresh-oauth-tokens-30min',
  '*/30 * * * *',  -- Cada 30 minutos
  $$
  SELECT
    net.http_post(
        url:='https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/refresh-oauth-tokens',
        headers:=jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body:=jsonb_build_object(
          'trigger', 'cron',
          'timestamp', now()
        )
    ) AS request_id;
  $$
);

-- =====================================================
-- CRON JOB: Recálculo de estadísticas (cada hora)
-- =====================================================

-- Eliminar job existente si existe
SELECT cron.unschedule('hourly-stats-recalculation');

-- Programar recálculo de estadísticas cada hora
SELECT cron.schedule(
  'hourly-stats-recalculation',
  '0 * * * *',  -- Cada hora en punto
  $$
  -- Actualizar user_stats basado en datos reales
  -- (Esto se ejecutará cuando tengamos la tabla mentions)
  UPDATE user_stats
  SET last_calculated = NOW(),
      updated_at = NOW()
  WHERE user_id IN (
    SELECT DISTINCT user_id
    FROM notifications
    WHERE created_at > NOW() - INTERVAL '1 hour'
  );
  $$
);

-- =====================================================
-- VERIFICACIÓN Y MONITOREO DE CRON JOBS
-- =====================================================

-- Ver todos los jobs programados
SELECT * FROM cron.job ORDER BY jobname;

-- Ver historial de ejecución (últimos 10)
SELECT
  jobid,
  jobname,
  status,
  return_message,
  start_time,
  end_time,
  end_time - start_time AS duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Ver próximas ejecuciones programadas
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename,
  command
FROM cron.job
WHERE active = true
ORDER BY jobname;

-- =====================================================
-- FUNCIONES HELPER PARA MONITOREO
-- =====================================================

-- Función para verificar estado de cron jobs
CREATE OR REPLACE FUNCTION check_cron_health()
RETURNS TABLE (
  job_name TEXT,
  is_active BOOLEAN,
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  next_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobname::TEXT,
    j.active,
    MAX(r.start_time) as last_run,
    (
      SELECT status::TEXT
      FROM cron.job_run_details
      WHERE jobid = j.jobid
      ORDER BY start_time DESC
      LIMIT 1
    ) as last_status,
    CASE
      WHEN j.schedule = '*/15 * * * *' THEN
        (SELECT MAX(start_time) + INTERVAL '15 minutes' FROM cron.job_run_details WHERE jobid = j.jobid)
      WHEN j.schedule = '0 * * * *' THEN
        (SELECT MAX(start_time) + INTERVAL '1 hour' FROM cron.job_run_details WHERE jobid = j.jobid)
      WHEN j.schedule = '0 8 * * *' THEN
        (SELECT MAX(start_time) + INTERVAL '1 day' FROM cron.job_run_details WHERE jobid = j.jobid)
      ELSE NULL
    END as next_run
  FROM cron.job j
  LEFT JOIN cron.job_run_details r ON j.jobid = r.jobid
  WHERE j.active = true
  GROUP BY j.jobid, j.jobname, j.active, j.schedule;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMANDOS DE GESTIÓN MANUAL
-- =====================================================

-- Para pausar un job:
-- SELECT cron.alter_job('scraping-scheduler-15min', schedule:=NULL);

-- Para reanudar un job:
-- SELECT cron.alter_job('scraping-scheduler-15min', schedule:='*/15 * * * *');

-- Para ejecutar un job manualmente (ahora):
-- SELECT cron.schedule('manual-scraping-run', '* * * * *', $$SELECT net.http_post(...)$$);
-- SELECT cron.unschedule('manual-scraping-run');

-- Para eliminar un job permanentemente:
-- SELECT cron.unschedule('job-name');

-- =====================================================
-- CONFIGURACIÓN DE NOTIFICACIONES DE FALLOS
-- =====================================================

-- Crear tabla para tracking de fallos de cron
CREATE TABLE IF NOT EXISTS cron_job_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  error_message TEXT,
  failed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retry_count INTEGER DEFAULT 0
);

-- Trigger para registrar fallos (implementar en el futuro)
-- Se puede usar para enviar notificaciones a admins cuando un cron job falla

-- =====================================================
-- COMENTARIOS Y NOTAS
-- =====================================================

COMMENT ON EXTENSION pg_cron IS
'Extensión para programar jobs periódicos en PostgreSQL';

-- Notas importantes:
-- 1. Los cron jobs se ejecutan en la zona horaria del servidor (UTC por defecto)
-- 2. Para hora de Colombia (UTC-5), sumar 5 horas a la hora deseada
-- 3. El scraping scheduler llamará a la Edge Function cada 15 minutos
-- 4. La limpieza diaria ayuda a mantener la base de datos optimizada
-- 5. Las estadísticas se recalculan cada hora para mantener datos actualizados

-- Formato de cron expressions:
-- ┌───────────── minuto (0 - 59)
-- │ ┌───────────── hora (0 - 23)
-- │ │ ┌───────────── día del mes (1 - 31)
-- │ │ │ ┌───────────── mes (1 - 12)
-- │ │ │ │ ┌───────────── día de la semana (0 - 6) (Domingo a Sábado)
-- │ │ │ │ │
-- * * * * *

-- Ejemplos:
-- */15 * * * *    = Cada 15 minutos
-- 0 * * * *       = Cada hora en punto
-- 0 8 * * *       = Todos los días a las 8:00 UTC (3:00 AM Colombia)
-- 0 0 * * 0       = Cada domingo a medianoche
-- 0 2 1 * *       = Primer día de cada mes a las 2:00 AM

-- =====================================================
-- FIN DE CONFIGURACIÓN
-- =====================================================

-- Verificar configuración final
SELECT 'Cron jobs configurados exitosamente' AS status;
SELECT check_cron_health();
