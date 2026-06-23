-- Endurece las funciones SECURITY DEFINER: revoca EXECUTE de PUBLIC/anon/authenticated
-- y lo concede solo a service_role.
--
-- Motivo: el advisor de Supabase marcaba 28 funciones SECURITY DEFINER ejecutables por
-- anon/authenticated (incl. add_user_credits, deduct_user_credits, save_oauth_connection,
-- y lecturas con p_user_id propensas a IDOR). La app las invoca SIEMPRE server-side con la
-- service role key, y pg_cron corre como owner, así que revocar a anon/authenticated no
-- afecta a la app.
--
-- Se EXCLUYEN is_admin() e is_owner(uuid): las políticas RLS las invocan en el contexto del
-- rol 'authenticated', por lo que deben conservar EXECUTE o se rompería RLS.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname NOT IN ('is_admin', 'is_owner')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', fn.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', fn.sig);
  END LOOP;
END $$;
