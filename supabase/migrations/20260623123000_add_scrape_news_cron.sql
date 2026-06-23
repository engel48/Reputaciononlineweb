-- Revive el scraping de la tabla scraped_news.
--
-- Causa raíz: scraped_news solo se llenaba con POST /api/scraping/run (admin, manual);
-- no había ningún job de pg_cron que lo disparara, por eso dejó de alimentarse (~28-abr).
-- Se programa el nuevo endpoint GET /api/cron/scrape-news cada 2 horas, autenticado con
-- el mismo secreto de vault (cron_secret_key) que los demás crons.
DO $$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'scrape-news-2h';
  IF v_jobid IS NOT NULL THEN PERFORM cron.unschedule(v_jobid); END IF;
END $$;

SELECT cron.schedule(
  'scrape-news-2h',
  '0 */2 * * *',
  $cmd$
  SELECT net.http_get(
    url := 'https://reputaciononline.com.co/api/cron/scrape-news?limit=24',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret_key' LIMIT 1
      )
    ),
    timeout_milliseconds := 120000
  ) AS request_id;
  $cmd$
);
