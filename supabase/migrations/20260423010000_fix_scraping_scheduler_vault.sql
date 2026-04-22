-- =====================================================
-- FIX: cron scraping-scheduler-15min usa Supabase Vault
-- =====================================================
--
-- Problema: el cron original usaba current_setting('app.supabase_service_role_key', true)
-- que retorna NULL porque ALTER DATABASE requiere permisos de superusuario.
-- Resultado: el cron enviaba "Bearer " (vacío) y la Edge Function rechazaba con 401.
--
-- Solución: guardar el service_role_key en Supabase Vault y leerlo al ejecutar.
-- Vault cifra el valor y requiere privilegios para leer los secretos descifrados.
--
-- Requisito previo (one-off, NO en esta migración por seguridad):
--   SELECT vault.create_secret(
--     '<SUPABASE_SERVICE_ROLE_KEY>',
--     'scraping_scheduler_service_role_key',
--     'Service role key usado por el cron scraping-scheduler-15min'
--   );
-- Esta migración asume que el secret ya existe.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scraping-scheduler-15min') THEN
    PERFORM cron.unschedule('scraping-scheduler-15min');
  END IF;
END $$;

SELECT cron.schedule(
  'scraping-scheduler-15min',
  '*/15 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://shiqwhbodviimvpxpszd.supabase.co/functions/v1/scraping-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'scraping_scheduler_service_role_key'
        LIMIT 1
      )
    ),
    body := jsonb_build_object(
      'trigger', 'cron',
      'timestamp', now()
    )
  ) AS request_id;
  $job$
);

-- Verificación:
--   SELECT jobname, schedule, active FROM cron.job WHERE jobname='scraping-scheduler-15min';
--   SELECT j.jobname, r.status, r.return_message, r.start_time
--   FROM cron.job_run_details r JOIN cron.job j ON j.jobid=r.jobid
--   WHERE j.jobname='scraping-scheduler-15min' ORDER BY r.start_time DESC LIMIT 3;
