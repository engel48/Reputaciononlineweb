// Configuración automática de variables de entorno para producción
// Este archivo se ejecuta antes de que Prisma se inicialice

// Solo configurar variables por defecto si no están presentes
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
  console.log('🔧 DATABASE_URL configurada con valor por defecto');
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'default-secret-change-in-production-' + Date.now();
  console.log('🔧 NEXTAUTH_SECRET configurada con valor por defecto');
}

if (!process.env.NEXTAUTH_URL) {
  // Intentar detectar la URL automáticamente
  const url = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}`
    : process.env.RAILWAY_STATIC_URL
    ? `https://${process.env.RAILWAY_STATIC_URL}`
    : 'http://localhost:3000';
  
  process.env.NEXTAUTH_URL = url;
  console.log(`🔧 NEXTAUTH_URL configurada: ${url}`);
}

console.log('✅ Variables de entorno verificadas y configuradas');
