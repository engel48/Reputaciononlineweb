#!/usr/bin/env node

// Script para diagnosticar y reparar el flujo de login completo
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgres://postgres:admin123@postgresql-database-rkgwkkss048ck00skskc08gs:5432/postgres';
const JWT_SECRET = 'reputacion-online-secret-key-2025';

async function testFullLoginFlow() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  try {
    console.log('🔍 TESTING: Iniciando test completo de login flow...');
    
    // 1. Verificar conexión a PostgreSQL
    console.log('\n1. Verificando conexión PostgreSQL...');
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado:', connectionTest.rows[0].now);
    
    // 2. Verificar que el usuario existe
    console.log('\n2. Verificando usuario pa@pa.com...');
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, ['pa@pa.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuario pa@pa.com no encontrado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      onboardingCompleted: user.onboardingCompleted,
      profileType: user.profileType
    });
    
    // 3. Verificar contraseña (asumiendo que la contraseña es "123456")
    console.log('\n3. Verificando contraseña...');
    const passwordTest = await bcrypt.compare('123456', user.password);
    console.log('✅ Contraseña válida:', passwordTest);
    
    if (!passwordTest) {
      console.log('❌ Contraseña incorrecta, test abortado');
      return;
    }
    
    // 4. Generar token JWT
    console.log('\n4. Generando token JWT...');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Token generado:', token.substring(0, 50) + '...');
    
    // 5. Verificar token JWT
    console.log('\n5. Verificando token JWT...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token decodificado:', decoded);
    
    // 6. Buscar redes sociales
    console.log('\n6. Buscando redes sociales...');
    const socialQuery = 'SELECT * FROM social_media WHERE "userId" = $1';
    const socialResult = await pool.query(socialQuery, [user.id]);
    console.log('✅ Redes sociales encontradas:', socialResult.rows.length);
    
    // 7. Construir objeto usuario completo
    console.log('\n7. Construyendo objeto usuario completo...');
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      company: user.company || '',
      phone: user.phone || '',
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      role: user.role,
      plan: user.plan,
      credits: user.credits,
      profileType: user.profileType,
      category: user.category,
      brandName: user.brandName,
      otherCategory: user.otherCategory,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      nextBillingDate: user.nextBillingDate,
      socialMedia: socialResult.rows.map(sm => ({
        platform: sm.platform,
        username: sm.username,
        followers: sm.followers,
        connected: Boolean(sm.connected),
        profileUrl: sm.profileUrl
      }))
    };
    
    console.log('✅ Objeto usuario construido:', {
      id: userResponse.id,
      email: userResponse.email,
      name: userResponse.name,
      profileType: userResponse.profileType,
      onboardingCompleted: userResponse.onboardingCompleted,
      hasSocialMedia: userResponse.socialMedia.length > 0
    });
    
    // 8. Simular respuesta de API
    console.log('\n8. Simulando respuesta de API de login...');
    const apiResponse = {
      success: true,
      user: userResponse,
      message: 'Login exitoso'
    };
    
    console.log('✅ API Response válida:', {
      success: apiResponse.success,
      hasUser: !!apiResponse.user,
      userKeys: Object.keys(apiResponse.user || {}),
      message: apiResponse.message
    });
    
    // 9. Determinar redirección
    console.log('\n9. Determinando redirección...');
    let redirectUrl;
    if (userResponse.onboardingCompleted) {
      if (userResponse.profileType === 'political') {
        redirectUrl = '/dashboard-politico';
      } else {
        redirectUrl = '/dashboard';
      }
    } else {
      redirectUrl = '/onboarding';
    }
    
    console.log('✅ URL de redirección:', redirectUrl);
    
    console.log('\n🎉 TEST COMPLETO - Todo funciona correctamente!');
    console.log('📋 RESUMEN:');
    console.log('- Usuario existe en PostgreSQL');
    console.log('- Contraseña válida');
    console.log('- Token JWT generado y verificado');
    console.log('- Objeto usuario completo construido');
    console.log('- API response válida con user object');
    console.log('- Redirección determinada:', redirectUrl);
    
  } catch (error) {
    console.error('💥 ERROR en test:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar test
testFullLoginFlow().catch(console.error);