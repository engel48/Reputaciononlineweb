// Servicio de IA centralizado.
// Primario: Google Gemini (2.5 Flash / 2.5 Flash-Lite, endpoint OpenAI-compatible).
// Fallback: Groq (llama-3.3-70b-versatile) → DeepSeek R1. La selección es por env:
// si GEMINI_API_KEY está presente, Gemini es el primario; si no, se usa Groq.
// Mantiene el branding como "Julia" y soporta inyección de contexto de usuario.

import Groq from 'groq-sdk';
import { UserContext, formatUserContextForPrompt } from './user-context';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  temperature?: number;
  max_tokens?: number;
  jsonMode?: boolean;
  frequencyPenalty?: number;
  presencePenalty?: number;
  /** Modelo a usar (solo aplica a Gemini). Por defecto GEMINI_MODEL (Flash). */
  model?: string;
}

// Gemini (primario) vía endpoint OpenAI-compatible.
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const GEMINI_MODEL = 'gemini-2.5-flash'; // calidad: chat, reportes, crisis, recomendaciones
const GEMINI_MODEL_LITE = 'gemini-2.5-flash-lite'; // alto volumen: sentiment, resumen de noticias

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

const JULIA_PERSONALITY = `Eres Julia, asistente de IA especializada en análisis de reputación online y monitoreo de redes sociales para el contexto colombiano y latinoamericano.
Eres profesional, cercana, empática y práctica. Hablas español neutral con modismos naturales.
Tus áreas de expertise:
- Análisis de sentimientos en redes sociales y medios
- Monitoreo de reputación online y detección temprana de crisis
- Estrategias de comunicación digital y gestión de marca
- Análisis político y electoral (Colombia/LATAM)
- Respuesta a crisis de reputación
- Interpretación de métricas de social media
Reglas de estilo:
- NO te presentes ni saludes ("Hola", "¡Hola!", "Soy Julia…") en cada respuesta. Si ya hay mensajes previos tuyos en esta conversación, continúa la conversación de forma natural sin saludar ni repetir tu nombre.
- Usa el nombre del usuario solo ocasionalmente para dar calidez, no en cada respuesta.
- Sé concreta y accionable: sugiere pasos, no solo observaciones.
- Si no tienes datos suficientes, dilo honestamente y pide más contexto.
- No inventes cifras, nombres ni fuentes que no estén en el contexto.
- Recuerda y referencia lo que el usuario te ha dicho antes en esta conversación cuando sea relevante.
- Responde en TEXTO PLANO: NO uses Markdown. Nada de asteriscos para negrita/itálica (* o **) ni almohadillas para títulos (#, ##, ###). Para listas usa viñetas simples (•) o numeración (1., 2., 3.) y separa ideas con saltos de línea.`;

class AIService {
  private geminiApiKey?: string;
  private groqClient?: Groq;
  private deepseekApiKey?: string;

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const groqKey = process.env.GROQ_API_KEY || '';
    const deepseekKey = process.env.DEEPSEEK_API_KEY || '';

    if (geminiKey) {
      this.geminiApiKey = geminiKey;
    }

    if (groqKey) {
      this.groqClient = new Groq({ apiKey: groqKey });
    } else if (!geminiKey) {
      console.warn('⚠️ No hay GEMINI_API_KEY ni GROQ_API_KEY configuradas');
    }

    if (deepseekKey) {
      this.deepseekApiKey = deepseekKey;
    }
  }

  /** True si al menos un proveedor está configurado */
  isAvailable(): boolean {
    return !!(this.geminiApiKey || this.groqClient || this.deepseekApiKey);
  }

  private async callGroq(messages: AIMessage[], options: ChatOptions): Promise<string> {
    if (!this.groqClient) throw new Error('Groq not configured');

    const completion = await this.groqClient.chat.completions.create({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      model: GROQ_MODEL,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      ...(options.frequencyPenalty != null ? { frequency_penalty: options.frequencyPenalty } : {}),
      ...(options.presencePenalty != null ? { presence_penalty: options.presencePenalty } : {}),
      ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    });

    return completion.choices[0]?.message?.content || '';
  }

  private async callDeepSeek(messages: AIMessage[], options: ChatOptions): Promise<string> {
    if (!this.deepseekApiKey) throw new Error('DeepSeek not configured');

    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error(`DeepSeek API error ${res.status}: ${await res.text().catch(() => '')}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private async callGemini(messages: AIMessage[], options: ChatOptions): Promise<string> {
    if (!this.geminiApiKey) throw new Error('Gemini not configured');

    const res = await fetch(`${GEMINI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.geminiApiKey}`,
      },
      body: JSON.stringify({
        model: options.model || GEMINI_MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2048,
        // Apaga el "thinking" de Gemini 2.5: respuestas más rápidas y costo
        // predecible (sin tokens de razonamiento ocultos). Suficiente para Julia.
        reasoning_effort: 'none',
        // NOTA: el endpoint OpenAI-compat de Gemini NO soporta frequency_penalty
        // ni presence_penalty (devuelve 400), por eso no se envían.
        ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const e: any = new Error(`Gemini API error ${res.status}: ${body}`);
      e.status = res.status;
      throw e;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Chat principal. Cadena de proveedores: Gemini (primario) → Groq → DeepSeek.
   * Si un proveedor falla, se registra el error y se prueba el siguiente; solo si
   * todos fallan se lanza el error agregado. Esto maximiza la disponibilidad de Julia.
   */
  async chat(messages: AIMessage[], options: ChatOptions = {}): Promise<string> {
    const errors: string[] = [];

    const providers: Array<{ name: string; enabled: boolean; call: () => Promise<string> }> = [
      { name: 'Gemini', enabled: !!this.geminiApiKey, call: () => this.callGemini(messages, options) },
      { name: 'Groq', enabled: !!this.groqClient, call: () => this.callGroq(messages, options) },
      { name: 'DeepSeek', enabled: !!this.deepseekApiKey, call: () => this.callDeepSeek(messages, options) },
    ];

    for (const p of providers) {
      if (!p.enabled) continue;
      try {
        return await p.call();
      } catch (err: any) {
        const msg = err?.message || String(err);
        errors.push(`${p.name}: ${msg}`);
        console.warn(`[aiService] ${p.name} falló (${msg}), probando siguiente proveedor...`);
      }
    }

    throw new Error(`Julia no puede procesar la solicitud. ${errors.join(' | ')}`);
  }

  /** Parser robusto de JSON con tolerancia a markdown wraps */
  private parseJsonResponse(raw: string): any {
    let txt = (raw || '').trim();
    txt = txt.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    const match = txt.match(/\{[\s\S]*\}/);
    if (match) txt = match[0];
    return JSON.parse(txt);
  }

  /**
   * Chat genérico con persona Julia + contexto opcional de usuario.
   */
  async juliaChat(
    userMessage: string,
    options?: { context?: string; user?: UserContext | null }
  ): Promise<string> {
    const systemParts = [JULIA_PERSONALITY];
    if (options?.user) systemParts.push(formatUserContextForPrompt(options.user));
    if (options?.context) systemParts.push(`## Contexto adicional\n${options.context}`);

    return this.chat(
      [
        { role: 'system', content: systemParts.join('\n\n') },
        { role: 'user', content: userMessage },
      ],
      { temperature: 0.8 }
    );
  }

  /**
   * Chat con historial conversacional (para Amelia o conversaciones de Julia).
   */
  async chatWithHistory(
    history: AIMessage[],
    newUserMessage: string,
    options: {
      user?: UserContext | null;
      persona?: string;
      temperature?: number;
      maxTokens?: number;
      frequencyPenalty?: number;
      presencePenalty?: number;
      systemExtra?: string;
    } = {}
  ): Promise<string> {
    const systemParts = [options.persona || JULIA_PERSONALITY];
    if (options.systemExtra) systemParts.push(options.systemExtra);
    if (options.user) systemParts.push(formatUserContextForPrompt(options.user));

    return this.chat(
      [
        { role: 'system', content: systemParts.join('\n\n') },
        ...history,
        { role: 'user', content: newUserMessage },
      ],
      {
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        frequencyPenalty: options.frequencyPenalty,
        presencePenalty: options.presencePenalty,
      }
    );
  }

  /** Análisis de sentimiento con JSON mode */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    explanation: string;
  }> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un experto en análisis de sentimientos para español colombiano. Detectas sarcasmo, ironía, emojis y hashtags. Respondes SIEMPRE con un JSON válido con las claves: sentiment (positive|negative|neutral), score (número -1.0 a +1.0), explanation (1-2 frases en español).
Reglas de score: -1.0 a -0.3 = negative, -0.3 a +0.3 = neutral, +0.3 a +1.0 = positive.`,
      },
      {
        role: 'user',
        content: `Analiza el sentimiento de este texto: "${text}"`,
      },
    ];

    // Alto volumen (corre por cada mención): usa el modelo más barato (Flash-Lite).
    const response = await this.chat(messages, {
      temperature: 0.3,
      jsonMode: true,
      model: GEMINI_MODEL_LITE,
    });
    const parsed = this.parseJsonResponse(response);

    if (!['positive', 'negative', 'neutral'].includes(parsed.sentiment)) {
      throw new Error('Formato inválido: sentiment');
    }

    let score = typeof parsed.score === 'number' ? parsed.score : 0;
    if (score > 1) score = score / 100;
    score = Math.max(-1, Math.min(1, score));

    return {
      sentiment: parsed.sentiment,
      score,
      explanation: parsed.explanation || 'Análisis completado',
    };
  }

  async searchPersonInfo(
    name: string,
    context?: string
  ): Promise<{
    bio: string;
    highlights: string[];
    socialPresence: string[];
    reputationInsights: string;
  }> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content:
          'Eres experta en investigación de perfiles públicos y análisis de reputación online en Colombia. Basas tus respuestas en información pública. Responde SIEMPRE con JSON con las claves: bio, highlights (array), socialPresence (array), reputationInsights.',
      },
      {
        role: 'user',
        content: `Información sobre: ${name}${context ? `. Contexto: ${context}` : ''}`,
      },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5, jsonMode: true });
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error buscando información:', error);
      return {
        bio: 'Información no disponible en este momento',
        highlights: [],
        socialPresence: [],
        reputationInsights: 'No se pudo obtener análisis de reputación',
      };
    }
  }

  async analyzePoliticalMetrics(data: any, user?: UserContext | null): Promise<any> {
    const systemParts = [
      'Eres analista política experta en Colombia. Respondes SIEMPRE con JSON con claves: insights (array), recommendations (array), trends (array).',
    ];
    if (user) systemParts.push(formatUserContextForPrompt(user));

    const messages: AIMessage[] = [
      { role: 'system', content: systemParts.join('\n\n') },
      { role: 'user', content: `Analiza estas métricas y genera insights: ${JSON.stringify(data)}` },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.6, jsonMode: true });
      return this.parseJsonResponse(response);
    } catch (error) {
      console.error('Error en análisis político:', error);
      return {
        insights: ['Análisis en progreso'],
        recommendations: ['Continuar monitoreo'],
        trends: [],
      };
    }
  }

  async generateContent(
    prompt: string,
    type: 'social' | 'blog' | 'email' = 'social',
    user?: UserContext | null
  ): Promise<string> {
    const systemPrompts: Record<string, string> = {
      social:
        'Eres experta en redes sociales para el mercado colombiano. Generas contenido atractivo, conciso y optimizado para engagement.',
      blog:
        'Eres redactora profesional colombiana. Generas contenido informativo, bien estructurado y SEO-friendly.',
      email:
        'Eres experta en email marketing. Generas contenido persuasivo y profesional para audiencia colombiana.',
    };

    const systemParts = [systemPrompts[type]];
    if (user) systemParts.push(formatUserContextForPrompt(user));

    return this.chat(
      [
        { role: 'system', content: systemParts.join('\n\n') },
        { role: 'user', content: prompt },
      ],
      { temperature: 0.8 }
    );
  }

  async analyzeReputation(
    name: string,
    newsData: any[],
    user?: UserContext | null
  ): Promise<{
    overallScore: number;
    sentiment: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    summary: string;
  }> {
    const newsContext = newsData
      .slice(0, 10)
      .map((n) => `- ${n.title} (${n.sentiment || 'neutral'}, fuente: ${n.source || 'desconocida'})`)
      .join('\n');

    const systemParts = [
      `Eres Julia, experta en análisis de reputación online en Colombia. Respondes SIEMPRE con JSON con las claves: overallScore (0-100), sentiment (positive|negative|neutral), strengths (array), risks (array), recommendations (array), summary (2-3 frases).`,
    ];
    if (user) systemParts.push(formatUserContextForPrompt(user));

    const messages: AIMessage[] = [
      { role: 'system', content: systemParts.join('\n\n') },
      {
        role: 'user',
        content: `Analiza la reputación de "${name}" basándote en estas noticias:\n${
          newsContext || 'No hay noticias disponibles'
        }`,
      },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5, jsonMode: true });
      return this.parseJsonResponse(response);
    } catch {
      return {
        overallScore: 0,
        sentiment: 'neutral',
        strengths: [],
        risks: [],
        recommendations: ['Continuar monitoreando menciones'],
        summary: `No se pudo completar el análisis de reputación de "${name}" en este momento.`,
      };
    }
  }

  async generateCrisisResponse(
    alert: {
      type: string;
      severity: string;
      description: string;
      keyword?: string;
    },
    user?: UserContext | null
  ): Promise<{
    immediateActions: string[];
    suggestedResponse: string;
    communicationStrategy: string;
    timeline: string;
  }> {
    const systemParts = [
      `Eres Julia, experta en gestión de crisis de reputación en Colombia. Respondes SIEMPRE con JSON con las claves: immediateActions (array), suggestedResponse (texto de comunicado sugerido), communicationStrategy (estrategia general), timeline (línea de tiempo).`,
    ];
    if (user) systemParts.push(formatUserContextForPrompt(user));

    const messages: AIMessage[] = [
      { role: 'system', content: systemParts.join('\n\n') },
      {
        role: 'user',
        content: `Crisis detectada:\n- Tipo: ${alert.type}\n- Severidad: ${alert.severity}\n- Descripción: ${alert.description}${
          alert.keyword ? `\n- Keyword: ${alert.keyword}` : ''
        }`,
      },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5, jsonMode: true });
      return this.parseJsonResponse(response);
    } catch {
      return {
        immediateActions: ['Monitorear la situación', 'Preparar comunicado interno'],
        suggestedResponse: 'Estamos al tanto de la situación y trabajamos para resolverla.',
        communicationStrategy: 'Respuesta rápida y transparente',
        timeline: 'Responder en las próximas 2 horas',
      };
    }
  }

  async summarizeNews(
    articles: any[],
    user?: UserContext | null
  ): Promise<{
    summary: string;
    keyTopics: string[];
    overallSentiment: string;
    notableArticles: string[];
  }> {
    const articleList = articles
      .slice(0, 15)
      .map(
        (a, i) =>
          `${i + 1}. "${a.title}" - ${a.source || 'Fuente desconocida'} (${
            a.sentiment || 'neutral'
          })`
      )
      .join('\n');

    const systemParts = [
      `Eres Julia, experta en análisis de medios colombianos. Respondes SIEMPRE con JSON con las claves: summary (3-5 frases), keyTopics (array), overallSentiment (positive|negative|neutral), notableArticles (array de títulos).`,
    ];
    if (user) systemParts.push(formatUserContextForPrompt(user));

    const messages: AIMessage[] = [
      { role: 'system', content: systemParts.join('\n\n') },
      {
        role: 'user',
        content: `Resume estas ${articles.length} noticias:\n${articleList}`,
      },
    ];

    try {
      // Resumen de noticias = tarea liviana de alto volumen: Flash-Lite.
      const response = await this.chat(messages, {
        temperature: 0.4,
        jsonMode: true,
        model: GEMINI_MODEL_LITE,
      });
      return this.parseJsonResponse(response);
    } catch {
      return {
        summary: `Se analizaron ${articles.length} noticias. No se pudo generar resumen automático.`,
        keyTopics: [],
        overallSentiment: 'neutral',
        notableArticles: articles.slice(0, 3).map((a) => a.title),
      };
    }
  }

  /**
   * Genera recomendaciones accionables personalizadas para el usuario
   * basadas en su perfil, redes, keywords y menciones recientes.
   */
  async generateRecommendations(user: UserContext): Promise<{
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      category: string;
    }>;
    summary: string;
  }> {
    // 1) Detectar redes faltantes y generar recomendaciones deterministas de conexión
    const supportedPlatforms: Array<{ id: string; label: string; note: string }> = [
      { id: 'facebook', label: 'Facebook', note: 'para monitorear comentarios y menciones en tus páginas y posts propios' },
      { id: 'instagram', label: 'Instagram', note: 'para capturar comentarios, tags y menciones de tu cuenta Business' },
      { id: 'x', label: 'X (Twitter)', note: 'para detectar menciones directas, retweets y tweets que te etiquetan' },
      { id: 'youtube', label: 'YouTube', note: 'para analizar comentarios de tus videos y videos externos que te mencionan' },
    ];
    const connectedIds = new Set(user.connectedNetworks.map((n) => n.platform));
    const missing = supportedPlatforms.filter((p) => !connectedIds.has(p.id));

    const missingRecommendations = missing.map((p, idx) => ({
      title: `Conecta ${p.label}`,
      description: `Aún no has conectado ${p.label}. Al hacerlo, Julia ${p.note}. Sin esta red, tu monitoreo de reputación queda incompleto.`,
      priority: (idx === 0 ? 'high' : 'medium') as 'high' | 'medium' | 'low',
      category: 'Conexión de redes',
    }));

    // Si TODAS las redes están desconectadas, no vale la pena llamar a la IA para
    // recomendaciones de contenido: devolvemos solo las recomendaciones deterministas.
    if (user.connectedNetworks.length === 0) {
      return {
        recommendations: missingRecommendations,
        summary: `${user.firstName}, el primer paso es conectar al menos una red social. Mientras no lo hagas, no podemos traer menciones reales ni calcular tu reputación. Te dejo abajo las que faltan por conectar.`,
      };
    }

    // 2) Con al menos una red conectada, pedimos a Julia recomendaciones basadas en
    // el contexto real del usuario (menciones, sentimiento, keywords).
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `${JULIA_PERSONALITY}\n\n${formatUserContextForPrompt(
          user
        )}\n\nTu tarea: generar recomendaciones accionables ESPECÍFICAS al contexto del usuario (no genéricas). Responde SIEMPRE con JSON con las claves: recommendations (array de objetos {title, description, priority: high|medium|low, category}), summary (texto 2-3 frases dirigido al usuario por su nombre). Genera entre 3 y 5 recomendaciones SIN mencionar conectar redes que ya tiene conectadas.`,
      },
      {
        role: 'user',
        content: `Genera recomendaciones accionables para mí basadas en mis datos reales. Las recomendaciones deben ser concretas y aprovechar las redes que ya tengo conectadas (${user.connectedNetworks
          .map((n) => n.platform)
          .join(', ')}).`,
      },
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.7, jsonMode: true });
      const parsed = this.parseJsonResponse(response);

      // 3) Mezclar: redes faltantes primero (high priority), luego las de contenido
      const merged = [
        ...missingRecommendations,
        ...(Array.isArray(parsed.recommendations) ? parsed.recommendations : []),
      ].slice(0, 8);

      return {
        recommendations: merged,
        summary:
          parsed.summary ||
          `${user.firstName}, aquí están tus recomendaciones personalizadas basadas en tus datos reales.`,
      };
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      // Fallback: al menos devolvemos las recomendaciones deterministas de redes faltantes
      return {
        recommendations: missingRecommendations,
        summary:
          missingRecommendations.length > 0
            ? `${user.firstName}, aquí hay acciones inmediatas que puedes tomar:`
            : `${user.firstName}, no pude generar recomendaciones personalizadas en este momento. Inténtalo de nuevo en unos minutos.`,
      };
    }
  }
}

export const aiService = new AIService();
export { AIService };
