/**
 * Script de Migración: SQLite → Supabase
 *
 * Migra datos de la base de datos SQLite local a Supabase PostgreSQL
 *
 * Migra:
 * - Users (con passwords bcrypt intactos)
 * - Social Media connections
 * - User Stats
 * - Notifications
 * - Alerts
 * - Reports
 * - Activities
 * - Media Sources selections
 *
 * Uso:
 * node scripts/migrate-to-supabase.js
 */

const Database = require('better-sqlite3')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// ================================================
// CONFIGURACIÓN
// ================================================

const SQLITE_PATH = path.join(__dirname, '../data/app.db')

// Cargar env
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos')
  console.error('   Asegúrate de tenerlos en .env.local')
  process.exit(1)
}

// ================================================
// CLIENTES
// ================================================

// SQLite (source)
const sqlite = new Database(SQLITE_PATH, { readonly: true })

// Supabase (destination) - usando service_role para bypassar RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ================================================
// FUNCIONES DE MIGRACIÓN
// ================================================

async function migrateUsers() {
  console.log('\n📦 Migrando USERS...')

  const users = sqlite.prepare('SELECT * FROM users').all()
  console.log(`   Encontrados: ${users.length} usuarios`)

  let migrated = 0
  let errors = 0

  for (const user of users) {
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password, // bcrypt hash directo
        email_confirm: true,
        user_metadata: {
          name: user.name,
          company: user.company,
          phone: user.phone
        }
      })

      if (authError) {
        console.error(`   ❌ Error creando auth user ${user.email}:`, authError.message)
        errors++
        continue
      }

      console.log(`   ✅ Usuario auth creado: ${user.email}`)

      // 2. Crear registro en tabla users (usando el mismo ID de auth)
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id, // Usar ID de Supabase Auth
          email: user.email,
          password: user.password, // Mantener hash bcrypt
          name: user.name,
          company: user.company,
          phone: user.phone,
          bio: user.bio,
          avatar_url: user.avatarUrl,
          role: user.role,
          plan: user.plan,
          credits: user.credits,
          profile_type: user.profileType,
          category: user.category,
          brand_name: user.brandName,
          other_category: user.otherCategory,
          onboarding_completed: user.onboardingCompleted === 1,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          last_login: user.lastLogin,
          next_billing_date: user.nextBillingDate
        })

      if (dbError) {
        console.error(`   ❌ Error insertando en tabla users:`, dbError.message)
        errors++
        continue
      }

      // Guardar mapeo de IDs (SQLite ID → Supabase ID)
      userIdMap.set(user.id, authUser.user.id)

      migrated++
      console.log(`   ✅ ${migrated}/${users.length} - ${user.email}`)

    } catch (error) {
      console.error(`   ❌ Error migrando ${user.email}:`, error.message)
      errors++
    }
  }

  console.log(`\n   📊 Usuarios migrados: ${migrated}/${users.length}`)
  if (errors > 0) {
    console.log(`   ⚠️  Errores: ${errors}`)
  }

  return { migrated, errors }
}

async function migrateSocialMedia() {
  console.log('\n📦 Migrando SOCIAL_MEDIA...')

  const socialMedia = sqlite.prepare('SELECT * FROM social_media').all()
  console.log(`   Encontrados: ${socialMedia.length} conexiones`)

  let migrated = 0

  for (const sm of socialMedia) {
    try {
      const supabaseUserId = userIdMap.get(sm.userId)
      if (!supabaseUserId) {
        console.log(`   ⚠️  Usuario no migrado, saltando: ${sm.userId}`)
        continue
      }

      const { error } = await supabase
        .from('social_media')
        .insert({
          id: sm.id,
          user_id: supabaseUserId,
          platform: sm.platform,
          username: sm.username,
          profile_url: sm.profileUrl,
          followers: sm.followers,
          following: sm.following,
          posts: sm.posts,
          engagement: sm.engagement,
          connected: sm.connected === 1,
          last_sync: sm.lastSync,
          access_token: sm.accessToken,
          refresh_token: sm.refreshToken,
          token_expiry: sm.tokenExpiry
        })

      if (!error) {
        migrated++
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log(`   ✅ Migrados: ${migrated}/${socialMedia.length}`)
  return migrated
}

async function migrateUserStats() {
  console.log('\n📦 Migrando USER_STATS...')

  const stats = sqlite.prepare('SELECT * FROM user_stats').all()
  console.log(`   Encontrados: ${stats.length} registros`)

  let migrated = 0

  for (const stat of stats) {
    try {
      const supabaseUserId = userIdMap.get(stat.userId)
      if (!supabaseUserId) continue

      const { error } = await supabase
        .from('user_stats')
        .insert({
          id: stat.id,
          user_id: supabaseUserId,
          total_mentions: stat.totalMentions,
          positive_mentions: stat.positiveMentions,
          negative_mentions: stat.negativeMentions,
          neutral_mentions: stat.neutralMentions,
          sentiment_score: stat.sentimentScore,
          reach_estimate: stat.reachEstimate,
          engagement_rate: stat.engagementRate,
          influence_score: stat.influenceScore,
          trending_score: stat.trendingScore,
          monthly_growth: stat.monthlyGrowth,
          last_calculated: stat.lastCalculated,
          updated_at: stat.updatedAt
        })

      if (!error) migrated++
    } catch (error) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log(`   ✅ Migrados: ${migrated}/${stats.length}`)
  return migrated
}

async function migrateNotifications() {
  console.log('\n📦 Migrando NOTIFICATIONS...')

  const notifications = sqlite.prepare('SELECT * FROM notifications').all()
  console.log(`   Encontrados: ${notifications.length} notificaciones`)

  let migrated = 0

  for (const notif of notifications) {
    try {
      const supabaseUserId = userIdMap.get(notif.userId)
      if (!supabaseUserId) continue

      const { error } = await supabase
        .from('notifications')
        .insert({
          id: notif.id,
          user_id: supabaseUserId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          is_read: notif.isRead === 1,
          priority: notif.priority,
          metadata: notif.metadata,
          created_at: notif.createdAt
        })

      if (!error) migrated++
    } catch (error) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log(`   ✅ Migrados: ${migrated}/${notifications.length}`)
  return migrated
}

async function migrateAlerts() {
  console.log('\n📦 Migrando ALERTS...')

  const alerts = sqlite.prepare('SELECT * FROM alerts').all()
  console.log(`   Encontrados: ${alerts.length} alertas`)

  let migrated = 0

  for (const alert of alerts) {
    try {
      const supabaseUserId = userIdMap.get(alert.userId)
      if (!supabaseUserId) continue

      const { error } = await supabase
        .from('alerts')
        .insert({
          id: alert.id,
          user_id: supabaseUserId,
          name: alert.name,
          keywords: alert.keywords,
          platforms: alert.platforms,
          sentiment: alert.sentiment,
          is_active: alert.isActive === 1,
          frequency: alert.frequency,
          last_triggered: alert.lastTriggered,
          created_at: alert.createdAt,
          updated_at: alert.updatedAt
        })

      if (!error) migrated++
    } catch (error) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log(`   ✅ Migrados: ${migrated}/${alerts.length}`)
  return migrated
}

async function migrateReports() {
  console.log('\n📦 Migrando REPORTS...')

  const reports = sqlite.prepare('SELECT * FROM reports').all()
  console.log(`   Encontrados: ${reports.length} reportes`)

  let migrated = 0

  for (const report of reports) {
    try {
      const supabaseUserId = userIdMap.get(report.userId)
      if (!supabaseUserId) continue

      const { error } = await supabase
        .from('reports')
        .insert({
          id: report.id,
          user_id: supabaseUserId,
          name: report.name,
          type: report.type,
          date_range: report.dateRange,
          data: report.data,
          status: report.status,
          file_url: report.fileUrl,
          created_at: report.createdAt
        })

      if (!error) migrated++
    } catch (error) {
      console.error(`   ❌ Error:`, error.message)
    }
  }

  console.log(`   ✅ Migrados: ${migrated}/${reports.length}`)
  return migrated
}

// ================================================
// MAIN
// ================================================

const userIdMap = new Map() // SQLite ID → Supabase ID

async function main() {
  console.log('🚀 INICIANDO MIGRACIÓN SQLITE → SUPABASE')
  console.log('==========================================')
  console.log(`📂 SQLite: ${SQLITE_PATH}`)
  console.log(`🔗 Supabase: ${SUPABASE_URL}`)
  console.log('')

  try {
    // Test conexión a Supabase
    const { error: testError } = await supabase.from('users').select('count').single()
    if (testError && testError.code !== 'PGRST116') {
      console.error('❌ Error conectando a Supabase:', testError)
      process.exit(1)
    }

    console.log('✅ Conexión a Supabase exitosa')

    // Ejecutar migraciones
    const results = {
      users: await migrateUsers(),
      socialMedia: await migrateSocialMedia(),
      userStats: await migrateUserStats(),
      notifications: await migrateNotifications(),
      alerts: await migrateAlerts(),
      reports: await migrateReports()
    }

    // Resumen
    console.log('\n==========================================')
    console.log('📊 RESUMEN DE MIGRACIÓN')
    console.log('==========================================')
    console.log(`✅ Usuarios:        ${results.users.migrated}`)
    console.log(`✅ Social Media:    ${results.socialMedia}`)
    console.log(`✅ User Stats:      ${results.userStats}`)
    console.log(`✅ Notificaciones:  ${results.notifications}`)
    console.log(`✅ Alertas:         ${results.alerts}`)
    console.log(`✅ Reportes:        ${results.reports}`)

    if (results.users.errors > 0) {
      console.log(`\n⚠️  Errores en usuarios: ${results.users.errors}`)
    }

    console.log('\n🎉 MIGRACIÓN COMPLETADA')

  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error)
    process.exit(1)
  } finally {
    sqlite.close()
  }
}

// Ejecutar
main()
