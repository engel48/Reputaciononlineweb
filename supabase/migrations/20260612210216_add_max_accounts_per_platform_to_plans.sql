-- Multi-cuenta por red social: cuantas cuentas de la MISMA red puede conectar
-- un usuario segun su plan. Antes solo existia el booleano
-- multi_account_per_platform (todo-o-nada). Ahora es un numero por red.
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS max_accounts_per_platform integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.plans.max_accounts_per_platform IS
  'Maximo de cuentas conectadas por cada red social (ej: Pro = 3 cuentas de Facebook, 3 de X, etc.)';

-- Valores por plan. max_social_accounts = tope TOTAL coherente con
-- (max_accounts_per_platform x redes soportadas: facebook, instagram, x, youtube).
UPDATE public.plans SET max_accounts_per_platform = 1,  max_social_accounts = 1  WHERE code = 'free';
UPDATE public.plans SET max_accounts_per_platform = 1,  max_social_accounts = 3  WHERE code = 'basic';
UPDATE public.plans SET max_accounts_per_platform = 3,  max_social_accounts = 12, multi_account_per_platform = true WHERE code = 'pro';
UPDATE public.plans SET max_accounts_per_platform = 5,  max_social_accounts = 20, multi_account_per_platform = true WHERE code = 'enterprise';
