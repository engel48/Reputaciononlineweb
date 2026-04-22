-- One-shot: normalizar créditos de los 11 users existentes al límite de su plan.
-- Autorizado explícitamente por el usuario (basic=500, pro=5000, enterprise=50k).

SELECT * FROM public.renew_monthly_credits();
