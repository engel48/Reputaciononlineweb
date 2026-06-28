// =====================================================
// Cliente de IA compartido para Edge Functions (Deno).
// Primario: Google Gemini (endpoint OpenAI-compatible) si GEMINI_API_KEY está
// presente; si no, Groq (llama-3.3-70b-versatile). Se conservan los nombres
// callGroq/callGroqStream/parseGroqJson para no tocar las funciones que los usan.
// Cambiar de cuenta Gemini = solo cambiar el secret GEMINI_API_KEY en Supabase.
// =====================================================

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  apiKey?: string;
  stream?: boolean;
  /** Modelo a usar (solo aplica a Gemini). Por defecto Flash. */
  model?: string;
}

// @ts-ignore Deno global disponible en runtime de Edge Functions
const env = (k: string): string | undefined => Deno.env.get(k);

/** Devuelve el contenido de texto de la respuesta de IA. Lanza si falla. */
export async function callGroq(messages: GroqMessage[], opts: GroqOptions = {}): Promise<string> {
  const geminiKey = env('GEMINI_API_KEY');
  const groqKey = opts.apiKey || env('GROQ_API_KEY');

  // 1) Gemini primario si hay key.
  if (geminiKey) {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${geminiKey}` },
      body: JSON.stringify({
        model: opts.model || GEMINI_MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 2048,
        reasoning_effort: 'none', // apaga el "thinking" de Gemini 2.5 (costo/latencia)
        // OJO: Gemini no soporta frequency/presence_penalty (devuelve 400), no se envían.
        ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    }
    const body = await res.text().catch(() => '');
    // Si Gemini falla y hay Groq, caemos a Groq; si no, lanzamos.
    if (!groqKey) throw new Error(`Gemini API error ${res.status}: ${body}`);
    console.warn(`[edge] Gemini falló (${res.status}), usando Groq de fallback...`);
  }

  // 2) Groq (fallback, o primario si no hay Gemini).
  if (!groqKey) throw new Error('Ni GEMINI_API_KEY ni GROQ_API_KEY están configuradas');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2048,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Igual que callGroq pero devuelve el Response crudo (para streaming SSE). */
export async function callGroqStream(messages: GroqMessage[], opts: GroqOptions = {}): Promise<Response> {
  const geminiKey = env('GEMINI_API_KEY');
  const groqKey = opts.apiKey || env('GROQ_API_KEY');

  // Gemini soporta streaming OpenAI-compatible (mismo formato SSE de deltas).
  if (geminiKey) {
    return fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${geminiKey}` },
      body: JSON.stringify({
        model: opts.model || GEMINI_MODEL,
        messages,
        temperature: opts.temperature ?? 0.8,
        max_tokens: opts.maxTokens ?? 2048,
        reasoning_effort: 'none',
        stream: true,
      }),
    });
  }

  if (!groqKey) throw new Error('Ni GEMINI_API_KEY ni GROQ_API_KEY están configuradas');
  return fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 2048,
      stream: true,
    }),
  });
}

/** Extrae el primer objeto JSON de un texto (tolera markdown wraps). */
export function parseGroqJson(raw: string): any {
  let txt = (raw || '').trim().replace(/```json\n?/gi, '').replace(/```\n?/g, '');
  const match = txt.match(/\{[\s\S]*\}/);
  if (match) txt = match[0];
  return JSON.parse(txt);
}
