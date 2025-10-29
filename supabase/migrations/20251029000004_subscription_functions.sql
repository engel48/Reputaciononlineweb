-- =====================================================
-- MIGRACIÓN: Funciones auxiliares para suscripciones
-- Fecha: 2025-10-29
-- Descripción: Funciones para gestión de suscripciones y ciclo de vida
-- =====================================================

-- =====================================================
-- FUNCIÓN: cancel_subscription
-- Cancela una suscripción al final del periodo o inmediatamente
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_immediately BOOLEAN DEFAULT false
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_id UUID;
  v_current_period_end TIMESTAMPTZ;
BEGIN
  -- Obtener suscripción activa
  SELECT id, current_period_end INTO v_subscription_id, v_current_period_end
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'No active subscription found'::TEXT;
    RETURN;
  END IF;

  -- Cancelar inmediatamente o al final del periodo
  IF p_immediately THEN
    UPDATE subscriptions
    SET status = 'cancelled',
        cancelled_at = NOW(),
        cancel_at = NOW(),
        cancel_at_period_end = false,
        updated_at = NOW()
    WHERE id = v_subscription_id;

    UPDATE users
    SET plan = 'free',
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, 'Subscription cancelled immediately'::TEXT;
  ELSE
    UPDATE subscriptions
    SET cancel_at_period_end = true,
        cancel_at = v_current_period_end,
        updated_at = NOW()
    WHERE id = v_subscription_id;

    RETURN QUERY SELECT true, format('Subscription will be cancelled on %s', v_current_period_end)::TEXT;
  END IF;
END;
$$;

COMMENT ON FUNCTION cancel_subscription IS
'Cancela una suscripción inmediatamente o al final del periodo actual';

-- =====================================================
-- FUNCIÓN: check_expired_subscriptions
-- Verifica y actualiza suscripciones expiradas (ejecutar con cron)
-- =====================================================

CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE (
  expired_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Cancelar suscripciones que llegaron a cancel_at
  UPDATE subscriptions
  SET status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE status = 'active'
    AND cancel_at_period_end = true
    AND cancel_at IS NOT NULL
    AND cancel_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Actualizar usuarios a plan free
  UPDATE users u
  SET plan = 'free',
      updated_at = NOW()
  FROM subscriptions s
  WHERE u.id = s.user_id
    AND s.status = 'cancelled'
    AND u.plan != 'free';

  RETURN QUERY SELECT v_count;
END;
$$;

COMMENT ON FUNCTION check_expired_subscriptions IS
'Verifica suscripciones expiradas y actualiza usuarios a plan free. Ejecutar con pg_cron';

-- =====================================================
-- FUNCIÓN: get_subscription_status
-- Obtiene el estado de la suscripción de un usuario
-- =====================================================

CREATE OR REPLACE FUNCTION get_subscription_status(
  p_user_id UUID
)
RETURNS TABLE (
  has_subscription BOOLEAN,
  plan_type TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  will_cancel BOOLEAN,
  cancel_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status = 'active') as has_subscription,
    s.plan_type,
    s.status,
    s.current_period_end,
    s.cancel_at_period_end as will_cancel,
    s.cancel_at
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  -- Si no hay suscripción activa, retornar valores por defecto
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'free'::TEXT, 'none'::TEXT, NULL::TIMESTAMPTZ, false, NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_subscription_status IS
'Obtiene el estado actual de la suscripción de un usuario';

-- =====================================================
-- TRIGGER: Sincronizar plan de usuario con suscripción
-- =====================================================

CREATE OR REPLACE FUNCTION sync_user_plan_from_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si la suscripción se activa, actualizar plan del usuario
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    UPDATE users
    SET plan = NEW.plan_type,
        updated_at = NOW()
    WHERE id = NEW.user_id;
  -- Si la suscripción se cancela, volver a plan free
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'active' THEN
    UPDATE users
    SET plan = 'free',
        updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_sync_user_plan ON subscriptions;
CREATE TRIGGER trigger_sync_user_plan
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_user_plan_from_subscription();

COMMENT ON TRIGGER trigger_sync_user_plan ON subscriptions IS
'Sincroniza el plan del usuario cuando cambia el estado de la suscripción';

-- =====================================================
-- GRANTS DE SEGURIDAD
-- =====================================================

REVOKE ALL ON FUNCTION cancel_subscription FROM PUBLIC;
REVOKE ALL ON FUNCTION check_expired_subscriptions FROM PUBLIC;
REVOKE ALL ON FUNCTION get_subscription_status FROM PUBLIC;

GRANT EXECUTE ON FUNCTION cancel_subscription TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_expired_subscriptions TO service_role;
GRANT EXECUTE ON FUNCTION get_subscription_status TO authenticated, service_role;
