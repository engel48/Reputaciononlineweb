import { systemSettingsService } from '@/lib/database-adapter';

/**
 * Configuración y calibración del comportamiento de la IA Julia.
 * La administra el panel admin (/admin/ia) y se aplica en la llamada a Groq
 * (`src/lib/ai-service.ts`) y en la lógica de reincidencia del chat
 * (`src/app/api/julia/route.ts`).
 */
export interface AiConfig {
  /** Adherencia al rol: 0 = muy estructurada, 1.5 = muy fluida/creativa. */
  temperature: number;
  /** Tope de tokens de la respuesta. */
  maxTokens: number;
  /** Penalización de frecuencia (0–2): evita repetir las mismas palabras. */
  frequencyPenalty: number;
  /** Penalización de presencia (0–2): evita repetir los mismos temas/bucles. */
  presencePenalty: number;
  /** Umbral de reincidencia: tras N mensajes fuera de contexto seguidos, redirige. 0 = desactivado. */
  maxOffContextAttempts: number;
  /** Mensaje de redirección al superar el umbral. */
  redirectMessage: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  maxOffContextAttempts: 3,
  redirectMessage:
    'Parece que nos estamos desviando del tema. Te regreso al menú principal para ayudarte mejor con tu reputación online. 🧭',
};

export const AI_CONFIG_KEY = 'ai_config';

function clampNum(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

/** Sanea/acota cualquier objeto entrante a un AiConfig válido. */
export function normalizeAiConfig(raw: unknown): AiConfig {
  const r = (raw || {}) as Record<string, unknown>;
  const msg = typeof r.redirectMessage === 'string' ? r.redirectMessage.trim() : '';
  return {
    temperature: clampNum(r.temperature, 0, 1.5, DEFAULT_AI_CONFIG.temperature),
    maxTokens: Math.round(clampNum(r.maxTokens, 256, 4096, DEFAULT_AI_CONFIG.maxTokens)),
    frequencyPenalty: clampNum(r.frequencyPenalty, 0, 2, DEFAULT_AI_CONFIG.frequencyPenalty),
    presencePenalty: clampNum(r.presencePenalty, 0, 2, DEFAULT_AI_CONFIG.presencePenalty),
    maxOffContextAttempts: Math.round(clampNum(r.maxOffContextAttempts, 0, 10, DEFAULT_AI_CONFIG.maxOffContextAttempts)),
    redirectMessage: msg ? msg.slice(0, 500) : DEFAULT_AI_CONFIG.redirectMessage,
  };
}

/** Lee la config guardada (system_settings) con fallback a defaults. */
export async function getAiConfig(): Promise<AiConfig> {
  try {
    const setting = await systemSettingsService.get(AI_CONFIG_KEY);
    if (setting?.value) {
      return normalizeAiConfig(JSON.parse(setting.value));
    }
  } catch (e) {
    console.warn('⚠️ getAiConfig: usando defaults:', e);
  }
  return { ...DEFAULT_AI_CONFIG };
}

/** Persiste la config (JSON en system_settings). */
export async function saveAiConfig(config: unknown, updatedBy?: string): Promise<AiConfig> {
  const normalized = normalizeAiConfig(config);
  await systemSettingsService.set(
    AI_CONFIG_KEY,
    JSON.stringify(normalized),
    'Calibración del comportamiento de la IA Julia',
    updatedBy || 'admin',
  );
  return normalized;
}
