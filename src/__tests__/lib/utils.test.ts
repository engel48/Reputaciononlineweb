/**
 * Tests para src/lib/utils.ts (cn helper)
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('une multiples strings con espacios', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora valores falsy (null, undefined, false, 0, "")', () => {
    expect(cn('a', null, undefined, false, '', 'b')).toBe('a b');
  });

  it('soporta arrays anidados', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c');
  });

  it('soporta objetos con condiciones (clsx)', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('twMerge resuelve conflictos de Tailwind (la ultima gana)', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('preserva clases sin conflicto', () => {
    expect(cn('flex items-center', 'gap-2 text-white')).toBe('flex items-center gap-2 text-white');
  });

  it('input vacio retorna string vacio', () => {
    expect(cn()).toBe('');
  });
});
