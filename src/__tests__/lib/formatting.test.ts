import { describe, it, expect } from 'vitest';
import { formatNumber, formatCompact, formatPercent, formatCOP } from '@/lib/formatting';

describe('formatting', () => {
  it('formatNumber agrupa miles y maneja valores no finitos', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
    expect(formatNumber(Infinity)).toBe('0');
  });

  it('formatCompact abrevia miles/millones', () => {
    expect(formatCompact(500)).toBe('500');
    expect(formatCompact(1500)).toMatch(/1[.,]5\s?K/i);
    expect(formatCompact(2300000)).toMatch(/2[.,]3\s?M/i);
  });

  it('formatPercent soporta escala 0-100 y 0-1', () => {
    expect(formatPercent(73.2)).toBe('73,2%');
    expect(formatPercent(0.732, 1, true)).toBe('73,2%');
    expect(formatPercent(0)).toBe('0,0%');
  });

  it('formatCOP formatea pesos colombianos sin decimales', () => {
    const out = formatCOP(99000);
    expect(out).toMatch(/99\.000/);
    expect(out).toMatch(/\$/);
  });
});
