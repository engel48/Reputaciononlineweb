/**
 * Configuración de 50 sitios de noticias colombianos para monitoreo
 * Organizado por categorías con configuración de scraping específica
 */

export type ScrapingMethod = 'rss' | 'sitemap' | 'scraping';
export type SiteCategory = 'nacional' | 'regional' | 'digital' | 'economico' | 'deportivo' | 'politico';

export interface NewsSiteConfig {
  id: string;
  name: string;
  url: string;
  logoUrl?: string;
  category: SiteCategory;
  scrapingMethod: ScrapingMethod;
  rssUrl?: string;
  sitemapUrl?: string;
  selectors?: {
    articleList?: string;
    articleTitle?: string;
    articleUrl?: string;
    articleDate?: string;
    articleContent?: string;
    articleAuthor?: string;
  };
  isActive: boolean;
  maxRequestsPerHour: number;
}

export const NEWS_SITES_CONFIG: NewsSiteConfig[] = [
  // ========== MEDIOS NACIONALES (10) ==========
  {
    id: 'el-tiempo',
    name: 'El Tiempo',
    url: 'https://www.eltiempo.com',
    logoUrl: 'https://www.eltiempo.com/static/img/logo.svg',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.eltiempo.com/rss/colombia.xml',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'el-espectador',
    name: 'El Espectador',
    url: 'https://www.elespectador.com',
    logoUrl: 'https://www.elespectador.com/static/img/logo.svg',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.elespectador.com/arc/outboundfeeds/rss/',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'semana',
    name: 'Semana',
    url: 'https://www.semana.com',
    logoUrl: 'https://www.semana.com/static/img/logo.svg',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.semana.com/arc/outboundfeeds/rss/',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'rcn-radio',
    name: 'RCN Radio',
    url: 'https://www.rcnradio.com',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.rcnradio.com/arc/outboundfeeds/rss/',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'caracol-radio',
    name: 'Caracol Radio',
    url: 'https://caracol.com.co',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://caracol.com.co/rss/radio/portada.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'blu-radio',
    name: 'Blu Radio',
    url: 'https://www.bluradio.com',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.bluradio.com/arc/outboundfeeds/rss/',
    isActive: false,  // Desactivado - RSS no disponible
    maxRequestsPerHour: 12,
  },
  {
    id: 'w-radio',
    name: 'W Radio',
    url: 'https://www.wradio.com.co',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.wradio.com.co/arc/outboundfeeds/rss/',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'la-fm',
    name: 'La FM',
    url: 'https://www.lafm.com.co',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.lafm.com.co/arc/outboundfeeds/rss/',
    isActive: false,  // Desactivado - RSS no disponible
    maxRequestsPerHour: 12,
  },
  {
    id: 'ciudad-tv',
    name: 'CityTV',
    url: 'https://www.citytv.com.co',
    category: 'nacional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.citytv.com.co/sitemap.xml',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'noticias-rcn',
    name: 'Noticias RCN',
    url: 'https://www.noticiasrcn.com',
    category: 'nacional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.noticiasrcn.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },

  // ========== MEDIOS REGIONALES (12) ==========
  {
    id: 'el-colombiano',
    name: 'El Colombiano',
    url: 'https://www.elcolombiano.com',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.elcolombiano.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'el-heraldo',
    name: 'El Heraldo',
    url: 'https://www.elheraldo.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.elheraldo.co/arc/outboundfeeds/rss/',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'el-universal',
    name: 'El Universal',
    url: 'https://www.eluniversal.com.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.eluniversal.com.co/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'vanguardia',
    name: 'Vanguardia',
    url: 'https://www.vanguardia.com',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.vanguardia.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'el-pais',
    name: 'El País (Cali)',
    url: 'https://www.elpais.com.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.elpais.com.co/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'la-patria',
    name: 'La Patria',
    url: 'https://www.lapatria.com',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.lapatria.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'el-diario',
    name: 'El Diario del Otún',
    url: 'https://www.eldiario.com.co',
    category: 'regional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.eldiario.com.co/sitemap.xml',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'el-nuevo-siglo',
    name: 'El Nuevo Siglo',
    url: 'https://www.elnuevosiglo.com.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.elnuevosiglo.com.co/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'la-opinion',
    name: 'La Opinión',
    url: 'https://www.laopinion.com.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.laopinion.com.co/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'el-informador',
    name: 'El Informador',
    url: 'https://www.elinformador.com.co',
    category: 'regional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.elinformador.com.co/sitemap.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },
  {
    id: 'hoy-diario',
    name: 'HOY Diario del Magdalena',
    url: 'https://www.hoydiariodelmagdalena.com.co',
    category: 'regional',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.hoydiariodelmagdalena.com.co/rss',
    isActive: true,
    maxRequestsPerHour: 8,
  },
  {
    id: 'el-meridiano',
    name: 'El Meridiano de Córdoba',
    url: 'https://www.elmeridianodecordoba.com.co',
    category: 'regional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.elmeridianodecordoba.com.co/sitemap.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },

  // ========== MEDIOS DIGITALES (10) ==========
  {
    id: 'pulzo',
    name: 'Pulzo',
    url: 'https://www.pulzo.com',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.pulzo.com/rss/sitio.xml',
    isActive: true,
    maxRequestsPerHour: 15,
  },
  {
    id: 'las-2-orillas',
    name: 'Las 2 Orillas',
    url: 'https://www.las2orillas.co',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.las2orillas.co/feed/',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'la-silla-vacia',
    name: 'La Silla Vacía',
    url: 'https://www.lasillavacia.com',
    category: 'politico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.lasillavacia.com/rss.xml',
    isActive: false, // Desactivado: rss.xml 404 + bloqueo anti-bots (429/408). Sin feed accesible.
    maxRequestsPerHour: 12,
  },
  {
    id: 'kienke',
    name: 'KienyKe',
    url: 'https://www.kienyke.com',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.kienyke.com/feed',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'cambio',
    name: 'Cambio',
    url: 'https://cambiocolombia.com',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://cambiocolombia.com/rss',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'infobae-colombia',
    name: 'Infobae Colombia',
    url: 'https://www.infobae.com/colombia/',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.infobae.com/arc/outboundfeeds/rss/',
    isActive: true,
    maxRequestsPerHour: 15,
  },
  {
    id: 'cuestión-publica',
    name: 'Cuestión Pública',
    url: 'https://cuestionpublica.com',
    category: 'politico',
    scrapingMethod: 'rss',
    rssUrl: 'https://cuestionpublica.com/feed/',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'razon-publica',
    name: 'Razón Pública',
    url: 'https://razonpublica.com',
    category: 'politico',
    scrapingMethod: 'rss',
    rssUrl: 'https://razonpublica.com/feed/',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'colombiacheck',
    name: 'ColombiaCheck',
    url: 'https://colombiacheck.com',
    category: 'politico',
    scrapingMethod: 'rss',
    rssUrl: 'https://colombiacheck.com/feed',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },
  {
    id: 'pacifista',
    name: 'Pacifista',
    url: 'https://pacifista.tv',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://pacifista.tv/feed/',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },

  // ========== MEDIOS ECONÓMICOS (8) ==========
  {
    id: 'portafolio',
    name: 'Portafolio',
    url: 'https://www.portafolio.co',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.portafolio.co/rss/economia.xml',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'la-republica',
    name: 'La República',
    url: 'https://www.larepublica.co',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.larepublica.co/rss',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'dinero',
    name: 'Dinero',
    url: 'https://www.dinero.com',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.dinero.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'valora-analitik',
    name: 'Valora Analitik',
    url: 'https://www.valoraanalitik.com',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.valoraanalitik.com/feed/',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'Bloomberg-linea',
    name: 'Bloomberg Línea',
    url: 'https://www.bloomberglinea.com/colombia/',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.bloomberglinea.com/feed/colombia',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'agronegocios',
    name: 'Agronegocios',
    url: 'https://www.agronegocios.co',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.agronegocios.co/rss',
    isActive: true,
    maxRequestsPerHour: 8,
  },
  {
    id: 'empresario',
    name: 'Empresario',
    url: 'https://www.empresario.com.co',
    category: 'economico',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.empresario.com.co/sitemap.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },
  {
    id: 'finanzas-personales',
    name: 'Finanzas Personales',
    url: 'https://www.finanzaspersonales.co',
    category: 'economico',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.finanzaspersonales.co/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },

  // ========== MEDIOS DEPORTIVOS (5) ==========
  {
    id: 'futbolred',
    name: 'Futbolred',
    url: 'https://www.futbolred.com',
    category: 'deportivo',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.futbolred.com/rss',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'gol-caracol',
    name: 'Gol Caracol',
    url: 'https://www.golcaracol.com',
    category: 'deportivo',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.golcaracol.com/rss',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 12,
  },
  {
    id: 'as-colombia',
    name: 'AS Colombia',
    url: 'https://colombia.as.com',
    category: 'deportivo',
    scrapingMethod: 'rss',
    rssUrl: 'https://colombia.as.com/rss',
    isActive: true,
    maxRequestsPerHour: 12,
  },
  {
    id: 'marca-claro',
    name: 'Marca Claro',
    url: 'https://www.marca.com/claro-co.html',
    category: 'deportivo',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.marca.com/claro-co/rss.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'espn-colombia',
    name: 'ESPN Colombia',
    url: 'https://www.espn.com.co',
    category: 'deportivo',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.espn.com.co/espn/rss',
    isActive: true,
    maxRequestsPerHour: 10,
  },

  // ========== MEDIOS ADICIONALES (5) ==========
  {
    id: 'el-palpitar',
    name: 'El Palpitar',
    url: 'https://elpalpitar.com',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://elpalpitar.com/feed/',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 8,
  },
  {
    id: 'red-mas-noticias',
    name: 'Red+ Noticias',
    url: 'https://www.redmas.com.co',
    category: 'nacional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.redmas.com.co/sitemap.xml',
    isActive: true,
    maxRequestsPerHour: 10,
  },
  {
    id: 'canal-1',
    name: 'Canal 1',
    url: 'https://www.canaluno.com.co',
    category: 'nacional',
    scrapingMethod: 'sitemap',
    sitemapUrl: 'https://www.canaluno.com.co/sitemap.xml',
    isActive: false, // feed roto (404/err) verificado
    maxRequestsPerHour: 10,
  },
  {
    id: 'colombia-informa',
    name: 'Colombia Informa',
    url: 'https://www.colombiainforma.info',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.colombiainforma.info/feed/',
    isActive: true,
    maxRequestsPerHour: 8,
  },
  {
    id: 'contagio-radio',
    name: 'Contagio Radio',
    url: 'https://www.contagioradio.com',
    category: 'digital',
    scrapingMethod: 'rss',
    rssUrl: 'https://www.contagioradio.com/feed/',
    isActive: true,
    maxRequestsPerHour: 8,
  },
];

/**
 * Obtiene un sitio por su ID
 */
export function getSiteById(siteId: string): NewsSiteConfig | undefined {
  return NEWS_SITES_CONFIG.find(site => site.id === siteId);
}

/**
 * Obtiene sitios por categoría
 */
export function getSitesByCategory(category: SiteCategory): NewsSiteConfig[] {
  return NEWS_SITES_CONFIG.filter(site => site.category === category && site.isActive);
}

/**
 * Obtiene todos los sitios activos
 */
export function getActiveSites(): NewsSiteConfig[] {
  return NEWS_SITES_CONFIG.filter(site => site.isActive);
}

/**
 * Obtiene sitios por método de scraping
 */
export function getSitesByMethod(method: ScrapingMethod): NewsSiteConfig[] {
  return NEWS_SITES_CONFIG.filter(site => site.scrapingMethod === method && site.isActive);
}

/**
 * Estadísticas de sitios configurados
 */
export function getSitesStats() {
  const total = NEWS_SITES_CONFIG.length;
  const active = NEWS_SITES_CONFIG.filter(s => s.isActive).length;
  const byCategory = NEWS_SITES_CONFIG.reduce((acc, site) => {
    acc[site.category] = (acc[site.category] || 0) + 1;
    return acc;
  }, {} as Record<SiteCategory, number>);
  const byMethod = NEWS_SITES_CONFIG.reduce((acc, site) => {
    acc[site.scrapingMethod] = (acc[site.scrapingMethod] || 0) + 1;
    return acc;
  }, {} as Record<ScrapingMethod, number>);

  return {
    total,
    active,
    byCategory,
    byMethod,
  };
}
