#!/usr/bin/env node

// Test script para verificar el adaptador de base de datos inteligente
console.log('🧪 TEST-DATABASE-ADAPTER: Iniciando pruebas...');

async function testDatabaseAdapter() {
  try {
    console.log('🔍 TEST-DATABASE-ADAPTER: Importando adaptador...');
    
    // Importar el adaptador usando ts-node para compilar TypeScript
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'es2020'
      }
    });
    
    const { userService, getDatabaseInfo } = require('../src/lib/database-adapter.ts');
    
    console.log('✅ TEST-DATABASE-ADAPTER: Adaptador importado correctamente');
    
    // Obtener información de la base de datos
    console.log('🔍 TEST-DATABASE-ADAPTER: Obteniendo información de la base de datos...');
    const dbInfo = await getDatabaseInfo();
    
    console.log('📋 TEST-DATABASE-ADAPTER: Información de la base de datos:');
    console.log('   Tipo:', dbInfo.type);
    console.log('   Entorno:', dbInfo.environment);
    console.log('   URL:', dbInfo.url);
    
    // Probar el userService
    console.log('🔍 TEST-DATABASE-ADAPTER: Probando userService...');
    const users = await userService.findAll();
    console.log('✅ TEST-DATABASE-ADAPTER: userService funciona correctamente');
    console.log('   Usuarios encontrados:', users.length);
    
    if (users.length > 0) {
      console.log('   Primer usuario:', users[0].email);
    }
    
    console.log('🎯 TEST-DATABASE-ADAPTER: Todas las pruebas pasaron exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ TEST-DATABASE-ADAPTER: Error en las pruebas:', error.message);
    console.error('   Stack trace:', error.stack);
    return false;
  }
}

// Ejecutar las pruebas
testDatabaseAdapter().then(success => {
  console.log('🏁 TEST-DATABASE-ADAPTER: Pruebas completadas');
  process.exit(success ? 0 : 1);
});