/**
 * Utilidades de formato de numeros para la UI (locale es-CO).
 * Centraliza separadores de miles, porcentajes y abreviaturas para que
 * todos los widgets/charts muestren los numeros de forma consistente.
 */

const LOCALE = 'es-CO';

/** 1234567 -> "1.234.567". Devuelve "0" para valores no finitos. */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Numero compacto: 1500 -> "1,5 K", 2300000 -> "2,3 M".
 * Por debajo de 1000 usa formatNumber normal.
 */
export function formatCompact(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (Math.abs(n) < 1000) return formatNumber(n);
  return n.toLocaleString(LOCALE, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
}

/**
 * Porcentaje formateado. Por defecto asume que `value` ya esta en escala 0-100
 * (ej: 73.2 -> "73,2%"). Si tus datos vienen en escala 0-1 pasa fromRatio=true
 * (ej: 0.732 -> "73,2%").
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1,
  fromRatio = false
): string {
  let n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (fromRatio) n = n * 100;
  return `${n.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/** Moneda en pesos colombianos: 99000 -> "$ 99.000". */
export function formatCOP(value: number | null | undefined): string {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return n.toLocaleString(LOCALE, {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}
