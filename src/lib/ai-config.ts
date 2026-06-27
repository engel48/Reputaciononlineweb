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
  /** Mensaje estandarizado de salida de contexto (cada desvío, antes de llegar al umbral). */
  outOfScopeMessage: string;
  /** Mensaje de redirección al menú principal al superar el umbral. */
  redirectMessage: string;
  /** Cortafuegos de seguridad: frases/palabras de alta prioridad que suspenden el LLM. */
  crisisKeywords: string[];
  /** Banner/mensaje prioritario a mostrar cuando se detecta una palabra de crisis. */
  crisisMessage: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  maxOffContextAttempts: 3,
  outOfScopeMessage:
    'Soy Julia, tu asistente de reputación online. Ese tema está fuera de mi alcance. ¿Querés que te ayude con tus menciones, sentimiento, crisis o redes? Elegí una de las sugerencias para empezar. 🙂',
  redirectMessage:
    'Parece que nos estamos desviando del tema. Te regreso al menú principal para ayudarte mejor con tu reputación online. 🧭',
  crisisKeywords: [],
  crisisMessage:
    'Ese tema está fuera de las funciones de Reputación Online. Puedo ayudarte con monitoreo de menciones, análisis de sentimiento, gestión de crisis de reputación, conexión de redes y reportes. ¿Con cuál querés seguir?',
};

export const AI_CONFIG_KEY = 'ai_config';

function clampNum(v: unknown, min: number, max: number, def: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

function cleanMsg(v: unknown, def: string, max = 800): string {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s.slice(0, max) : def;
}

/** Normaliza una lista de palabras/frases clave (dedup, trim, sin vacíos, tope 200). */
function normalizeKeywords(v: unknown): string[] {
  let arr: string[] = [];
  if (Array.isArray(v)) arr = v.map((x) => String(x));
  else if (typeof v === 'string') arr = v.split(/\r?\n|,/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const k = raw.trim();
    if (!k) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k.slice(0, 120));
    if (out.length >= 200) break;
  }
  return out;
}

/** Sanea/acota cualquier objeto entrante a un AiConfig válido. */
export function normalizeAiConfig(raw: unknown): AiConfig {
  const r = (raw || {}) as Record<string, unknown>;
  return {
    temperature: clampNum(r.temperature, 0, 1.5, DEFAULT_AI_CONFIG.temperature),
    maxTokens: Math.round(clampNum(r.maxTokens, 256, 4096, DEFAULT_AI_CONFIG.maxTokens)),
    frequencyPenalty: clampNum(r.frequencyPenalty, 0, 2, DEFAULT_AI_CONFIG.frequencyPenalty),
    presencePenalty: clampNum(r.presencePenalty, 0, 2, DEFAULT_AI_CONFIG.presencePenalty),
    maxOffContextAttempts: Math.round(clampNum(r.maxOffContextAttempts, 0, 10, DEFAULT_AI_CONFIG.maxOffContextAttempts)),
    outOfScopeMessage: cleanMsg(r.outOfScopeMessage, DEFAULT_AI_CONFIG.outOfScopeMessage),
    redirectMessage: cleanMsg(r.redirectMessage, DEFAULT_AI_CONFIG.redirectMessage, 500),
    crisisKeywords: normalizeKeywords(r.crisisKeywords),
    crisisMessage: cleanMsg(r.crisisMessage, DEFAULT_AI_CONFIG.crisisMessage),
  };
}

/** Quita acentos y pasa a minúsculas para comparar de forma robusta. */
function normalizeForMatch(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/**
 * Cortafuegos: ¿el mensaje contiene alguna palabra/frase de crisis?
 * Compara sin acentos ni mayúsculas (substring). Devuelve la coincidencia o null.
 */
export function detectCrisisKeyword(message: string, keywords: string[]): string | null {
  if (!message || !keywords?.length) return null;
  const m = normalizeForMatch(message);
  for (const kw of keywords) {
    const k = normalizeForMatch(kw).trim();
    if (k && m.includes(k)) return kw;
  }
  return null;
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
