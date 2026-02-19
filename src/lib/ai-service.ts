// Servicio de IA centralizado usando Groq (LPU Inference)
// Mantiene el branding como "Julia" para el usuario

import Groq from 'groq-sdk';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_MODEL = 'llama-3.3-70b-versatile';

class AIService {
  private client?: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY || '';

    if (!apiKey) {
      console.warn('⚠️ GROQ_API_KEY no está configurada');
    } else {
      this.client = new Groq({ apiKey });
    }
  }

  private async callGroq(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    if (!this.client) {
      console.log('🤖 Julia: API no disponible, usando respuesta simulada');
      throw new Error('Groq API not configured');
    }

    try {
      console.log('🤖 Julia: Procesando con Groq AI...');

      const completion = await this.client.chat.completions.create({
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        model: GROQ_MODEL,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 2048
      });

      const text = completion.choices[0]?.message?.content || '';

      console.log('✅ Julia: Respuesta generada exitosamente con Groq');
      return text;
    } catch (error: any) {
      console.error('❌ Julia: Error con Groq:', error?.message || error);
      throw error;
    }
  }

  async chat(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      return await this.callGroq(messages, options);
    } catch (error) {
      console.error('🚨 Julia: Error en servicio de IA:', error);
      throw new Error('Julia no puede procesar la solicitud en este momento');
    }
  }

  // Método específico para Julia
  async juliaChat(userMessage: string, context?: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres Julia, una asistente de IA especializada en análisis de reputación online y monitoreo de redes sociales en Colombia.
        Eres amigable, profesional y experta en:
        - Análisis de sentimientos
        - Monitoreo de redes sociales
        - Gestión de reputación online
        - Estrategias de comunicación digital
        - Análisis de tendencias
        ${context ? `\nContexto adicional: ${context}` : ''}`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];

    return this.chat(messages, { temperature: 0.8 });
  }

  // Método para análisis de sentimientos
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    explanation: string;
  }> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres un experto en análisis de sentimientos para contenido en español, especializado en contexto colombiano.

IMPORTANTE: Debes analizar el texto y devolver SOLO un JSON válido con este formato exacto:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": número entre -1.0 (muy negativo) y +1.0 (muy positivo),
  "explanation": "breve explicación en español de 1-2 frases"
}

REGLAS:
- score: -1.0 a -0.3 = negativo, -0.3 a +0.3 = neutral, +0.3 a +1.0 = positivo
- Detecta sarcasmo, ironía y modismos colombianos
- Considera emojis y hashtags en el análisis
- NO incluyas código markdown, SOLO el JSON puro`
      },
      {
        role: 'user',
        content: `Analiza el sentimiento de este texto: "${text}"`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.3 });

      // Limpiar respuesta de markdown si existe
      let jsonText = response.trim();

      // Eliminar bloques de código markdown
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

      // Buscar el JSON dentro del texto (puede haber texto antes/después)
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);

      // Validar estructura de respuesta
      if (!parsed.sentiment || !['positive', 'negative', 'neutral'].includes(parsed.sentiment)) {
        throw new Error('Formato de respuesta inválido: sentiment no válido');
      }

      // Normalizar score a rango -1 a +1
      let normalizedScore = parsed.score;
      if (typeof normalizedScore !== 'number') {
        normalizedScore = 0;
      }
      if (normalizedScore > 1) normalizedScore = normalizedScore / 100;
      normalizedScore = Math.max(-1, Math.min(1, normalizedScore));

      return {
        sentiment: parsed.sentiment,
        score: normalizedScore,
        explanation: parsed.explanation || 'Análisis completado'
      };
    } catch (error) {
      console.error('❌ Error analizando sentimiento con Groq:', error);
      throw error; // Lanzar error para que el endpoint use fallback
    }
  }

  // Método para búsqueda de personas
  async searchPersonInfo(name: string, context?: string): Promise<{
    bio: string;
    highlights: string[];
    socialPresence: string[];
    reputationInsights: string;
  }> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'Eres un experto en investigación de perfiles públicos y análisis de reputación online en Colombia. Proporciona información profesional y relevante sobre personas basándote en datos públicos disponibles.'
      },
      {
        role: 'user',
        content: `Busca información sobre: ${name}${context ? `. Contexto: ${context}` : ''}.
        Devuelve la información en formato JSON con:
        - bio: biografía breve (máximo 200 caracteres)
        - highlights: array de 3-5 logros principales
        - socialPresence: array de presencia en redes sociales
        - reputationInsights: análisis de reputación (máximo 300 caracteres)

        IMPORTANTE: Devuelve SOLO el JSON, sin texto adicional.`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5 });
      // Limpiar respuesta de markdown si existe
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : jsonText);
    } catch (error) {
      console.error('Error buscando información:', error);
      return {
        bio: 'Información no disponible en este momento',
        highlights: ['Búsqueda en progreso'],
        socialPresence: [],
        reputationInsights: 'No se pudo obtener análisis de reputación'
      };
    }
  }

  // Método para análisis político
  async analyzePoliticalMetrics(data: any): Promise<any> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'Eres un analista político experto en Colombia. Analiza métricas políticas y proporciona insights valiosos sobre tendencias, sentimiento público y estrategias de comunicación.'
      },
      {
        role: 'user',
        content: `Analiza estas métricas políticas y genera insights: ${JSON.stringify(data)}.

        Devuelve un JSON con:
        - insights: array de observaciones clave
        - recommendations: array de recomendaciones
        - trends: array de tendencias identificadas

        IMPORTANTE: Devuelve SOLO el JSON.`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.6 });
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : jsonText);
    } catch (error) {
      console.error('Error en análisis político:', error);
      return {
        insights: ['Análisis en progreso'],
        recommendations: ['Continuar monitoreo'],
        trends: []
      };
    }
  }

  // Método para generación de contenido
  async generateContent(prompt: string, type: 'social' | 'blog' | 'email' = 'social'): Promise<string> {
    const systemPrompts = {
      social: 'Eres un experto en redes sociales en Colombia. Genera contenido atractivo, conciso y optimizado para engagement.',
      blog: 'Eres un redactor profesional colombiano. Genera contenido informativo, bien estructurado y SEO-friendly.',
      email: 'Eres un experto en email marketing. Genera contenido persuasivo y profesional para audiencia colombiana.'
    };

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompts[type]
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return this.chat(messages, { temperature: 0.8 });
  }

  // Analisis comprensivo de reputacion
  async analyzeReputation(name: string, newsData: any[]): Promise<{
    overallScore: number;
    sentiment: string;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    summary: string;
  }> {
    const newsContext = newsData.slice(0, 10).map(n =>
      `- ${n.title} (${n.sentiment || 'neutral'}, fuente: ${n.source || 'desconocida'})`
    ).join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres Julia, experta en analisis de reputacion online en Colombia. Analiza la reputacion de una persona o marca basandote en noticias recientes. Devuelve SOLO JSON valido.`
      },
      {
        role: 'user',
        content: `Analiza la reputacion de "${name}" basandote en estas noticias:\n${newsContext || 'No hay noticias disponibles'}\n\nDevuelve JSON con: overallScore (0-100), sentiment (positive/negative/neutral), strengths (array), risks (array), recommendations (array), summary (texto 2-3 frases).`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5 });
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : jsonText);
    } catch {
      return {
        overallScore: 50,
        sentiment: 'neutral',
        strengths: ['Informacion insuficiente para determinar fortalezas'],
        risks: ['Se requieren mas datos para identificar riesgos'],
        recommendations: ['Continuar monitoreando menciones'],
        summary: `No se pudo completar el analisis de reputacion de "${name}" en este momento.`
      };
    }
  }

  // Sugerir respuesta a una alerta de crisis
  async generateCrisisResponse(alert: {
    type: string;
    severity: string;
    description: string;
    keyword?: string;
  }): Promise<{
    immediateActions: string[];
    suggestedResponse: string;
    communicationStrategy: string;
    timeline: string;
  }> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres Julia, experta en gestion de crisis de reputacion en Colombia. Genera estrategias de respuesta rapida y efectiva. Devuelve SOLO JSON valido.`
      },
      {
        role: 'user',
        content: `Crisis detectada:\n- Tipo: ${alert.type}\n- Severidad: ${alert.severity}\n- Descripcion: ${alert.description}\n${alert.keyword ? `- Keyword: ${alert.keyword}` : ''}\n\nDevuelve JSON con: immediateActions (array de acciones inmediatas), suggestedResponse (texto de comunicado sugerido), communicationStrategy (estrategia general), timeline (linea de tiempo de respuesta).`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5 });
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : jsonText);
    } catch {
      return {
        immediateActions: ['Monitorear la situacion', 'Preparar comunicado interno'],
        suggestedResponse: 'Estamos al tanto de la situacion y trabajamos para resolverla.',
        communicationStrategy: 'Respuesta rapida y transparente',
        timeline: 'Responder en las proximas 2 horas'
      };
    }
  }

  // Resumir un lote de noticias
  async summarizeNews(articles: any[]): Promise<{
    summary: string;
    keyTopics: string[];
    overallSentiment: string;
    notableArticles: string[];
  }> {
    const articleList = articles.slice(0, 15).map((a, i) =>
      `${i + 1}. "${a.title}" - ${a.source || 'Fuente desconocida'} (${a.sentiment || 'neutral'})`
    ).join('\n');

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres Julia, experta en analisis de medios colombianos. Resume noticias de forma concisa y util. Devuelve SOLO JSON valido.`
      },
      {
        role: 'user',
        content: `Resume estas ${articles.length} noticias:\n${articleList}\n\nDevuelve JSON con: summary (resumen ejecutivo 3-5 frases), keyTopics (array de temas principales), overallSentiment (positive/negative/neutral), notableArticles (array de titulos mas relevantes).`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.4 });
      const jsonText = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = jsonText.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : jsonText);
    } catch {
      return {
        summary: `Se analizaron ${articles.length} noticias. No se pudo generar resumen automatico.`,
        keyTopics: [],
        overallSentiment: 'neutral',
        notableArticles: articles.slice(0, 3).map(a => a.title)
      };
    }
  }
}

// Exportar instancia única del servicio
export const aiService = new AIService();

// Exportar también la clase por si se necesita crear instancias personalizadas
export { AIService };
