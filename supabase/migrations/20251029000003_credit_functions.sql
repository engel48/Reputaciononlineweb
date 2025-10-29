-- =====================================================
-- MIGRACIÓN: Funciones de gestión de créditos
-- Fecha: 2025-10-29
-- Descripción: Funciones CRÍTICAS requeridas por payment-webhook y credit-manager
-- =====================================================

-- =====================================================
-- ELIMINAR FUNCIONES EXISTENTES (si tienen firmas diferentes)
-- =====================================================

DROP FUNCTION IF EXISTS add_user_credits(UUID, INTEGER, TEXT);
DROP FUNCTION IF EXISTS deduct_user_credits(UUID, INTEGER, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS get_credit_balance(UUID);
DROP FUNCTION IF EXISTS refund_user_credits(UUID, INTEGER, TEXT, UUID);

-- =====================================================
-- FUNCIÓN: add_user_credits
-- Agrega créditos a un usuario y registra la transacción
-- =====================================================

CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_user_plan TEXT;
BEGIN
  -- Validar amount positivo
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Obtener balance actual y plan
  SELECT credits, plan INTO v_current_balance, v_user_plan
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Plan político tiene créditos ilimitados, no se agregan
  IF v_user_plan = 'politico' THEN
    RETURN QUERY SELECT true, -1, NULL::UUID;
    RETURN;
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance + p_amount;

  -- Actualizar balance del usuario
  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO credit_transactions (
    id,
    user_id,
    type,
    amount,
    balance_after,
    description,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'purchase',
    p_amount,
    v_new_balance,
    COALESCE(p_description, format('Adición de %s créditos', p_amount)),
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN QUERY SELECT true, v_new_balance, v_transaction_id;
END;
$$;

COMMENT ON FUNCTION add_user_credits IS
'Agrega créditos a un usuario y registra la transacción. Plan político retorna -1 (ilimitado)';

-- =====================================================
-- FUNCIÓN: deduct_user_credits
-- Deduce créditos de un usuario y registra la transacción
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_related_entity TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_user_plan TEXT;
BEGIN
  -- Validar amount positivo
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Obtener balance actual y plan
  SELECT credits, plan INTO v_current_balance, v_user_plan
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Plan político tiene créditos ilimitados, no se deducen
  IF v_user_plan = 'politico' THEN
    RETURN QUERY SELECT true, -1, NULL::UUID;
    RETURN;
  END IF;

  -- Verificar balance suficiente
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % < %', v_current_balance, p_amount;
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance - p_amount;

  -- Actualizar balance del usuario
  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO credit_transactions (
    id,
    user_id,
    type,
    amount,
    balance_after,
    description,
    related_entity,
    related_id,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'usage',
    -p_amount, -- negativo para indicar deducción
    v_new_balance,
    COALESCE(p_description, format('Deducción de %s créditos', p_amount)),
    p_related_entity,
    p_related_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN QUERY SELECT true, v_new_balance, v_transaction_id;
END;
$$;

COMMENT ON FUNCTION deduct_user_credits IS
'Deduce créditos de un usuario y registra la transacción. Plan político retorna -1 (ilimitado). Lanza excepción si no hay créditos suficientes';

-- =====================================================
-- FUNCIÓN: get_credit_balance
-- Obtiene el balance actual de créditos
-- =====================================================

CREATE OR REPLACE FUNCTION get_credit_balance(
  p_user_id UUID
)
RETURNS TABLE (
  balance INTEGER,
  plan TEXT,
  unlimited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE WHEN u.plan = 'politico' THEN -1 ELSE u.credits END as balance,
    u.plan,
    (u.plan = 'politico') as unlimited
  FROM users u
  WHERE u.id = p_user_id;
END;
$$;

COMMENT ON FUNCTION get_credit_balance IS
'Obtiene el balance de créditos del usuario. Retorna -1 para plan político (ilimitado)';

-- =====================================================
-- FUNCIÓN: refund_user_credits
-- Reembolsa créditos a un usuario
-- =====================================================

CREATE OR REPLACE FUNCTION refund_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_original_transaction_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
  v_user_plan TEXT;
BEGIN
  -- Validar amount positivo
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Obtener balance actual y plan
  SELECT credits, plan INTO v_current_balance, v_user_plan
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  -- Plan político no necesita reembolsos
  IF v_user_plan = 'politico' THEN
    RETURN QUERY SELECT true, -1, NULL::UUID;
    RETURN;
  END IF;

  -- Calcular nuevo balance
  v_new_balance := v_current_balance + p_amount;

  -- Actualizar balance del usuario
  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Registrar transacción
  INSERT INTO credit_transactions (
    id,
    user_id,
    type,
    amount,
    balance_after,
    description,
    related_id,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    p_user_id,
    'refund',
    p_amount,
    v_new_balance,
    COALESCE(p_description, format('Reembolso de %s créditos', p_amount)),
    p_original_transaction_id,
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  -- Retornar resultado
  RETURN QUERY SELECT true, v_new_balance, v_transaction_id;
END;
$$;

COMMENT ON FUNCTION refund_user_credits IS
'Reembolsa créditos a un usuario. Puede referenciar la transacción original';

-- =====================================================
-- GRANTS DE SEGURIDAD
-- =====================================================

-- Solo service_role y authenticated pueden ejecutar estas funciones
REVOKE ALL ON FUNCTION add_user_credits FROM PUBLIC;
REVOKE ALL ON FUNCTION deduct_user_credits FROM PUBLIC;
REVOKE ALL ON FUNCTION get_credit_balance FROM PUBLIC;
REVOKE ALL ON FUNCTION refund_user_credits FROM PUBLIC;

GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION deduct_user_credits TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_credit_balance TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_user_credits TO authenticated, service_role;
