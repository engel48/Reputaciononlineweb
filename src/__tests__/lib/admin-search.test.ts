import { describe, it, expect } from 'vitest';
import { sanitizeSearch } from '@/lib/admin/search';

describe('sanitizeSearch', () => {
  it('devuelve cadena vacía para null/undefined/vacío', () => {
    expect(sanitizeSearch(null)).toBe('');
    expect(sanitizeSearch(undefined)).toBe('');
    expect(sanitizeSearch('')).toBe('');
  });

  it('quita caracteres peligrosos para filtros .or() de PostgREST', () => {
    // comas, paréntesis, comodines y backslash no deben sobrevivir
    expect(sanitizeSearch('juan,perez')).toBe('juan perez');
    expect(sanitizeSearch('a)or(b')).toBe('a or b');
    expect(sanitizeSearch('100%*\\x')).toBe('100 x');
  });

  it('colapsa espacios y recorta', () => {
    expect(sanitizeSearch('  hola   mundo  ')).toBe('hola mundo');
  });

  it('acota la longitud a 100 caracteres', () => {
    const long = 'a'.repeat(250);
    expect(sanitizeSearch(long).length).toBe(100);
  });

  it('preserva texto normal', () => {
    expect(sanitizeSearch('reputacion online')).toBe('reputacion online');
  });
});
