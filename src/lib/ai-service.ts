// Servicio de IA centralizado usando Google Gemini
// Mantiene el branding como "Julia" para el usuario

import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class AIService {
  private genAI?: GoogleGenerativeAI;
  private geminiApiKey: string;
  private model?: any;

  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';

    if (!this.geminiApiKey) {
      console.warn('⚠️ GEMINI_API_KEY no está configurada');
    } else {
      this.genAI = new GoogleGenerativeAI(this.geminiApiKey);
      // Usando gemini-2.0-flash (rápido, eficiente y económico para análisis)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }
  }

  private async callGemini(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    if (!this.geminiApiKey || !this.model) {
      console.log('🤖 Julia: API no disponible, usando respuesta simulada');
      throw new Error('Gemini API not configured');
    }

    try {
      console.log('🤖 Julia: Procesando con Gemini AI...');

      // Combinar system y user messages para Gemini
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role === 'user');

      const fullPrompt = systemMessage + '\n\n' + userMessages.map(m => m.content).join('\n');

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Julia: Respuesta generada exitosamente con Gemini');
      return text;
    } catch (error: any) {
      console.error('❌ Julia: Error con Gemini:', error?.message || error);
      throw error;
    }
  }

  async chat(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      return await this.callGemini(messages, options);
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
      console.error('❌ Error analizando sentimiento con Gemini:', error);
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
      return JSON.parse(jsonText);
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
      return JSON.parse(jsonText);
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
}

// Exportar instancia única del servicio
export const aiService = new AIService();

// Exportar también la clase por si se necesita crear instancias personalizadas
export { AIService };
