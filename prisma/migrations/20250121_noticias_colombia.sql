-- Migration: Add tables for Colombian news scraping system
-- Created: 2025-01-21

-- Table: sitios_noticias
-- Stores configuration for 50+ Colombian news sites
CREATE TABLE IF NOT EXISTS sitios_noticias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  categoria TEXT NOT NULL CHECK(categoria IN ('nacional', 'regional', 'digital', 'economico', 'deportivo')),
  scraping_activo BOOLEAN NOT NULL DEFAULT true,

  -- Scraping configuration (stored as JSON)
  selectores TEXT, -- JSON: {titulo, descripcion, url, imagen, fecha, autor}
  user_agent TEXT DEFAULT 'Mozilla/5.0 (compatible; ReputacionOnlineBot/1.0; +https://reputaciononline.co/bot)',

  -- Rate limiting
  max_requests_per_minute INTEGER DEFAULT 5,
  timeout_segundos INTEGER DEFAULT 10,

  -- Status tracking
  ultimo_scrape TIMESTAMP,
  ultimo_error TEXT,
  total_scrapes INTEGER DEFAULT 0,
  scrapes_exitosos INTEGER DEFAULT 0,
  scrapes_fallidos INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: noticias_colombia
-- Stores scraped news articles
CREATE TABLE IF NOT EXISTS noticias_colombia (
  id TEXT PRIMARY KEY,
  sitio_id TEXT NOT NULL,

  -- Article data
  titulo TEXT NOT NULL,
  descripcion TEXT,
  url TEXT NOT NULL UNIQUE,
  imagen_url TEXT,
  autor TEXT,
  fecha_publicacion TIMESTAMP,
  categoria TEXT,

  -- Content analysis
  contenido_completo TEXT,
  keywords TEXT, -- JSON array
  sentiment_score REAL,

  -- Metadata
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  views INTEGER DEFAULT 0,

  FOREIGN KEY (sitio_id) REFERENCES sitios_noticias(id) ON DELETE CASCADE
);

-- Table: scraping_cache
-- Cache for scraping results to optimize performance
CREATE TABLE IF NOT EXISTS scraping_cache (
  id TEXT PRIMARY KEY,
  sitio_id TEXT NOT NULL,
  cache_key TEXT NOT NULL UNIQUE, -- site_id + timestamp
  data TEXT NOT NULL, -- JSON with scraped articles
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  hits INTEGER DEFAULT 0,

  FOREIGN KEY (sitio_id) REFERENCES sitios_noticias(id) ON DELETE CASCADE
);

-- Table: scraping_logs
-- Detailed logs for debugging and monitoring
CREATE TABLE IF NOT EXISTS scraping_logs (
  id TEXT PRIMARY KEY,
  sitio_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success', 'error', 'timeout', 'rate_limited')),
  duration_ms INTEGER,
  articles_found INTEGER DEFAULT 0,
  error_message TEXT,
  request_metadata TEXT, -- JSON: {user_agent, ip, etc}
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (sitio_id) REFERENCES sitios_noticias(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_noticias_sitio_fecha ON noticias_colombia(sitio_id, fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias_colombia(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON noticias_colombia(categoria);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON scraping_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_sitio ON scraping_cache(sitio_id);
CREATE INDEX IF NOT EXISTS idx_logs_sitio_fecha ON scraping_logs(sitio_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sitios_categoria ON sitios_noticias(categoria);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_sitios_timestamp
AFTER UPDATE ON sitios_noticias
BEGIN
  UPDATE sitios_noticias SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_noticias_timestamp
AFTER UPDATE ON noticias_colombia
BEGIN
  UPDATE noticias_colombia SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
