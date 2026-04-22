/**
 * Helpers compartidos entre los 4 componentes {Platform}DashboardSection.
 * Antes estas funciones estaban duplicadas (inline) en cada archivo.
 */

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Regular';
  return 'Bajo';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#00E5FF]';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

export function calculateApprovalRating(positive: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((positive / total) * 100);
}

export interface TrendIndicator {
  Icon: LucideIcon;
  color: string;
  label: string;
}

export function getTrendIndicator(
  trend: 'improving' | 'declining' | 'stable' | string
): TrendIndicator {
  switch (trend) {
    case 'improving':
      return { Icon: TrendingUp, color: 'text-green-500', label: 'Mejorando' };
    case 'declining':
      return { Icon: TrendingDown, color: 'text-red-500', label: 'Declinando' };
    default:
      return { Icon: Minus, color: 'text-gray-500', label: 'Estable' };
  }
}

export function formatLastSync(date: string | null | undefined): string {
  if (!date) return 'Nunca';
  try {
    return new Date(date).toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(date);
  }
}

/**
 * Detecta si una mención es crítica (sentimiento muy negativo).
 * Acepta tanto score normalizado (-1..1) como 0..100.
 */
export function isCriticalMention(metadata: any): boolean {
  if (!metadata) return false;
  const s = (metadata.sentiment || '').toLowerCase();
  if (s !== 'negative') return false;
  const score = typeof metadata.sentiment_score === 'number' ? metadata.sentiment_score : null;
  if (score === null) return false;
  // Rango -1..1 → crítico si < -0.5
  if (score >= -1 && score <= 1) return score < -0.5;
  // Rango 0..100 → crítico si < 25
  return score < 25;
}

/**
 * Clasifica una mención según el source_type de su metadata.
 * - 'own' → comentario en post/video propio
 * - 'external' → mención de tercero (tagged, external_mention, etc.)
 * - 'other' → sin clasificar
 */
export function classifyMention(metadata: any): 'own' | 'external' | 'other' {
  const src = String(metadata?.source_type || '').toLowerCase();
  if (!src) return 'other';
  if (src.startsWith('comment_on_own')) return 'own';
  if (src.startsWith('external_')) return 'external';
  return 'other';
}
