// Servicio de IA centralizado con fallback OpenAI -> DeepSeek R1
// Intenta primero OpenAI, si falla, usa DeepSeek R1 como respaldo
// Mantiene el branding como "Sofia" para el usuario

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class AIService {
  private openaiApiKey: string;
  private deepseekApiKey: string;
  private openaiUrl: string = 'https://api.openai.com/v1/chat/completions';
  private deepseekUrl: string = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.deepseekApiKey = process.env.DEEPSEEK_API_KEY || 'sk-f2e5fc3f3e2e448ba0c757ea91c0f88c';
  }

  private async tryOpenAI(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string | null> {
    if (!this.openaiApiKey) {
      console.log('🤖 Sofia: Método primario no disponible, usando método alternativo');
      return null;
    }

    try {
      console.log('🤖 Sofia: Procesando con método primario...');
      const response = await fetch(this.openaiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 2000
        })
      });

      if (!response.ok) {
        throw new Error(`Sofia primary method error: ${response.status}`);
      }

      const data: OpenAIResponse = await response.json();
      console.log('✅ Sofia: Respuesta generada exitosamente');
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.log('❌ Sofia: Método primario falló, usando método alternativo:', error);
      return null;
    }
  }

  private async tryDeepSeek(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
  }): Promise<string> {
    console.log('🤖 Sofia: Procesando con método alternativo...');
    const response = await fetch(this.deepseekUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.deepseekApiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Sofia alternative method error: ${response.status}`);
    }

    const data: DeepSeekResponse = await response.json();
    console.log('✅ Sofia: Respuesta generada con método alternativo');
    return data.choices[0]?.message?.content || '';
  }

  async chat(messages: AIMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      // Intentar primero con OpenAI
      const openaiResult = await this.tryOpenAI(messages, options);
      if (openaiResult) {
        return openaiResult;
      }

      // Si OpenAI falla, usar DeepSeek R1 como respaldo
      return await this.tryDeepSeek(messages, options);
    } catch (error) {
      console.error('🚨 Sofia: Error en servicio de IA:', error);
      throw new Error('Sofia no puede procesar la solicitud en este momento');
    }
  }

  // Método específico para Sofia
  async sofiaChat(userMessage: string, context?: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: `Eres Sofia, una asistente de IA especializada en análisis de reputación online y monitoreo de redes sociales. 
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
        content: 'Eres un experto en análisis de sentimientos. Debes analizar el texto y devolver SOLO un JSON válido con el formato: {"sentiment": "positive|negative|neutral", "score": 0.0-1.0, "explanation": "breve explicación"}'
      },
      {
        role: 'user',
        content: `Analiza el sentimiento de este texto: "${text}"`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.3 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analizando sentimiento:', error);
      return {
        sentiment: 'neutral',
        score: 0.5,
        explanation: 'No se pudo analizar el sentimiento'
      };
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
        content: 'Eres un experto en investigación de perfiles públicos y análisis de reputación online. Proporciona información profesional y relevante sobre personas basándote en datos públicos disponibles.'
      },
      {
        role: 'user',
        content: `Busca información sobre: ${name}${context ? `. Contexto: ${context}` : ''}. 
        Devuelve la información en formato JSON con: 
        - bio: biografía breve
        - highlights: array de logros principales
        - socialPresence: array de presencia en redes
        - reputationInsights: análisis de reputación`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.5 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error buscando información:', error);
      return {
        bio: 'Información no disponible',
        highlights: [],
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
        content: 'Eres un analista político experto. Analiza métricas políticas y proporciona insights valiosos sobre tendencias, sentimiento público y estrategias de comunicación.'
      },
      {
        role: 'user',
        content: `Analiza estas métricas políticas y genera insights: ${JSON.stringify(data)}`
      }
    ];

    try {
      const response = await this.chat(messages, { temperature: 0.6 });
      return JSON.parse(response);
    } catch (error) {
      console.error('Error en análisis político:', error);
      return {
        insights: [],
        recommendations: [],
        trends: []
      };
    }
  }

  // Método para generación de contenido
  async generateContent(prompt: string, type: 'social' | 'blog' | 'email' = 'social'): Promise<string> {
    const systemPrompts = {
      social: 'Eres un experto en redes sociales. Genera contenido atractivo, conciso y optimizado para engagement.',
      blog: 'Eres un redactor profesional. Genera contenido informativo, bien estructurado y SEO-friendly.',
      email: 'Eres un experto en email marketing. Genera contenido persuasivo y profesional.'
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