/**
 * Tipos TypeScript para el Sistema de Monitoreo de Noticias
 * Reputación Online - Colombia
 */

export interface AvailableSite {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: 'nacional' | 'regional' | 'especializado' | 'digital';
  description: string;
  isMonitored?: boolean;
}

export interface MonitoredSite {
  id: string;
  userId: string;
  siteId: string;
  siteName: string;
  siteLogo: string;
  siteUrl: string;
  searchTerms: string[];
  scanFrequency: 'every15min' | 'hourly' | 'every6hours' | 'daily';
  isActive: boolean;
  totalMentions: number;
  newMentions: number;
  lastChecked: Date | null;
  activatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Mention {
  id: string;
  monitoredSiteId: string;
  siteId: string;
  siteName: string;
  siteLogo: string;
  articleTitle: string;
  articleUrl: string;
  articleContent: string;
  mentionContext: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  publishedDate: Date;
  discoveredAt: Date;
  isRead: boolean;
  matchedTerm: string;
  author?: string;
  imageUrl?: string;
}

export interface MentionStats {
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  mentionsBySite: Record<string, number>;
  mentionsByDay: Array<{
    date: string;
    count: number;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  topSites: Array<{
    siteId: string;
    siteName: string;
    count: number;
  }>;
}

export interface ScanStatus {
  isScanning: boolean;
  lastScanTime: Date | null;
  nextScanTime: Date | null;
  currentSite?: string;
  progress?: number;
}

export type SentimentFilter = 'all' | 'positive' | 'negative' | 'neutral';
export type DateFilter = 'today' | 'week' | 'month' | 'all';
export type ScanFrequency = 'every15min' | 'hourly' | 'every6hours' | 'daily';

export const SCAN_FREQUENCY_LABELS: Record<ScanFrequency, string> = {
  every15min: 'Cada 15 minutos',
  hourly: 'Cada hora',
  every6hours: 'Cada 6 horas',
  daily: 'Diario',
};

export const MAX_MONITORED_SITES = 10;

export interface MonitoringFilters {
  sentimentFilter: SentimentFilter;
  siteFilter: string | null;
  dateFilter: DateFilter;
  searchTerm: string;
}

export interface MonitoringState {
  sitiosMonitoreados: MonitoredSite[];
  mencionesRecientes: Mention[];
  sitiosDisponibles: AvailableSite[];
  stats: MentionStats | null;
  scanStatus: ScanStatus;
  filters: MonitoringFilters;
  loading: boolean;
  error: string | null;
}

// Sitios de noticias colombianos disponibles
export const COLOMBIAN_NEWS_SITES: AvailableSite[] = [
  // Nacionales - Principales
  {
    id: 'el-tiempo',
    name: 'El Tiempo',
    logo: '📰',
    url: 'https://www.eltiempo.com',
    category: 'nacional',
    description: 'Principal diario de Colombia',
  },
  {
    id: 'el-espectador',
    name: 'El Espectador',
    logo: '📰',
    url: 'https://www.elespectador.com',
    category: 'nacional',
    description: 'Diario nacional con énfasis en política',
  },
  {
    id: 'semana',
    name: 'Semana',
    logo: '📰',
    url: 'https://www.semana.com',
    category: 'nacional',
    description: 'Revista de actualidad y política',
  },
  {
    id: 'portafolio',
    name: 'Portafolio',
    logo: '💼',
    url: 'https://www.portafolio.co',
    category: 'especializado',
    description: 'Noticias de economía y negocios',
  },
  {
    id: 'la-republica',
    name: 'La República',
    logo: '💼',
    url: 'https://www.larepublica.co',
    category: 'especializado',
    description: 'Periódico económico y empresarial',
  },

  // Digitales
  {
    id: 'rcn-radio',
    name: 'RCN Radio',
    logo: '📻',
    url: 'https://www.rcnradio.com',
    category: 'digital',
    description: 'Noticias de radio y digital',
  },
  {
    id: 'caracol-radio',
    name: 'Caracol Radio',
    logo: '📻',
    url: 'https://www.caracol.com.co',
    category: 'digital',
    description: 'Radio y noticias en línea',
  },
  {
    id: 'blu-radio',
    name: 'Blu Radio',
    logo: '📻',
    url: 'https://www.bluradio.com',
    category: 'digital',
    description: 'Emisora con portal de noticias',
  },
  {
    id: 'w-radio',
    name: 'W Radio',
    logo: '📻',
    url: 'https://www.wradio.com.co',
    category: 'digital',
    description: 'Noticias y análisis político',
  },
  {
    id: 'city-tv',
    name: 'CityTv',
    logo: '📺',
    url: 'https://www.citytv.com.co',
    category: 'digital',
    description: 'Canal local de Bogotá',
  },

  // Regionales
  {
    id: 'el-colombiano',
    name: 'El Colombiano',
    logo: '📰',
    url: 'https://www.elcolombiano.com',
    category: 'regional',
    description: 'Principal diario de Antioquia',
  },
  {
    id: 'el-pais',
    name: 'El País (Cali)',
    logo: '📰',
    url: 'https://www.elpais.com.co',
    category: 'regional',
    description: 'Diario del Valle del Cauca',
  },
  {
    id: 'vanguardia',
    name: 'Vanguardia',
    logo: '📰',
    url: 'https://www.vanguardia.com',
    category: 'regional',
    description: 'Periódico de Santander',
  },
  {
    id: 'el-heraldo',
    name: 'El Heraldo',
    logo: '📰',
    url: 'https://www.elheraldo.co',
    category: 'regional',
    description: 'Diario de Barranquilla',
  },
  {
    id: 'el-universal',
    name: 'El Universal',
    logo: '📰',
    url: 'https://www.eluniversal.com.co',
    category: 'regional',
    description: 'Periódico de Cartagena',
  },

  // Especializados
  {
    id: 'las-dos-orillas',
    name: 'Las 2 Orillas',
    logo: '💬',
    url: 'https://www.las2orillas.co',
    category: 'digital',
    description: 'Medio digital de opinión',
  },
  {
    id: 'la-silla-vacia',
    name: 'La Silla Vacía',
    logo: '🪑',
    url: 'https://www.lasillavacia.com',
    category: 'especializado',
    description: 'Periodismo político y análisis',
  },
  {
    id: 'las-noticias',
    name: 'Noticias Caracol',
    logo: '📺',
    url: 'https://noticias.caracoltv.com',
    category: 'digital',
    description: 'Portal de noticias Caracol TV',
  },
  {
    id: 'noticias-rcn',
    name: 'Noticias RCN',
    logo: '📺',
    url: 'https://www.noticiasrcn.com',
    category: 'digital',
    description: 'Noticias del canal RCN',
  },
  {
    id: 'pulzo',
    name: 'Pulzo',
    logo: '📱',
    url: 'https://www.pulzo.com',
    category: 'digital',
    description: 'Portal de noticias digitales',
  },

  // Más nacionales
  {
    id: 'el-nuevo-siglo',
    name: 'El Nuevo Siglo',
    logo: '📰',
    url: 'https://www.elnuevosiglo.com.co',
    category: 'nacional',
    description: 'Diario político',
  },
  {
    id: 'la-fm',
    name: 'La FM',
    logo: '📻',
    url: 'https://www.lafm.com.co',
    category: 'digital',
    description: 'Radio con noticias nacionales',
  },
  {
    id: 'kienyke',
    name: 'KienyKe',
    logo: '📱',
    url: 'https://www.kienyke.com',
    category: 'digital',
    description: 'Medio digital de investigación',
  },
  {
    id: 'cambio',
    name: 'Cambio',
    logo: '📰',
    url: 'https://www.cambio.com.co',
    category: 'digital',
    description: 'Revista digital de política',
  },
  {
    id: 'publimetro',
    name: 'Publimetro',
    logo: '📰',
    url: 'https://www.publimetro.co',
    category: 'nacional',
    description: 'Diario gratuito',
  },

  // Regionales adicionales
  {
    id: 'la-opinion',
    name: 'La Opinión',
    logo: '📰',
    url: 'https://www.laopinion.com.co',
    category: 'regional',
    description: 'Diario de Cúcuta',
  },
  {
    id: 'el-diario',
    name: 'El Diario del Otún',
    logo: '📰',
    url: 'https://www.eldiario.com.co',
    category: 'regional',
    description: 'Periódico de Pereira',
  },
  {
    id: 'el-liberal',
    name: 'El Liberal',
    logo: '📰',
    url: 'https://www.elliberal.com.co',
    category: 'regional',
    description: 'Diario de Popayán',
  },
  {
    id: 'el-informador',
    name: 'El Informador',
    logo: '📰',
    url: 'https://www.elinformador.com.co',
    category: 'regional',
    description: 'Periódico de Santa Marta',
  },
  {
    id: 'la-tarde',
    name: 'La Tarde',
    logo: '📰',
    url: 'https://www.latarde.com',
    category: 'regional',
    description: 'Diario de Pereira',
  },

  // Especializados adicionales
  {
    id: 'dinero',
    name: 'Dinero',
    logo: '💰',
    url: 'https://www.dinero.com',
    category: 'especializado',
    description: 'Revista de economía y finanzas',
  },
  {
    id: 'enter-co',
    name: 'Enter.co',
    logo: '💻',
    url: 'https://www.enter.co',
    category: 'especializado',
    description: 'Tecnología y emprendimiento',
  },
  {
    id: 'el-pais-digital',
    name: 'El País Digital',
    logo: '📱',
    url: 'https://www.elpais.com.co',
    category: 'digital',
    description: 'Versión digital del diario',
  },
  {
    id: 'razon-publica',
    name: 'Razón Pública',
    logo: '📚',
    url: 'https://www.razonpublica.com',
    category: 'especializado',
    description: 'Análisis político y académico',
  },
  {
    id: 'cerosetenta',
    name: 'Cerosetenta',
    logo: '📖',
    url: 'https://cerosetenta.uniandes.edu.co',
    category: 'especializado',
    description: 'Periodismo de investigación',
  },

  // Digitales adicionales
  {
    id: 'infobae-colombia',
    name: 'Infobae Colombia',
    logo: '🌎',
    url: 'https://www.infobae.com/colombia',
    category: 'digital',
    description: 'Portal de noticias internacional',
  },
  {
    id: 'elespanol-colombia',
    name: 'El Español Colombia',
    logo: '🌐',
    url: 'https://www.elespanol.com/colombia',
    category: 'digital',
    description: 'Noticias internacionales',
  },
  {
    id: 'colprensa',
    name: 'Colprensa',
    logo: '📰',
    url: 'https://www.colprensa.com',
    category: 'digital',
    description: 'Agencia de prensa colombiana',
  },
  {
    id: 'credencial',
    name: 'Credencial',
    logo: '📚',
    url: 'https://www.revistacredencial.com',
    category: 'especializado',
    description: 'Revista de historia y cultura',
  },
  {
    id: 'shock',
    name: 'Shock',
    logo: '🎵',
    url: 'https://www.shock.co',
    category: 'especializado',
    description: 'Entretenimiento y cultura',
  },

  // Más regionales
  {
    id: 'hoy-diario',
    name: 'Hoy Diario del Magdalena',
    logo: '📰',
    url: 'https://www.hoydiariodelmagdalena.com.co',
    category: 'regional',
    description: 'Diario del Magdalena',
  },
  {
    id: 'la-patria',
    name: 'La Patria',
    logo: '📰',
    url: 'https://www.lapatria.com',
    category: 'regional',
    description: 'Periódico de Manizales',
  },
  {
    id: 'periodismo-publico',
    name: 'Periodismo Público',
    logo: '📰',
    url: 'https://periodismopublico.com',
    category: 'digital',
    description: 'Periodismo independiente',
  },
  {
    id: 'la-cronica',
    name: 'La Crónica del Quindío',
    logo: '📰',
    url: 'https://www.cronicadelquindio.com',
    category: 'regional',
    description: 'Diario del Quindío',
  },
  {
    id: 'el-debate',
    name: 'El Debate',
    logo: '📰',
    url: 'https://www.debate.com.mx/colombia',
    category: 'digital',
    description: 'Portal de noticias',
  },

  // Digitales finales
  {
    id: 'contagio-radio',
    name: 'Contagio Radio',
    logo: '📻',
    url: 'https://www.contagioradio.com',
    category: 'digital',
    description: 'Radio comunitaria',
  },
  {
    id: 'pacifista',
    name: 'Pacifista',
    logo: '✌️',
    url: 'https://pacifista.tv',
    category: 'especializado',
    description: 'Periodismo de paz',
  },
  {
    id: 'vorágine',
    name: 'Vorágine',
    logo: '🌿',
    url: 'https://www.voragine.co',
    category: 'especializado',
    description: 'Periodismo ambiental',
  },
];
