-- =====================================================
-- SCRIPT DE VALIDACIÓN DE MIGRACIONES
-- Fecha: 2025-10-29
-- Descripción: Queries para verificar que las migraciones se aplicaron correctamente
-- =====================================================

-- =====================================================
-- 1. VERIFICAR FUNCIONES DE CRÉDITOS
-- =====================================================

SELECT 'Verificando funciones de créditos...' as test;

SELECT proname, prosrc
FROM pg_proc
WHERE proname IN ('add_user_credits', 'deduct_user_credits', 'get_credit_balance', 'refund_user_credits')
ORDER BY proname;

-- Debe retornar 4 funciones


-- =====================================================
-- 2. VERIFICAR FUNCIONES DE SUSCRIPCIONES
-- =====================================================

SELECT 'Verificando funciones de suscripciones...' as test;

SELECT proname
FROM pg_proc
WHERE proname IN ('cancel_subscription', 'check_expired_subscriptions', 'get_subscription_status', 'sync_user_plan_from_subscription')
ORDER BY proname;

-- Debe retornar 4 funciones


-- =====================================================
-- 3. VERIFICAR COLUMNAS EN SUBSCRIPTIONS
-- =====================================================

SELECT 'Verificando columnas en subscriptions...' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('plan_type', 'cancel_at_period_end', 'metadata', 'updated_at')
ORDER BY column_name;

-- Debe retornar 4 columnas:
-- cancel_at_period_end | boolean
-- metadata | jsonb
-- plan_type | text
-- updated_at | timestamp with time zone


-- =====================================================
-- 4. VERIFICAR COLUMNAS EN PAYMENTS
-- =====================================================

SELECT 'Verificando columnas en payments...' as test;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name IN ('plan_type', 'credits_purchased', 'transaction_id', 'updated_at')
ORDER BY column_name;

-- Debe retornar 4 columnas:
-- credits_purchased | integer
-- plan_type | text
-- transaction_id | text
-- updated_at | timestamp with time zone


-- =====================================================
-- 5. VERIFICAR COLUMNAS EN SCRAPING_JOBS
-- =====================================================

SELECT 'Verificando columnas en scraping_jobs...' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'scraping_jobs'
  AND column_name IN ('priority', 'config', 'scheduled_at', 'worker_id', 'retry_count', 'result', 'error_message', 'updated_at')
ORDER BY column_name;

-- Debe retornar 8 columnas:
-- config | jsonb
-- error_message | text
-- priority | integer (default 5)
-- result | jsonb
-- retry_count | integer (default 0)
-- scheduled_at | timestamp with time zone
-- updated_at | timestamp with time zone
-- worker_id | text


-- =====================================================
-- 6. VERIFICAR TABLA CRISIS_ALERTS
-- =====================================================

SELECT 'Verificando tabla crisis_alerts...' as test;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'crisis_alerts'
ORDER BY ordinal_position;

-- Debe retornar todas las columnas de crisis_alerts


-- =====================================================
-- 7. VERIFICAR RLS POLICIES
-- =====================================================

SELECT 'Verificando RLS policies...' as test;

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts')
ORDER BY tablename, policyname;

-- Debe retornar policies para cada tabla


-- =====================================================
-- 8. VERIFICAR ÍNDICES CREADOS
-- =====================================================

SELECT 'Verificando índices...' as test;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Debe retornar múltiples índices por tabla


-- =====================================================
-- 9. VERIFICAR TRIGGERS
-- =====================================================

SELECT 'Verificando triggers...' as test;

SELECT
  trigger_schema,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts')
ORDER BY event_object_table, trigger_name;

-- Debe retornar triggers update_*_updated_at y trigger_sync_user_plan


-- =====================================================
-- 10. VERIFICAR CONSTRAINTS
-- =====================================================

SELECT 'Verificando constraints...' as test;

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts')
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Debe retornar CHECK constraints para status, priority, type, severity, etc.


-- =====================================================
-- 11. TEST DE FUNCIONES (OPCIONAL - USAR CON CUIDADO)
-- =====================================================

-- IMPORTANTE: Solo ejecutar estos tests en ambiente de desarrollo
-- NO ejecutar en producción sin un usuario de prueba

/*
-- Test 1: Función get_credit_balance
SELECT * FROM get_credit_balance('pon-aquí-un-user-id-real'::uuid);

-- Test 2: Función add_user_credits (con usuario de prueba)
SELECT * FROM add_user_credits(
  'pon-aquí-un-user-id-real'::uuid,
  100,
  'Test de validación de migración'
);

-- Test 3: Verificar que se insertó en credit_transactions
SELECT * FROM credit_transactions
WHERE description LIKE '%Test de validación%'
ORDER BY created_at DESC
LIMIT 1;

-- Test 4: Función deduct_user_credits
SELECT * FROM deduct_user_credits(
  'pon-aquí-un-user-id-real'::uuid,
  10,
  'Test de deducción'
);

-- Test 5: Verificar balance después de operaciones
SELECT id, email, credits, plan
FROM users
WHERE id = 'pon-aquí-un-user-id-real'::uuid;
*/


-- =====================================================
-- 12. RESUMEN DE VALIDACIÓN
-- =====================================================

SELECT 'RESUMEN DE VALIDACIÓN' as resultado;

SELECT
  'Funciones de créditos' as componente,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 4 THEN '✅ OK' ELSE '❌ FALTA' END as status
FROM pg_proc
WHERE proname IN ('add_user_credits', 'deduct_user_credits', 'get_credit_balance', 'refund_user_credits')

UNION ALL

SELECT
  'Funciones de suscripciones',
  COUNT(*),
  CASE WHEN COUNT(*) = 4 THEN '✅ OK' ELSE '❌ FALTA' END
FROM pg_proc
WHERE proname IN ('cancel_subscription', 'check_expired_subscriptions', 'get_subscription_status', 'sync_user_plan_from_subscription')

UNION ALL

SELECT
  'Columnas en subscriptions',
  COUNT(*),
  CASE WHEN COUNT(*) = 4 THEN '✅ OK' ELSE '❌ FALTA' END
FROM information_schema.columns
WHERE table_name = 'subscriptions'
  AND column_name IN ('plan_type', 'cancel_at_period_end', 'metadata', 'updated_at')

UNION ALL

SELECT
  'Columnas en payments',
  COUNT(*),
  CASE WHEN COUNT(*) = 4 THEN '✅ OK' ELSE '❌ FALTA' END
FROM information_schema.columns
WHERE table_name = 'payments'
  AND column_name IN ('plan_type', 'credits_purchased', 'transaction_id', 'updated_at')

UNION ALL

SELECT
  'Columnas en scraping_jobs',
  COUNT(*),
  CASE WHEN COUNT(*) >= 8 THEN '✅ OK' ELSE '❌ FALTA' END
FROM information_schema.columns
WHERE table_name = 'scraping_jobs'
  AND column_name IN ('priority', 'config', 'scheduled_at', 'worker_id', 'retry_count', 'result', 'error_message', 'updated_at')

UNION ALL

SELECT
  'Tabla crisis_alerts',
  COUNT(*),
  CASE WHEN COUNT(*) > 0 THEN '✅ OK' ELSE '❌ FALTA' END
FROM information_schema.tables
WHERE table_name = 'crisis_alerts'
  AND table_schema = 'public'

UNION ALL

SELECT
  'Índices en tablas',
  COUNT(*),
  CASE WHEN COUNT(*) >= 20 THEN '✅ OK' ELSE '⚠️ REVISAR' END
FROM pg_indexes
WHERE tablename IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts')
  AND schemaname = 'public'

UNION ALL

SELECT
  'Triggers created',
  COUNT(*),
  CASE WHEN COUNT(*) >= 5 THEN '✅ OK' ELSE '❌ FALTA' END
FROM information_schema.triggers
WHERE event_object_table IN ('subscriptions', 'payments', 'scraping_jobs', 'crisis_alerts');


-- =====================================================
-- FIN DE VALIDACIÓN
-- =====================================================

SELECT '✅ Script de validación completado. Revisa los resultados arriba.' as mensaje;
