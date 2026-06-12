-- Endurece el cron de refresco de tokens: el error historico era
-- "Failed to connect ... after ~1000ms: Timeout was reached" (timeout de
-- CONEXION TCP/TLS demasiado bajo ante lentitud transitoria del servidor).
-- Se fija un connect-timeout de 10s y total de 30s, y se agrega un reintento
-- con backoff breve. Mantiene SECURITY DEFINER, search_path y lectura de
-- secret desde Vault (sin fallback hardcoded).
CREATE OR REPLACE FUNCTION public.trigger_token_refresh()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  response_status integer;
  response_body text;
  api_url text;
  cron_secret text;
  attempt integer := 0;
  max_attempts integer := 2;
  ok boolean := false;
BEGIN
  -- URL del endpoint (no es secreto, OK con default explicito)
  api_url := COALESCE(
    current_setting('app.api_url', true),
    'https://reputaciononline.com.co/api/cron/refresh-tokens'
  );

  -- Leer secret desde Vault (NO usar fallback hardcoded)
  SELECT decrypted_secret INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'cron_secret_key'
  LIMIT 1;

  IF cron_secret IS NULL OR length(trim(cron_secret)) = 0 THEN
    INSERT INTO system_logs (event_type, details, created_at)
    VALUES (
      'cron_token_refresh_misconfigured',
      jsonb_build_object(
        'error', 'cron_secret_key no encontrado en vault.decrypted_secrets',
        'fix', 'Crear el secret en Supabase Dashboard > Settings > Vault con el mismo valor que CRON_SECRET_KEY de Coolify',
        'timestamp', NOW()
      ),
      NOW()
    );
    RAISE WARNING 'Token refresh aborted: cron_secret_key missing in Vault';
    RETURN;
  END IF;

  -- Timeouts explicitos: tolerar lentitud transitoria de conexion (antes ~1s).
  PERFORM http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '10000');
  PERFORM http_set_curlopt('CURLOPT_TIMEOUT_MS', '30000');

  -- Reintento con backoff breve ante fallos transitorios de red.
  WHILE attempt < max_attempts AND NOT ok LOOP
    attempt := attempt + 1;
    BEGIN
      SELECT status, content INTO response_status, response_body
      FROM http((
        'POST',
        api_url,
        ARRAY[
          http_header('Authorization', 'Bearer ' || cron_secret),
          http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{}'
      )::http_request);

      ok := true;

      INSERT INTO system_logs (event_type, details, created_at)
      VALUES (
        'cron_token_refresh',
        jsonb_build_object(
          'status', response_status,
          'response', substring(response_body, 1, 500),
          'attempt', attempt,
          'timestamp', NOW()
        ),
        NOW()
      );
    EXCEPTION
      WHEN OTHERS THEN
        IF attempt >= max_attempts THEN
          INSERT INTO system_logs (event_type, details, created_at)
          VALUES (
            'cron_token_refresh_error',
            jsonb_build_object('error', SQLERRM, 'attempts', attempt, 'timestamp', NOW()),
            NOW()
          );
          RAISE WARNING 'Error en cron de token refresh tras % intentos: %', attempt, SQLERRM;
        ELSE
          PERFORM pg_sleep(3); -- backoff antes de reintentar
        END IF;
    END;
  END LOOP;

  -- Limpiar opciones de curl para no afectar otras llamadas en la sesion.
  PERFORM http_reset_curlopt();
END;
$function$;
