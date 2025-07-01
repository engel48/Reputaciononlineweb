// Servicio de IA centralizado usando DeepSeek R1
// Este servicio reemplaza todas las llamadas a OpenAI con DeepSeek
// Pero mantiene el branding como "Sofia" para el usuario

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
  private apiKey: string;
  private apiUrl: string = 'https://api.deepseek.com/v1/chat/completions';
  private model: string = 'deepseek-chat';

  constructor() {
    // Usar la API key de DeepSeek proporcionada
    this.apiKey = process.env.DEEPSEEK_API_KEY || 'sk-f2e5fc3f3e2e448ba0c757ea91c0f88c';
  }

  async chat(messages: DeepSeekMessage[], options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 2000,
          stream: options?.stream || false
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data: DeepSeekResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error en servicio de IA:', error);
      throw error;
    }
  }

  // Método específico para Sofia
  async sofiaChat(userMessage: string, context?: string): Promise<string> {
    const messages: DeepSeekMessage[] = [
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
    const messages: DeepSeekMessage[] = [
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
    const messages: DeepSeekMessage[] = [
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
    const messages: DeepSeekMessage[] = [
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

    const messages: DeepSeekMessage[] = [
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