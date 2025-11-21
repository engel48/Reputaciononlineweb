// Test de credenciales TikTok
const CLIENT_KEY = 'aw106l0y4pwndtp1';
const CLIENT_SECRET = 'UKXsOKGdjoI6bPtH1lEev3bWN2TMrgpF';

console.log('\n🧪 TEST DE CREDENCIALES TIKTOK\n');
console.log('='.repeat(60));

console.log('\n📋 Credenciales Configuradas:');
console.log(`Client Key: ${CLIENT_KEY}`);
console.log(`Client Secret: ${CLIENT_SECRET.substring(0, 10)}...`);

console.log('\n🔗 URLs de OAuth:');
console.log('Authorization URL:');
console.log(`https://www.tiktok.com/v2/auth/authorize/?client_key=${CLIENT_KEY}&scope=user.info.basic,video.list&response_type=code&redirect_uri=https://reputaciononline.com.co/api/auth/tiktok/callback`);

console.log('\n📍 Redirect URIs que DEBES configurar en TikTok Developers:');
console.log('1. https://reputaciononline.com.co/api/auth/tiktok/callback');
console.log('2. http://localhost:3000/api/auth/tiktok/callback (para desarrollo)');

console.log('\n⚙️  Pasos en TikTok Developers Console:');
console.log('1. Ve a: https://developers.tiktok.com/');
console.log('2. Selecciona tu app');
console.log('3. Ve a: Products → Login Kit for Web → Settings');
console.log('4. En "Redirect URIs", agrega las URLs de arriba');
console.log('5. En "Scopes", habilita: user.info.basic y video.list');
console.log('6. Guarda los cambios');

console.log('\n✅ Una vez configurado, podrás probar en:');
console.log('http://localhost:3000/dashboard/redes-sociales');

console.log('\n' + '='.repeat(60));
console.log('✨ Credenciales actualizadas en .env.local\n');
