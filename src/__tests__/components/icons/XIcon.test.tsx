import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { XIcon } from '@/components/icons/XIcon';

describe('XIcon', () => {
  it('renderiza un elemento svg', () => {
    const { container } = render(<XIcon />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('usa viewBox 0 0 24 24 compatible con lucide-react', () => {
    const { container } = render(<XIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('usa fill="currentColor" para que las clases de color funcionen', () => {
    const { container } = render(<XIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
  });

  it('aplica className personalizada', () => {
    const { container } = render(<XIcon className="w-8 h-8 text-white" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('class')).toBe('w-8 h-8 text-white');
  });

  it('contiene el path del nuevo logo de X (no el pajarito viejo)', () => {
    const { container } = render(<XIcon />);
    const path = container.querySelector('svg path');
    const d = path?.getAttribute('d') ?? '';
    expect(d).toContain('M18.244 2.25h3.308');
    expect(d).toContain('z');
  });

  it('marca el icono como aria-hidden para lectores de pantalla', () => {
    const { container } = render(<XIcon />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});
