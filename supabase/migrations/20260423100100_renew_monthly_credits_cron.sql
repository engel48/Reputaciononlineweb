-- Sistema de renovación mensual de créditos según plan.
-- Cron: 1 de cada mes a las 00:00 UTC.
--
-- Límites por plan (coincide con src/context/PlanContext.tsx):
--   free: 100, basic: 500, pro: 5000, enterprise: 50000

CREATE OR REPLACE FUNCTION public.renew_monthly_credits()
RETURNS TABLE(users_renewed integer, total_credits_issued bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER := 0;
  v_total BIGINT := 0;
BEGIN
  SELECT COUNT(*), SUM(CASE plan
    WHEN 'free' THEN 100
    WHEN 'basic' THEN 500
    WHEN 'pro' THEN 5000
    WHEN 'enterprise' THEN 50000
    ELSE 0
  END)
  INTO v_count, v_total
  FROM users
  WHERE plan IN ('free','basic','pro','enterprise');

  UPDATE users
  SET credits = CASE plan
    WHEN 'free' THEN 100
    WHEN 'basic' THEN 500
    WHEN 'pro' THEN 5000
    WHEN 'enterprise' THEN 50000
    ELSE credits
  END,
  updated_at = NOW()
  WHERE plan IN ('free','basic','pro','enterprise');

  INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, description, related_entity, created_at)
  SELECT
    gen_random_uuid(),
    id,
    'bonus',
    CASE plan
      WHEN 'free' THEN 100
      WHEN 'basic' THEN 500
      WHEN 'pro' THEN 5000
      WHEN 'enterprise' THEN 50000
    END,
    credits,
    format('Renovación mensual plan %s', plan),
    'monthly_renewal',
    NOW()
  FROM users
  WHERE plan IN ('free','basic','pro','enterprise');

  RETURN QUERY SELECT v_count, v_total;
END;
$function$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'renew-monthly-credits-1st') THEN
    PERFORM cron.unschedule('renew-monthly-credits-1st');
  END IF;
END $$;

SELECT cron.schedule(
  'renew-monthly-credits-1st',
  '0 0 1 * *',
  $job$SELECT public.renew_monthly_credits();$job$
);
