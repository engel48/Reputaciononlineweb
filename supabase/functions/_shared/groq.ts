// =====================================================
// Cliente Groq compartido para Edge Functions (Deno)
// API OpenAI-compatible. Modelo: llama-3.3-70b-versatile.
// Toda la IA de la plataforma usa Groq real (nada simulado).
// =====================================================

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

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
}

/** Devuelve el contenido de texto de la respuesta de Groq. Lanza si falla. */
export async function callGroq(messages: GroqMessage[], opts: GroqOptions = {}): Promise<string> {
  // @ts-ignore Deno global disponible en runtime de Edge Functions
  const apiKey = opts.apiKey || Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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
  // @ts-ignore Deno global
  const apiKey = opts.apiKey || Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada');

  return fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
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
