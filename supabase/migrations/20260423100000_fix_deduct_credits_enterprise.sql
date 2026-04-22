-- Actualiza deduct_user_credits para que TODOS los planes descuenten normal.
-- Antes: plan 'politico' era ilimitado (early-return). Como el user decidió
-- que enterprise tiene tope de 50000 créditos mensuales con renovación,
-- ningún plan es "ilimitado" — todos descuentan y todos reciben renovación.

CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL::text,
  p_related_entity text DEFAULT NULL::text,
  p_related_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(success boolean, new_balance integer, transaction_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  SELECT credits INTO v_current_balance
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: % < %', v_current_balance, p_amount;
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE users
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (
    id, user_id, type, amount, balance_after,
    description, related_entity, related_id, created_at
  )
  VALUES (
    gen_random_uuid(), p_user_id, 'usage', -p_amount, v_new_balance,
    COALESCE(p_description, format('Deducción de %s créditos', p_amount)),
    p_related_entity, p_related_id, NOW()
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT true, v_new_balance, v_transaction_id;
END;
$function$;
