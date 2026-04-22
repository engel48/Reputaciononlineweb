-- =====================================================
-- CRON JOB: Sync automático de menciones en redes sociales
-- Cada 30 minutos invoca /api/cron/sync-social-all
--
-- Los valores de URL y secret se hardcodean aquí porque los GUC
-- (app.settings.*) requieren permisos de superusuario en Supabase.
-- Cambiar el secret implica re-ejecutar esta migración.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Desprogramar si ya existía (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-social-mentions-30min') THEN
    PERFORM cron.unschedule('sync-social-mentions-30min');
  END IF;
END $$;

-- Programar: cada 30 minutos
SELECT cron.schedule(
  'sync-social-mentions-30min',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://reputaciononline.com.co/api/cron/sync-social-all',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 12345678'
    ),
    body := jsonb_build_object(
      'trigger', 'cron',
      'timestamp', now()
    )
  ) AS request_id;
  $$
);

-- =====================================================
-- Índices para acelerar la query del cron
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_social_media_connected_last_sync
  ON public.social_media (connected, last_sync)
  WHERE connected = true;

CREATE INDEX IF NOT EXISTS idx_mentions_user_platform_url
  ON public.mentions (user_id, platform, url);

CREATE INDEX IF NOT EXISTS idx_mentions_user_platform_published
  ON public.mentions (user_id, platform, published_at DESC);

-- =====================================================
-- Verificación
-- =====================================================
--   SELECT jobname, schedule, active FROM cron.job
--   WHERE jobname = 'sync-social-mentions-30min';
--
--   SELECT jobname, status, return_message, start_time
--   FROM cron.job_run_details
--   WHERE jobname = 'sync-social-mentions-30min'
--   ORDER BY start_time DESC LIMIT 5;
--
--   -- Trigger manual inmediato:
--   SELECT net.http_post(
--     url := 'https://reputaciononline.com.co/api/cron/sync-social-all',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer 12345678'
--     ),
--     body := jsonb_build_object('trigger', 'manual', 'timestamp', now())
--   );
