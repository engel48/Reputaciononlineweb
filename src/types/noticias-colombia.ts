/**
 * Tipos TypeScript para el sistema de Noticias de Colombia en Tiempo Real
 *
 * Este archivo define las interfaces y tipos para:
 * - Sitios de noticias colombianos
 * - Noticias individuales scrapeadas
 * - Estados de carga y filtrado
 * - Categorías de noticias
 */

/**
 * Categorías de sitios de noticias colombianos
 */
export type CategoriaSitioNoticia =
  | 'nacional'
  | 'regional'
  | 'digital'
  | 'economico'
  | 'deportivo'
  | 'alternativo'
  | 'internacional';

/**
 * Departamentos de Colombia
 */
export type DepartamentoColombia =
  | 'nacional'
  | 'antioquia'
  | 'atlantico'
  | 'bogota'
  | 'bolivar'
  | 'boyaca'
  | 'caldas'
  | 'caqueta'
  | 'cauca'
  | 'cesar'
  | 'choco'
  | 'cordoba'
  | 'cundinamarca'
  | 'guainia'
  | 'guaviare'
  | 'huila'
  | 'la_guajira'
  | 'magdalena'
  | 'meta'
  | 'narino'
  | 'norte_santander'
  | 'putumayo'
  | 'quindio'
  | 'risaralda'
  | 'san_andres'
  | 'santander'
  | 'sucre'
  | 'tolima'
  | 'valle_del_cauca'
  | 'vaupes'
  | 'vichada';

/**
 * Sitio de noticias colombiano con metadata
 */
export interface SitioNoticiasColombia {
  id: string;
  nombre: string;
  url: string;
  logo?: string;
  categoria: CategoriaSitioNoticia;
  departamento?: DepartamentoColombia;
  descripcion?: string;
  activo: boolean;
  verificado: boolean;
  prioridad: number; // 1-10, donde 10 es más prioritario
}

/**
 * Noticia individual scrapeada
 */
export interface NoticiaColombia {
  id: string;
  sitio_id: string;
  sitio_nombre: string;
  titulo: string;
  descripcion: string;
  contenido?: string;
  url: string;
  imagen_url?: string;
  autor?: string;
  fecha_publicacion: string; // ISO 8601
  fecha_scrapeada: string; // ISO 8601
  categoria: CategoriaSitioNoticia;
  tags?: string[];
  verificada: boolean;
}

/**
 * Respuesta de la API de sitios
 */
export interface SitiosNoticiasResponse {
  success: boolean;
  sitios: SitioNoticiasColombia[];
  total: number;
  categorias: CategoriaSitioNoticia[];
}

/**
 * Respuesta de la API de scraping
 */
export interface ScrapingNoticiasResponse {
  success: boolean;
  noticias: NoticiaColombia[];
  total: number;
  sitio: SitioNoticiasColombia;
  cached: boolean;
  scraped_at: string; // ISO 8601
  error?: string;
}

/**
 * Estado del componente de noticias
 */
export interface NoticiasColombiaState {
  sitioSeleccionado: string | null;
  noticias: NoticiaColombia[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  categoriaFiltro: CategoriaSitioNoticia | 'todas';
  busqueda: string;
  paginaActual: number;
  noticiasPorPagina: number;
}

/**
 * Props para el componente NoticiasColombia
 */
export interface NoticiasColombiaProps {
  className?: string;
  showSelector?: boolean;
  sitioInicial?: string;
  categoriaInicial?: CategoriaSitioNoticia;
  limite?: number;
}

/**
 * Props para el componente SelectorSitiosNoticias
 */
export interface SelectorSitiosNoticiasProps {
  sitios: SitioNoticiasColombia[];
  sitioSeleccionado: string | null;
  onSitioChange: (sitioId: string) => void;
  categoriaFiltro: CategoriaSitioNoticia | 'todas';
  onCategoriaChange: (categoria: CategoriaSitioNoticia | 'todas') => void;
  busqueda: string;
  onBusquedaChange: (busqueda: string) => void;
  loading?: boolean;
}

/**
 * Props para el componente NoticiaCard
 */
export interface NoticiaCardProps {
  noticia: NoticiaColombia;
  onClick?: (noticia: NoticiaColombia) => void;
  className?: string;
  showSitio?: boolean;
  showImagen?: boolean;
}
