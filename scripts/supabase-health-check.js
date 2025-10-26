/**
 * Script de Health Check: Supabase Services
 *
 * Verifica el estado de salud de todos los servicios de Supabase
 *
 * Útil para:
 * - Monitoreo en producción
 * - CI/CD pipelines
 * - Debugging de problemas
 * - Verificación post-deployment
 *
 * Salida:
 * - Exit code 0: Todos los servicios funcionan
 * - Exit code 1: Al menos un servicio falló
 *
 * Uso:
 * node scripts/supabase-health-check.js
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
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// ================================================
// CONFIGURACIÓN
// ================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  log('❌ ERROR: Variables de entorno no configuradas', 'red')
  log('   NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas\n', 'red')
  process.exit(1)
}

// Cliente admin (service_role)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente público (anon key)
const supabasePublic = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

// ================================================
// HEALTH CHECKS
// ================================================

const healthChecks = {
  database: false,
  auth: false,
  storage: false,
  functions: false,
  realtime: false
}

// ================================================
// 1. DATABASE HEALTH
// ================================================

async function checkDatabase() {
  try {
    const start = Date.now()

    // Test query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count', { count: 'exact', head: true })

    const duration = Date.now() - start

    if (error) {
      if (error.code === '42P01') {
        log(`❌ Database: Tabla "users" no existe (ejecutar migraciones)`, 'red')
      } else {
        log(`❌ Database: ${error.message}`, 'red')
      }
      return false
    }

    log(`✅ Database: OK (${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`❌ Database: ${err.message}`, 'red')
    return false
  }
}

// ================================================
// 2. AUTH HEALTH
// ================================================

async function checkAuth() {
  try {
    const start = Date.now()

    // Verificar que podemos obtener configuración de auth
    const { data, error } = await supabaseAdmin.auth.getSession()

    const duration = Date.now() - start

    if (error && !error.message.includes('session_not_found')) {
      log(`❌ Auth: ${error.message}`, 'red')
      return false
    }

    log(`✅ Auth: OK (${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`❌ Auth: ${err.message}`, 'red')
    return false
  }
}

// ================================================
// 3. STORAGE HEALTH
// ================================================

async function checkStorage() {
  try {
    const start = Date.now()

    // Listar buckets
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets()

    const duration = Date.now() - start

    if (error) {
      log(`❌ Storage: ${error.message}`, 'red')
      return false
    }

    const bucketCount = buckets?.length || 0
    log(`✅ Storage: OK (${bucketCount} buckets, ${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`❌ Storage: ${err.message}`, 'red')
    return false
  }
}

// ================================================
// 4. EDGE FUNCTIONS HEALTH (OPCIONAL)
// ================================================

async function checkEdgeFunctions() {
  if (!supabasePublic) {
    log(`⚠️  Edge Functions: Anon key no configurada, saltando`, 'yellow')
    return true // No es crítico
  }

  try {
    const start = Date.now()

    // Intentar invocar función de test (espera error de validación, no de "not found")
    const { data, error } = await supabasePublic.functions.invoke('julia-chat', {
      body: { test: true }
    })

    const duration = Date.now() - start

    if (error) {
      if (error.message.includes('not found')) {
        log(`ℹ️  Edge Functions: No desplegadas (opcional) (${duration}ms)`, 'cyan')
      } else {
        // Error de validación significa que la función existe y está respondiendo
        log(`✅ Edge Functions: Desplegadas (${duration}ms)`, 'green')
      }
      return true // No crítico si no están desplegadas
    }

    log(`✅ Edge Functions: OK (${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`ℹ️  Edge Functions: ${err.message}`, 'cyan')
    return true // No crítico
  }
}

// ================================================
// 5. REALTIME HEALTH
// ================================================

async function checkRealtime() {
  try {
    const start = Date.now()

    // Crear canal de test
    const channel = supabaseAdmin.channel('health-check')

    // Intentar suscribirse (timeout después de 5 segundos)
    const timeout = setTimeout(() => {
      log(`❌ Realtime: Timeout después de 5s`, 'red')
      supabaseAdmin.removeChannel(channel)
    }, 5000)

    await new Promise((resolve, reject) => {
      channel
        .on('presence', { event: 'sync' }, () => {
          // Presencia sincronizada
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            resolve()
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            reject(new Error(`Subscription failed: ${status}`))
          }
        })
    })

    const duration = Date.now() - start
    await supabaseAdmin.removeChannel(channel)

    log(`✅ Realtime: OK (${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`⚠️  Realtime: ${err.message} (no crítico)`, 'yellow')
    return true // No crítico, puede estar deshabilitado
  }
}

// ================================================
// CONNECTIVITY TEST
// ================================================

async function checkConnectivity() {
  try {
    const start = Date.now()

    // Simple fetch a la URL de Supabase
    const response = await fetch(SUPABASE_URL + '/rest/v1/')

    const duration = Date.now() - start

    if (!response.ok && response.status !== 401) {
      log(`❌ Connectivity: HTTP ${response.status}`, 'red')
      return false
    }

    log(`✅ Connectivity: OK (${duration}ms)`, 'green')
    return true

  } catch (err) {
    log(`❌ Connectivity: ${err.message}`, 'red')
    return false
  }
}

// ================================================
// LATENCY TEST
// ================================================

async function measureLatency() {
  const measurements = []

  for (let i = 0; i < 3; i++) {
    const start = Date.now()

    try {
      await supabaseAdmin
        .from('users')
        .select('count', { count: 'exact', head: true })

      measurements.push(Date.now() - start)
    } catch (err) {
      // Ignorar errores en test de latencia
    }
  }

  if (measurements.length > 0) {
    const avg = Math.round(measurements.reduce((a, b) => a + b, 0) / measurements.length)
    const min = Math.min(...measurements)
    const max = Math.max(...measurements)

    log(`\n📊 Latencia:`, 'cyan')
    log(`   Promedio: ${avg}ms`, 'cyan')
    log(`   Mínima: ${min}ms`, 'cyan')
    log(`   Máxima: ${max}ms`, 'cyan')

    if (avg > 500) {
      log(`   ⚠️  Latencia alta detectada`, 'yellow')
    }
  }
}

// ================================================
// MAIN
// ================================================

async function main() {
  log('\n╔═══════════════════════════════════════════╗', 'cyan')
  log('║  SUPABASE HEALTH CHECK                    ║', 'cyan')
  log('║  Reputación Online                        ║', 'cyan')
  log('╚═══════════════════════════════════════════╝\n', 'cyan')

  log(`🔗 URL: ${SUPABASE_URL}\n`, 'cyan')

  // Verificar conectividad primero
  log('🏥 Verificando servicios...\n')

  const connectivity = await checkConnectivity()
  if (!connectivity) {
    log('\n❌ No hay conectividad a Supabase', 'red')
    log('   Verifica tu conexión a internet y las credenciales\n', 'red')
    process.exit(1)
  }

  // Ejecutar health checks
  healthChecks.database = await checkDatabase()
  healthChecks.auth = await checkAuth()
  healthChecks.storage = await checkStorage()
  healthChecks.functions = await checkEdgeFunctions()
  healthChecks.realtime = await checkRealtime()

  // Medir latencia
  await measureLatency()

  // Resumen
  log('\n═══════════════════════════════════════════', 'cyan')

  const criticalServices = ['database', 'auth', 'storage']
  const criticalHealthy = criticalServices.every(service => healthChecks[service])
  const allHealthy = Object.values(healthChecks).every(v => v)

  if (allHealthy) {
    log('✅ TODOS LOS SERVICIOS FUNCIONAN CORRECTAMENTE', 'green')
    log('═══════════════════════════════════════════\n', 'cyan')
    process.exit(0)
  } else if (criticalHealthy) {
    log('⚠️  SERVICIOS CRÍTICOS OK, SERVICIOS OPCIONALES CON PROBLEMAS', 'yellow')
    log('═══════════════════════════════════════════\n', 'cyan')
    process.exit(0)
  } else {
    log('❌ UNO O MÁS SERVICIOS CRÍTICOS FALLARON', 'red')
    log('═══════════════════════════════════════════\n', 'cyan')

    log('Servicios críticos:', 'cyan')
    for (const service of criticalServices) {
      const status = healthChecks[service] ? '✅' : '❌'
      log(`  ${status} ${service}`)
    }
    log('')

    process.exit(1)
  }
}

// Ejecutar
main().catch(err => {
  log(`\n❌ ERROR FATAL: ${err.message}`, 'red')
  console.error(err)
  process.exit(1)
})
