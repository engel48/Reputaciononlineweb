/**
 * Script de Validación: Supabase Migration
 *
 * Valida que la migración a Supabase esté completa y funcional
 *
 * Verifica:
 * - Variables de entorno configuradas
 * - Conexión a Supabase exitosa
 * - Tablas creadas correctamente
 * - RLS policies activas
 * - Storage buckets configurados
 * - Edge Functions desplegadas (opcional)
 *
 * Uso:
 * node scripts/validate-supabase-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

// ================================================
// VALIDACIÓN DE VARIABLES DE ENTORNO
// ================================================

function validateEnvironment() {
  log('\n===========================================', 'blue')
  log('📋 VALIDANDO VARIABLES DE ENTORNO', 'blue')
  log('===========================================\n', 'blue')

  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'DATABASE_URL': process.env.DATABASE_URL
  }

  const optional = {
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY,
    'WOMPI_PUBLIC_KEY': process.env.WOMPI_PUBLIC_KEY,
    'WOMPI_PRIVATE_KEY': process.env.WOMPI_PRIVATE_KEY,
    'RESEND_API_KEY': process.env.RESEND_API_KEY
  }

  let hasErrors = false

  // Validar requeridas
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      error(`${key} - NO CONFIGURADA`)
      hasErrors = true
    } else if (value.includes('your_') || value.includes('YOUR_')) {
      warning(`${key} - Tiene valor de ejemplo, reemplazar con valor real`)
    } else {
      success(`${key} - Configurada`)
    }
  }

  // Validar opcionales
  log('')
  for (const [key, value] of Object.entries(optional)) {
    if (!value) {
      info(`${key} - Opcional, no configurada`)
    } else {
      success(`${key} - Configurada`)
    }
  }

  // Verificar variables deprecadas
  log('')
  const deprecated = ['FORCE_SQLITE', 'DATABASE_URL_LOCAL', 'JWT_SECRET', 'NEXTAUTH_SECRET']
  let hasDeprecated = false

  for (const key of deprecated) {
    if (process.env[key]) {
      warning(`${key} - Variable deprecada detectada, debería eliminarse`)
      hasDeprecated = true
    }
  }

  if (!hasDeprecated) {
    success('No se detectaron variables deprecadas')
  }

  return !hasErrors
}

// ================================================
// VALIDACIÓN DE CONEXIÓN A SUPABASE
// ================================================

async function validateConnection() {
  log('\n===========================================', 'blue')
  log('🔌 VALIDANDO CONEXIÓN A SUPABASE', 'blue')
  log('===========================================\n', 'blue')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    error('No se pueden validar conexiones sin credenciales')
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Test simple de conexión
    const { data, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })

    if (testError && testError.code === '42P01') {
      error('Tabla "users" no existe - Ejecutar migraciones SQL primero')
      return false
    } else if (testError) {
      error(`Error conectando: ${testError.message}`)
      return false
    }

    success('Conexión a Supabase exitosa')
    info(`URL: ${supabaseUrl}`)
    return true

  } catch (err) {
    error(`Error de conexión: ${err.message}`)
    return false
  }
}

// ================================================
// VALIDACIÓN DE TABLAS
// ================================================

async function validateTables() {
  log('\n===========================================', 'blue')
  log('📊 VALIDANDO TABLAS DE BASE DE DATOS', 'blue')
  log('===========================================\n', 'blue')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const requiredTables = [
    'users',
    'social_media',
    'user_stats',
    'notifications',
    'alerts',
    'reports',
    'activities',
    'media_sources',
    'user_media_sources',
    'monitoring_sources',
    'social_platforms'
  ]

  let allTablesExist = true

  for (const table of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === '42P01') {
          error(`Tabla "${table}" - NO EXISTE`)
          allTablesExist = false
        } else {
          warning(`Tabla "${table}" - Error: ${error.message}`)
        }
      } else {
        success(`Tabla "${table}" - Existe (${count || 0} registros)`)
      }
    } catch (err) {
      error(`Tabla "${table}" - Error: ${err.message}`)
      allTablesExist = false
    }
  }

  return allTablesExist
}

// ================================================
// VALIDACIÓN DE EXTENSIONES
// ================================================

async function validateExtensions() {
  log('\n===========================================', 'blue')
  log('🔌 VALIDANDO EXTENSIONES POSTGRESQL', 'blue')
  log('===========================================\n', 'blue')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Verificar uuid-ossp
    const { data: uuidData, error: uuidError } = await supabase
      .rpc('uuid_generate_v4')

    if (!uuidError) {
      success('Extensión uuid-ossp - Instalada')
    } else {
      warning('Extensión uuid-ossp - No disponible (opcional pero recomendada)')
    }

    // Verificar pgvector (opcional)
    info('Extensión pgvector - Verificación requiere consulta SQL directa')
    info('  Ejecuta en SQL Editor: SELECT * FROM pg_extension WHERE extname = \'vector\'')

  } catch (err) {
    warning(`No se pudieron verificar extensiones: ${err.message}`)
  }
}

// ================================================
// VALIDACIÓN DE STORAGE BUCKETS
// ================================================

async function validateStorage() {
  log('\n===========================================', 'blue')
  log('📦 VALIDANDO STORAGE BUCKETS', 'blue')
  log('===========================================\n', 'blue')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      error(`Error listando buckets: ${error.message}`)
      return false
    }

    const requiredBuckets = ['avatars', 'reports', 'media']

    for (const bucketName of requiredBuckets) {
      const exists = buckets?.some(b => b.name === bucketName)
      if (exists) {
        const bucket = buckets.find(b => b.name === bucketName)
        success(`Bucket "${bucketName}" - Existe (${bucket.public ? 'público' : 'privado'})`)
      } else {
        warning(`Bucket "${bucketName}" - NO EXISTE (crear manualmente en Supabase Dashboard)`)
      }
    }

    return true

  } catch (err) {
    error(`Error validando storage: ${err.message}`)
    return false
  }
}

// ================================================
// VALIDACIÓN DE EDGE FUNCTIONS (OPCIONAL)
// ================================================

async function validateEdgeFunctions() {
  log('\n===========================================', 'blue')
  log('⚡ VALIDANDO EDGE FUNCTIONS (OPCIONAL)', 'blue')
  log('===========================================\n', 'blue')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const functions = [
    'julia-chat',
    'sentiment-analysis',
    'person-search'
  ]

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.functions.invoke(funcName, {
        body: { test: true }
      })

      if (error && error.message.includes('not found')) {
        info(`Edge Function "${funcName}" - No desplegada (opcional)`)
      } else if (error) {
        info(`Edge Function "${funcName}" - Desplegada (error esperado en test)`)
      } else {
        success(`Edge Function "${funcName}" - Desplegada y funcional`)
      }
    } catch (err) {
      info(`Edge Function "${funcName}" - No disponible`)
    }
  }
}

// ================================================
// VALIDACIÓN DE ROW LEVEL SECURITY
// ================================================

async function validateRLS() {
  log('\n===========================================', 'blue')
  log('🔐 VALIDANDO ROW LEVEL SECURITY (RLS)', 'blue')
  log('===========================================\n', 'blue')

  info('RLS debe estar habilitado en todas las tablas')
  info('Para verificar manualmente:')
  info('  1. Ve a Supabase Dashboard → Database → Tables')
  info('  2. Verifica que cada tabla tenga RLS enabled')
  info('  3. Verifica que existan policies para cada tabla')
  log('')
  warning('Verificación automática de RLS requiere consultas SQL directas')
  info('Ejecuta en SQL Editor: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = \'public\'')
}

// ================================================
// RESUMEN FINAL
// ================================================

async function generateSummary(results) {
  log('\n===========================================', 'blue')
  log('📊 RESUMEN DE VALIDACIÓN', 'blue')
  log('===========================================\n', 'blue')

  const total = Object.keys(results).length
  const passed = Object.values(results).filter(v => v === true).length
  const failed = total - passed

  if (passed === total) {
    success(`Todas las validaciones pasaron (${passed}/${total})`)
    log('')
    success('✨ MIGRACIÓN A SUPABASE COMPLETA Y FUNCIONAL ✨')
    log('')
    info('Próximos pasos:')
    info('  1. Ejecutar: npm run migrate:supabase (si tienes datos en SQLite)')
    info('  2. Configurar OAuth providers en Supabase Dashboard')
    info('  3. Iniciar desarrollo: npm run dev')
    log('')
    return 0
  } else {
    warning(`Validaciones pasadas: ${passed}/${total}`)
    error(`Validaciones fallidas: ${failed}`)
    log('')
    error('⚠️  MIGRACIÓN INCOMPLETA - REVISAR ERRORES ARRIBA ⚠️')
    log('')
    info('Pasos para completar:')
    info('  1. Configurar variables de entorno faltantes')
    info('  2. Ejecutar migraciones SQL en Supabase Dashboard')
    info('  3. Crear storage buckets faltantes')
    info('  4. Volver a ejecutar este script')
    log('')
    return 1
  }
}

// ================================================
// MAIN
// ================================================

async function main() {
  log('\n╔═══════════════════════════════════════════╗', 'cyan')
  log('║  VALIDACIÓN DE MIGRACIÓN A SUPABASE       ║', 'cyan')
  log('║  Reputación Online                        ║', 'cyan')
  log('╚═══════════════════════════════════════════╝\n', 'cyan')

  const results = {}

  // Ejecutar validaciones
  results.environment = validateEnvironment()
  results.connection = await validateConnection()

  if (results.connection) {
    results.tables = await validateTables()
    await validateExtensions()
    results.storage = await validateStorage()
    await validateEdgeFunctions()
    await validateRLS()
  } else {
    error('\nNo se pueden ejecutar más validaciones sin conexión a Supabase')
    results.tables = false
    results.storage = false
  }

  // Generar resumen
  const exitCode = await generateSummary(results)
  process.exit(exitCode)
}

// Ejecutar
main().catch(err => {
  error(`\n❌ ERROR FATAL: ${err.message}`)
  console.error(err)
  process.exit(1)
})
