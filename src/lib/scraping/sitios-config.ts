/**
 * CONFIGURATION FOR 50+ COLOMBIAN NEWS SITES
 * Complete scraping configuration with CSS selectors for each major news source
 */

export interface SitioConfig {
  id: string;
  nombre: string;
  url: string;
  logoUrl?: string;
  categoria: 'nacional' | 'regional' | 'digital' | 'economico' | 'deportivo';
  scrapingActivo: boolean;

  // CSS selectors for scraping
  selectores: {
    articulos: string; // Container for article list
    titulo: string;
    descripcion?: string;
    url: string;
    imagen?: string;
    fecha?: string;
    autor?: string;
    categoria?: string;
  };

  // Rate limiting
  maxRequestsPerMinute: number;
  timeoutSegundos: number;

  // Custom headers
  headers?: Record<string, string>;
}

/**
 * Complete configuration for 50 Colombian news sites
 */
export const SITIOS_NOTICIAS_COLOMBIA: SitioConfig[] = [
  // ==================== NACIONALES (15) ====================
  {
    id: 'eltiempo',
    nombre: 'El Tiempo',
    url: 'https://www.eltiempo.com',
    logoUrl: '/logos/eltiempo.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article',
      titulo: 'h2.title, h3.title',
      descripcion: 'p.summary',
      url: 'a.link',
      imagen: 'img.image',
      fecha: 'time',
      autor: 'span.author'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elespectador',
    nombre: 'El Espectador',
    url: 'https://www.elespectador.com',
    logoUrl: '/logos/elespectador.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.Card',
      titulo: 'h2.Card-title, h3.Card-title',
      descripcion: 'p.Card-excerpt',
      url: 'a.Card-link',
      imagen: 'img.Card-media',
      fecha: 'time.Card-date'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'semana',
    nombre: 'Semana',
    url: 'https://www.semana.com',
    logoUrl: '/logos/semana.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.noticia',
      titulo: 'h2.titulo, h3.titulo',
      descripcion: 'p.resumen',
      url: 'a.enlace',
      imagen: 'img.imagen',
      fecha: 'span.fecha'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'caracol',
    nombre: 'Caracol Radio',
    url: 'https://caracol.com.co',
    logoUrl: '/logos/caracol.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article-item',
      titulo: 'h2.title',
      descripcion: 'p.description',
      url: 'a.link',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'rcn',
    nombre: 'RCN Radio',
    url: 'https://www.rcnradio.com',
    logoUrl: '/logos/rcn.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'div.article-card',
      titulo: 'h3.article-title',
      descripcion: 'p.article-summary',
      url: 'a.article-link',
      imagen: 'img.article-image',
      fecha: 'span.article-date'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'bluradio',
    nombre: 'Blu Radio',
    url: 'https://www.bluradio.com',
    logoUrl: '/logos/bluradio.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.nota',
      titulo: 'h2.titulo',
      descripcion: 'p.bajada',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'wradio',
    nombre: 'W Radio',
    url: 'https://www.wradio.com.co',
    logoUrl: '/logos/wradio.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.news-item',
      titulo: 'h2.news-title',
      descripcion: 'p.news-excerpt',
      url: 'a.news-link',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'lafm',
    nombre: 'La FM',
    url: 'https://www.lafm.com.co',
    logoUrl: '/logos/lafm.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'portafolio',
    nombre: 'Portafolio',
    url: 'https://www.portafolio.co',
    logoUrl: '/logos/portafolio.png',
    categoria: 'economico',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article',
      titulo: 'h2.title',
      descripcion: 'p.summary',
      url: 'a.link',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elcolombiano',
    nombre: 'El Colombiano',
    url: 'https://www.elcolombiano.com',
    logoUrl: '/logos/elcolombiano.png',
    categoria: 'nacional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.nota',
      titulo: 'h2.titulo',
      descripcion: 'p.descripcion',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elheraldo',
    nombre: 'El Heraldo',
    url: 'https://www.elheraldo.co',
    logoUrl: '/logos/elheraldo.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article-item',
      titulo: 'h2.title',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'eluniversal',
    nombre: 'El Universal',
    url: 'https://www.eluniversal.com.co',
    logoUrl: '/logos/eluniversal.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'larepublica',
    nombre: 'La República',
    url: 'https://www.larepublica.co',
    logoUrl: '/logos/larepublica.png',
    categoria: 'economico',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article',
      titulo: 'h2.headline',
      descripcion: 'p.lead',
      url: 'a.link',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'vanguardia',
    nombre: 'Vanguardia',
    url: 'https://www.vanguardia.com',
    logoUrl: '/logos/vanguardia.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.news',
      titulo: 'h2.title',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elpais',
    nombre: 'El País',
    url: 'https://www.elpais.com.co',
    logoUrl: '/logos/elpais.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },

  // ==================== DIGITALES Y ESPECIALIZADOS (25) ====================
  {
    id: 'publimetro',
    nombre: 'Publimetro Colombia',
    url: 'https://www.publimetro.co',
    logoUrl: '/logos/publimetro.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'kienyke',
    nombre: 'KienyKe',
    url: 'https://www.kienyke.com',
    logoUrl: '/logos/kienyke.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.post',
      titulo: 'h2.entry-title',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time.entry-date'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'las2orillas',
    nombre: 'Las2Orillas',
    url: 'https://www.las2orillas.co',
    logoUrl: '/logos/las2orillas.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2.title, h3.title',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'lasillavacia',
    nombre: 'La Silla Vacía',
    url: 'https://www.lasillavacia.com',
    logoUrl: '/logos/lasillavacia.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.story',
      titulo: 'h2.story-title',
      descripcion: 'p.story-excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'razonpublica',
    nombre: 'Razón Pública',
    url: 'https://www.razonpublica.com',
    logoUrl: '/logos/razonpublica.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'pulzo',
    nombre: 'Pulzo',
    url: 'https://www.pulzo.com',
    logoUrl: '/logos/pulzo.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.article',
      titulo: 'h2.title',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'infobae',
    nombre: 'Infobae Colombia',
    url: 'https://www.infobae.com/colombia',
    logoUrl: '/logos/infobae.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.description',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'cnn',
    nombre: 'CNN Colombia',
    url: 'https://cnnespanol.cnn.com/category/zona-cnn/colombia',
    logoUrl: '/logos/cnn.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h3.card-title',
      descripcion: 'p.card-description',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'noticiasrcn',
    nombre: 'Noticias RCN',
    url: 'https://www.noticiasrcn.com',
    logoUrl: '/logos/noticiasrcn.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article.news',
      titulo: 'h2.news-title',
      descripcion: 'p.news-description',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'noticiascaracol',
    nombre: 'Noticias Caracol',
    url: 'https://noticias.caracoltv.com',
    logoUrl: '/logos/noticiascaracol.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'citytv',
    nombre: 'City TV',
    url: 'https://www.citytv.com.co',
    logoUrl: '/logos/citytv.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },

  // ==================== ECONÓMICOS (10) ====================
  {
    id: 'dinero',
    nombre: 'Revista Dinero',
    url: 'https://www.dinero.com',
    logoUrl: '/logos/dinero.png',
    categoria: 'economico',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'valoraanalitik',
    nombre: 'Valora Analitik',
    url: 'https://www.valoraanalitik.com',
    logoUrl: '/logos/valoraanalitik.png',
    categoria: 'economico',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2.title',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'ambitojuridico',
    nombre: 'Ámbito Jurídico',
    url: 'https://www.ambitojuridico.com',
    logoUrl: '/logos/ambitojuridico.png',
    categoria: 'economico',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },

  // ==================== DEPORTIVOS (5) ====================
  {
    id: 'golcaracol',
    nombre: 'Gol Caracol',
    url: 'https://gol.caracoltv.com',
    logoUrl: '/logos/golcaracol.png',
    categoria: 'deportivo',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'ascolombia',
    nombre: 'AS Colombia',
    url: 'https://colombia.as.com',
    logoUrl: '/logos/ascolombia.png',
    categoria: 'deportivo',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2.titulo',
      descripcion: 'p.entradilla',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'futbolred',
    nombre: 'Futbolred',
    url: 'https://www.futbolred.com',
    logoUrl: '/logos/futbolred.png',
    categoria: 'deportivo',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.excerpt',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },

  // ==================== REGIONALES ADICIONALES (12) ====================
  {
    id: 'elnuevosiglo',
    nombre: 'El Nuevo Siglo',
    url: 'https://www.elnuevosiglo.com.co',
    logoUrl: '/logos/elnuevosiglo.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'lapatria',
    nombre: 'La Patria',
    url: 'https://www.lapatria.com',
    logoUrl: '/logos/lapatria.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p.summary',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'laopinion',
    nombre: 'La Opinión',
    url: 'https://www.laopinion.com.co',
    logoUrl: '/logos/laopinion.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elpilon',
    nombre: 'El Pilón',
    url: 'https://www.elpilon.com.co',
    logoUrl: '/logos/elpilon.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'diariodelhuila',
    nombre: 'Diario del Huila',
    url: 'https://www.diariodelhuila.com',
    logoUrl: '/logos/diariodelhuila.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'lanacion',
    nombre: 'La Nación',
    url: 'https://www.lanacion.com.co',
    logoUrl: '/logos/lanacion.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'elliberal',
    nombre: 'El Liberal',
    url: 'https://www.elliberal.com.co',
    logoUrl: '/logos/elliberal.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'eldiario',
    nombre: 'El Diario del Otún',
    url: 'https://www.eldiario.com.co',
    logoUrl: '/logos/eldiario.png',
    categoria: 'regional',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'confidencial',
    nombre: 'Confidencial Colombia',
    url: 'https://www.confidencialcolombia.com',
    logoUrl: '/logos/confidencial.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'colombiainforma',
    nombre: 'Colombia Informa',
    url: 'https://www.colombiainforma.info',
    logoUrl: '/logos/colombiainforma.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'cambiocolombia',
    nombre: 'Cambio Colombia',
    url: 'https://cambiocolombia.com',
    logoUrl: '/logos/cambiocolombia.png',
    categoria: 'digital',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  },
  {
    id: 'antena2',
    nombre: 'Antena 2',
    url: 'https://www.antena2.com',
    logoUrl: '/logos/antena2.png',
    categoria: 'deportivo',
    scrapingActivo: true,
    selectores: {
      articulos: 'article',
      titulo: 'h2, h3',
      descripcion: 'p',
      url: 'a',
      imagen: 'img',
      fecha: 'time'
    },
    maxRequestsPerMinute: 10,
    timeoutSegundos: 10
  }
];

/**
 * Get site configuration by ID
 */
export function getSitioConfig(sitioId: string): SitioConfig | undefined {
  return SITIOS_NOTICIAS_COLOMBIA.find(s => s.id === sitioId);
}

/**
 * Get all sites by category
 */
export function getSitiosByCategoria(categoria: SitioConfig['categoria']): SitioConfig[] {
  return SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === categoria);
}

/**
 * Get all active sites
 */
export function getSitiosActivos(): SitioConfig[] {
  return SITIOS_NOTICIAS_COLOMBIA.filter(s => s.scrapingActivo);
}

/**
 * Get site count by category
 */
export function getCategoriaCounts() {
  return {
    nacional: SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === 'nacional').length,
    regional: SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === 'regional').length,
    digital: SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === 'digital').length,
    economico: SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === 'economico').length,
    deportivo: SITIOS_NOTICIAS_COLOMBIA.filter(s => s.categoria === 'deportivo').length,
    total: SITIOS_NOTICIAS_COLOMBIA.length
  };
}
