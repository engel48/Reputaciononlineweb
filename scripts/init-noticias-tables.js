/**
 * Initialize news scraping tables in database
 * Run: node scripts/init-noticias-tables.js
 */

const fs = require('fs');
const path = require('path');
const { getDatabaseAdapter } = require('../src/lib/database-adapter.ts');

async function initializeNoticiasTables() {
  console.log('[Init] Inicializando tablas de noticias...');

  try {
    // Read SQL migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'prisma',
      'migrations',
      '20250121_noticias_colombia.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('[Init] Archivo de migración no encontrado:', migrationPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Get database adapter
    const db = await getDatabaseAdapter();
    console.log('[Init] Conectado a la base de datos');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await db.executeQuery(statement);
        console.log(`[Init] Ejecutado statement ${i + 1}/${statements.length}`);
      } catch (error) {
        console.warn(`[Init] Error en statement ${i + 1}:`, error.message);
        // Continue with other statements
      }
    }

    console.log('[Init] Tablas de noticias inicializadas correctamente');

    // Insert initial sitios configuration
    await insertInitialSitios(db);

    console.log('[Init] Proceso completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('[Init] Error al inicializar tablas:', error);
    process.exit(1);
  }
}

/**
 * Insert initial sitios configuration
 */
async function insertInitialSitios(db) {
  console.log('[Init] Insertando configuración de sitios...');

  const { SITIOS_NOTICIAS_COLOMBIA } = require('../src/lib/scraping/sitios-config.ts');

  for (const sitio of SITIOS_NOTICIAS_COLOMBIA) {
    try {
      const query = `
        INSERT OR IGNORE INTO sitios_noticias (
          id, nombre, url, logo_url, categoria, scraping_activo,
          selectores, max_requests_per_minute, timeout_segundos,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.executeQuery(query, [
        sitio.id,
        sitio.nombre,
        sitio.url,
        sitio.logoUrl || null,
        sitio.categoria,
        sitio.scrapingActivo ? 1 : 0,
        JSON.stringify(sitio.selectores),
        sitio.maxRequestsPerMinute,
        sitio.timeoutSegundos,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      console.log(`[Init] Sitio insertado: ${sitio.nombre}`);
    } catch (error) {
      console.warn(`[Init] Error insertando ${sitio.nombre}:`, error.message);
    }
  }

  console.log('[Init] Configuración de sitios completada');
}

// Run if called directly
if (require.main === module) {
  initializeNoticiasTables();
}

module.exports = { initializeNoticiasTables };
