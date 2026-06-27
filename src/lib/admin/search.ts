/**
 * Limpia el texto de búsqueda para usarlo de forma segura dentro de filtros
 * `.or('col.ilike.%TEXTO%,...')` de PostgREST/Supabase.
 *
 * En `.or()` el string es un filtro crudo: una coma agrega condiciones y los
 * paréntesis agrupan, así que un input del usuario con `, ( )` podría romper la
 * consulta o inyectar condiciones. Quitamos esos caracteres (y comodines de
 * control) y acotamos la longitud.
 */
export function sanitizeSearch(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/[,()\\*%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}
