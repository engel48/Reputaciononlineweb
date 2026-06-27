import { describe, it, expect, vi } from 'vitest';

// Evita cargar la capa de DB al importar ai-config
vi.mock('@/lib/database-adapter', () => ({
  systemSettingsService: { get: vi.fn(), set: vi.fn() },
}));

import { normalizeAiConfig, DEFAULT_AI_CONFIG } from '@/lib/ai-config';

describe('normalizeAiConfig', () => {
  it('acota valores fuera de rango', () => {
    const c = normalizeAiConfig({
      temperature: 9,        // > 1.5 → 1.5
      frequencyPenalty: -1,  // < 0 → 0
      presencePenalty: 5,    // > 2 → 2
      maxTokens: 999999,     // > 4096 → 4096
      maxOffContextAttempts: 99, // > 10 → 10
      redirectMessage: '   ',    // vacío → default
    });
    expect(c.temperature).toBe(1.5);
    expect(c.frequencyPenalty).toBe(0);
    expect(c.presencePenalty).toBe(2);
    expect(c.maxTokens).toBe(4096);
    expect(c.maxOffContextAttempts).toBe(10);
    expect(c.redirectMessage).toBe(DEFAULT_AI_CONFIG.redirectMessage);
  });

  it('usa defaults para campos faltantes o inválidos', () => {
    const c = normalizeAiConfig({ temperature: 'abc' });
    expect(c.temperature).toBe(DEFAULT_AI_CONFIG.temperature);
    expect(c.frequencyPenalty).toBe(DEFAULT_AI_CONFIG.frequencyPenalty);
    expect(c.maxOffContextAttempts).toBe(DEFAULT_AI_CONFIG.maxOffContextAttempts);
  });

  it('conserva valores válidos y recorta el mensaje', () => {
    const c = normalizeAiConfig({
      temperature: 0.4,
      frequencyPenalty: 1.2,
      presencePenalty: 0.8,
      maxTokens: 1024,
      maxOffContextAttempts: 2,
      redirectMessage: 'Volvamos al tema, por favor.',
    });
    expect(c.temperature).toBe(0.4);
    expect(c.frequencyPenalty).toBe(1.2);
    expect(c.maxTokens).toBe(1024);
    expect(c.maxOffContextAttempts).toBe(2);
    expect(c.redirectMessage).toBe('Volvamos al tema, por favor.');
  });
});
