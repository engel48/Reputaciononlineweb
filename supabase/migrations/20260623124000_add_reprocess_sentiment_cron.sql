-- Reproceso automático de sentimiento pendiente (Groq) desde el servidor.
--
-- Las menciones cuyo análisis Groq falló quedan con sentiment=null ("solo Groq, pendiente
-- si falla"). Este cron llama a GET /api/cron/reprocess-sentiment cada 30 min para drenar
-- el backlog de news_mentions/mentions y auto-curar futuras pendientes. Se ejecuta del lado
-- del servidor (Coolify), donde Groq es alcanzable.
DO $$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'reprocess-sentiment-30min';
  IF v_jobid IS NOT NULL THEN PERFORM cron.unschedule(v_jobid); END IF;
END $$;

SELECT cron.schedule(
  'reprocess-sentiment-30min',
  '*/30 * * * *',
  $cmd$
  SELECT net.http_get(
    url := 'https://reputaciononline.com.co/api/cron/reprocess-sentiment?limit=50',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret_key' LIMIT 1
      )
    ),
    timeout_milliseconds := 120000
  ) AS request_id;
  $cmd$
);
