#!/usr/bin/env node
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const DATABASE_URL = 'postgres://postgres:admin123@rkgwkkss048ck00skskc08gs:5432/postgres';

console.log('🔧 CORRIGIENDO onboardingCompleted para usuarios existentes');
console.log('=' .repeat(60));

async function fixOnboardingCompleted() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Buscar usuarios que deberían tener onboarding completado
    // Criterios: tienen plan diferente a 'basic', tienen créditos, tienen company, etc.
    console.log('\n🔍 Buscando usuarios que necesitan corrección...');
    
    const usersToFixQuery = `
      SELECT id, email, name, plan, credits, company, "profileType", "onboardingCompleted"
      FROM users 
      WHERE "onboardingCompleted" = false 
      AND (
        plan != 'basic' OR 
        credits > 1000 OR 
        company IS NOT NULL OR 
        "profileType" IS NOT NULL
      )
      ORDER BY "createdAt" DESC
    `;
    
    const usersToFix = await client.query(usersToFixQuery);
    console.log(`📋 Encontrados ${usersToFix.rows.length} usuarios que necesitan corrección:`);
    
    if (usersToFix.rows.length === 0) {
      console.log('   ✅ No hay usuarios que necesiten corrección');
      client.release();
      return;
    }
    
    // Mostrar usuarios encontrados
    usersToFix.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      console.log(`      Plan: ${user.plan}, Créditos: ${user.credits}, Company: ${user.company || 'N/A'}`);
      console.log(`      ProfileType: ${user.profileType || 'N/A'}, OnboardingCompleted: ${user.onboardingCompleted}`);
    });
    
    // Preguntar confirmación (en producción sería automático)
    console.log('\n🔄 Actualizando onboardingCompleted = true para estos usuarios...');
    
    // Actualizar todos los usuarios encontrados
    const updateQuery = `
      UPDATE users 
      SET "onboardingCompleted" = true, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "onboardingCompleted" = false 
      AND (
        plan != 'basic' OR 
        credits > 1000 OR 
        company IS NOT NULL OR 
        "profileType" IS NOT NULL
      )
    `;
    
    const updateResult = await client.query(updateQuery);
    console.log(`✅ Actualizados ${updateResult.rowCount} usuarios`);
    
    // Verificar la actualización
    console.log('\n🔍 Verificando la actualización...');
    const verificationQuery = `
      SELECT id, email, name, "onboardingCompleted"
      FROM users 
      WHERE id = ANY($1)
    `;
    
    const userIds = usersToFix.rows.map(user => user.id);
    const verificationResult = await client.query(verificationQuery, [userIds]);
    
    console.log('📋 Estado después de la actualización:');
    verificationResult.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}): onboardingCompleted = ${user.onboardingCompleted}`);
    });
    
    // Estadísticas finales
    console.log('\n📊 Estadísticas finales:');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN "onboardingCompleted" = true THEN 1 END) as completed_onboarding,
        COUNT(CASE WHEN "onboardingCompleted" = false THEN 1 END) as pending_onboarding
      FROM users
    `;
    
    const stats = await client.query(statsQuery);
    const { total_users, completed_onboarding, pending_onboarding } = stats.rows[0];
    
    console.log(`   Total usuarios: ${total_users}`);
    console.log(`   Onboarding completado: ${completed_onboarding}`);
    console.log(`   Onboarding pendiente: ${pending_onboarding}`);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Ejecutar corrección
fixOnboardingCompleted()
  .then(() => {
    console.log('\n🏁 Corrección completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });