-- Tablas para la gestión de la app móvil desde el portal de super-admin:
--   * app_devices    — tokens FCM por dispositivo (push + base de analíticas)
--   * app_config     — singleton de versión/mantenimiento/feature-flags/anuncios
--   * push_campaigns — log de envíos push (segmento, título, cuerpo, conteos)
--   * app_sessions   — sesiones de uso (analíticas)
--
-- Seguridad (alineada con el hardening 20260623120000): RLS habilitado SIN políticas
-- para anon/authenticated. Todo el acceso es server-side con la service role key
-- (que bypassa RLS). Se revoca acceso a anon/authenticated explícitamente.

-- ============================================================================
-- app_devices
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_devices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.users(id) ON DELETE CASCADE,
  fcm_token     TEXT NOT NULL UNIQUE,
  platform      TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
  app_version   TEXT,
  device_model  TEXT,
  locale        TEXT,
  last_seen     TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_devices_user ON public.app_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_app_devices_platform ON public.app_devices(platform);
CREATE INDEX IF NOT EXISTS idx_app_devices_last_seen ON public.app_devices(last_seen DESC);

-- ============================================================================
-- app_config (singleton: una sola fila, id = 1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_config (
  id                     INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  min_supported_version  TEXT NOT NULL DEFAULT '1.0.0',
  latest_version         TEXT NOT NULL DEFAULT '1.0.0',
  force_update           BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message    TEXT DEFAULT 'Estamos haciendo mejoras. Volvemos en breve.',
  update_url_android     TEXT DEFAULT '',
  update_url_ios         TEXT DEFAULT '',
  feature_flags          JSONB NOT NULL DEFAULT '{}'::JSONB,
  announcements          JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_by             UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Fila singleton por defecto
INSERT INTO public.app_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- push_campaigns (log de envíos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.push_campaigns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  segment      TEXT NOT NULL DEFAULT 'all',
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB NOT NULL DEFAULT '{}'::JSONB,
  sent_count   INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_campaigns_created ON public.push_campaigns(created_at DESC);

-- ============================================================================
-- app_sessions (analíticas de uso)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  platform     TEXT,
  app_version  TEXT,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_sessions_user ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_started ON public.app_sessions(started_at DESC);

-- ============================================================================
-- RLS: habilitado sin políticas. Solo service_role (que bypassa RLS) accede.
-- ============================================================================
ALTER TABLE public.app_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions   ENABLE ROW LEVEL SECURITY;

-- Revocar de anon/authenticated y conceder a service_role
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['app_devices', 'app_config', 'push_campaigns', 'app_sessions']
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role;', t);
  END LOOP;
END $$;
