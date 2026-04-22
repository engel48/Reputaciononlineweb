-- Permite múltiples cuentas por red para usuarios enterprise.
-- Cambia UNIQUE (user_id, platform) → UNIQUE (user_id, platform, username).
-- Los demás planes quedan limitados por el check de maxSocialAccounts
-- a nivel de aplicación (ver src/lib/plan-limits.ts).

UPDATE public.social_media
SET username = COALESCE(username, 'legacy-' || id::text)
WHERE username IS NULL OR username = '';

ALTER TABLE public.social_media
  DROP CONSTRAINT IF EXISTS social_media_user_id_platform_key;

ALTER TABLE public.social_media
  ADD CONSTRAINT social_media_user_id_platform_username_key
  UNIQUE (user_id, platform, username);

CREATE INDEX IF NOT EXISTS idx_social_media_user_platform
  ON public.social_media (user_id, platform);
