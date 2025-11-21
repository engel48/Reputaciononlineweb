// Test de variables de entorno en Next.js
console.log('\n🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO NEXT.JS\n');
console.log('='.repeat(60));

// Variables que deberían estar disponibles
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_FACEBOOK_APP_ID',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'FACEBOOK_APP_SECRET',
  'FACEBOOK_CLIENT_ID',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

console.log('\n📋 Variables Públicas (NEXT_PUBLIC_):');
console.log('-'.repeat(60));

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (varName.startsWith('NEXT_PUBLIC_')) {
    if (value) {
      // Ocultar parte sensible
      const masked = varName.includes('KEY') || varName.includes('SECRET')
        ? value.substring(0, 20) + '...'
        : value.substring(0, 30) + '...';
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`❌ ${varName}: NO DEFINIDA`);
    }
  }
});

console.log('\n🔒 Variables Privadas (solo servidor):');
console.log('-'.repeat(60));

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!varName.startsWith('NEXT_PUBLIC_')) {
    if (value) {
      const masked = value.substring(0, 15) + '...';
      console.log(`✅ ${varName}: ${masked}`);
    } else {
      console.log(`❌ ${varName}: NO DEFINIDA`);
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n💡 IMPORTANTE:');
console.log('  - Variables NEXT_PUBLIC_* son accesibles en el cliente');
console.log('  - Variables sin NEXT_PUBLIC_ solo en servidor');
console.log('  - Cambios en .env.local requieren rebuild de Next.js\n');
