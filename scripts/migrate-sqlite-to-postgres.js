// Script de migración de SQLite a PostgreSQL
const Database = require('better-sqlite3');
const { Pool } = require('pg');

// Configuración PostgreSQL
const postgresPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: 10,
});

// Configuración SQLite
const sqliteDb = new Database('./data/app.db');

console.log('🔄 INICIANDO MIGRACIÓN SQLite → PostgreSQL');
console.log('==========================================');

async function migrateData() {
  try {
    // 1. Migrar usuarios
    console.log('👤 Migrando usuarios...');
    await migrateUsers();
    
    // 2. Migrar fuentes de medios
    console.log('📰 Migrando media_sources...');
    await migrateMediaSources();
    
    // 3. Migrar plataformas sociales
    console.log('📱 Migrando social_platforms...');
    await migrateSocialPlatforms();
    
    // 4. Migrar configuraciones del sistema
    console.log('⚙️ Migrando system_settings...');
    await migrateSystemSettings();
    
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    sqliteDb.close();
    await postgresPool.end();
  }
}

// Migrar usuarios
async function migrateUsers() {
  try {
    const rows = sqliteDb.prepare("SELECT * FROM users").all();
    console.log(`   Encontrados ${rows.length} usuarios en SQLite`);
    
    for (const user of rows) {
      try {
        const query = `
          INSERT INTO users (
            id, email, password, name, company, phone, bio, "avatarUrl", 
            role, plan, credits, "profileType", category, "brandName", 
            "otherCategory", "additionalSources", "partidoPolitico", 
            "cargoActual", "propuestasPrincipales", settings, 
            "onboardingCompleted", "isActive", "createdAt", "updatedAt", "lastLogin"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
            $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
          ) ON CONFLICT (email) DO NOTHING
        `;
        
        await postgresPool.query(query, [
          user.id, user.email, user.password, user.name, user.company,
          user.phone, user.bio, user.avatarUrl, user.role, user.plan,
          user.credits, user.profileType, user.category, user.brandName,
          user.otherCategory, user.additionalSources, user.partidoPolitico,
          user.cargoActual, user.propuestasPrincipales, user.settings,
          user.onboardingCompleted, user.isActive, user.createdAt,
          user.updatedAt, user.lastLogin
        ]);
        
        console.log(`   ✓ Usuario migrado: ${user.email}`);
      } catch (error) {
        console.log(`   ⚠️ Error con usuario ${user.email}:`, error.message);
      }
    }
  } catch (error) {
    throw error;
  }
}

// Migrar fuentes de medios
async function migrateMediaSources() {
  try {
    const rows = sqliteDb.prepare("SELECT * FROM media_sources").all();
    console.log(`   Encontradas ${rows.length} fuentes de medios en SQLite`);
    
    for (const source of rows) {
      try {
        const query = `
          INSERT INTO media_sources (
            id, name, url, country, category, "isActive", "lastChecked"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (url) DO NOTHING
        `;
        
        await postgresPool.query(query, [
          source.id, source.name, source.url, source.country,
          source.category, source.isActive, source.lastChecked
        ]);
        
        console.log(`   ✓ Fuente migrada: ${source.name}`);
      } catch (error) {
        console.log(`   ⚠️ Error con fuente ${source.name}:`, error.message);
      }
    }
  } catch (error) {
    throw error;
  }
}

// Migrar plataformas sociales
async function migrateSocialPlatforms() {
  try {
    const rows = sqliteDb.prepare("SELECT * FROM social_platforms").all();
    console.log(`   Encontradas ${rows.length} plataformas sociales en SQLite`);
    
    for (const platform of rows) {
      try {
        const query = `
          INSERT INTO social_platforms (
            id, platform, name, "apiEndpoint", "authType", "isActive"
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (platform) DO NOTHING
        `;
        
        await postgresPool.query(query, [
          platform.id, platform.platform, platform.name,
          platform.apiEndpoint, platform.authType, platform.isActive
        ]);
        
        console.log(`   ✓ Plataforma migrada: ${platform.name}`);
      } catch (error) {
        console.log(`   ⚠️ Error con plataforma ${platform.name}:`, error.message);
      }
    }
  } catch (error) {
    throw error;
  }
}

// Migrar configuraciones del sistema
async function migrateSystemSettings() {
  try {
    const rows = sqliteDb.prepare("SELECT * FROM system_settings").all();
    console.log(`   Encontradas ${rows.length} configuraciones en SQLite`);
    
    for (const setting of rows) {
      try {
        const query = `
          INSERT INTO system_settings (
            id, key, value, description, "updatedBy", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            description = EXCLUDED.description,
            "updatedBy" = EXCLUDED."updatedBy",
            "updatedAt" = EXCLUDED."updatedAt"
        `;
        
        await postgresPool.query(query, [
          setting.id, setting.key, setting.value, setting.description,
          setting.updatedBy, setting.updatedAt
        ]);
        
        console.log(`   ✓ Configuración migrada: ${setting.key}`);
      } catch (error) {
        console.log(`   ⚠️ Error con configuración ${setting.key}:`, error.message);
      }
    }
  } catch (error) {
    throw error;
  }
}

// Ejecutar migración
migrateData();