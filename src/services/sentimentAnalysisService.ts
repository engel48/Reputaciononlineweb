import OpenAI from 'openai';
import { SocialPost } from './socialMediaService';

// Inicializaremos OpenAI perezosamente para evitar problemas durante la compilación
let openaiClient: OpenAI | null = null;

// Función para obtener el cliente de OpenAI solo cuando se necesite
function getOpenAIClient() {
  if (!openaiClient) {
    // Verificamos que la clave esté disponible
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('OPENAI_API_KEY no está configurada. El análisis de sentimiento no funcionará.');
      // Regresamos una instancia vacía que luego manejaremos en los métodos
      return null;
    }
    
    // Inicializar el cliente solo la primera vez que se necesite
    openaiClient = new OpenAI({
      apiKey,
    });
  }
  return openaiClient;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // 0-100, donde 100 es muy positivo y 0 es muy negativo
  confidence: number; // 0-1, confianza en el análisis
  keywords: string[]; // Palabras clave identificadas
  emotions?: string[]; // Emociones detectadas (alegría, enojo, tristeza, etc.)
}

export interface BatchSentimentResult {
  postId: string;
  sentiment: SentimentResult;
  originalPost: SocialPost;
}

export class SentimentAnalysisService {
  
  /**
   * Analiza el sentimiento de un solo texto
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      if (!text || text.trim().length === 0) {
        return {
          sentiment: 'neutral',
          score: 50,
          confidence: 0,
          keywords: [],
          emotions: []
        };
      }
      
      // Obtener cliente de OpenAI
      const openai = getOpenAIClient();
      
      // Si no hay cliente disponible, devolver un resultado neutral
      if (!openai) {
        console.warn('No se pudo analizar el sentimiento porque la API key de OpenAI no está configurada');
        return {
          sentiment: 'neutral',
          score: 50,
          confidence: 0,
          keywords: ['api_no_disponible'],
          emotions: []
        };
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Eres un experto en análisis de sentimiento para redes sociales. 
            Analiza el texto proporcionado y responde ÚNICAMENTE en formato JSON con esta estructura exacta:
            {
              "sentiment": "positive|negative|neutral",
              "score": número_entre_0_y_100,
              "confidence": número_entre_0_y_1,
              "keywords": ["palabra1", "palabra2"],
              "emotions": ["emoción1", "emoción2"]
            }
            
            Criterios:
            - score: 0-30 = negativo, 31-69 = neutral, 70-100 = positivo
            - confidence: qué tan seguro estás del análisis (0 = nada seguro, 1 = completamente seguro)
            - keywords: palabras clave que influyeron en el sentimiento
            - emotions: emociones detectadas (máximo 3): alegría, tristeza, enojo, miedo, sorpresa, asco, amor, esperanza, frustración, etc.
            
            Considera el contexto de redes sociales en español y lenguaje coloquial.`
          },
          {
            role: "user",
            content: `Analiza este texto: "${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parsear la respuesta JSON
      const result = JSON.parse(response) as SentimentResult;
      
      // Validar y limpiar el resultado
      return {
        sentiment: ['positive', 'negative', 'neutral'].includes(result.sentiment) 
          ? result.sentiment as 'positive' | 'negative' | 'neutral'
          : 'neutral',
        score: Math.max(0, Math.min(100, result.score || 50)),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 10) : [],
        emotions: Array.isArray(result.emotions) ? result.emotions.slice(0, 3) : []
      };

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      
      // Fallback: análisis básico por palabras clave
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Analiza el sentimiento de múltiples posts en lote
   */
  async analyzeBatchSentiment(posts: SocialPost[]): Promise<BatchSentimentResult[]> {
    const results: BatchSentimentResult[] = [];
    
    // Procesar en lotes de 5 para evitar límites de API
    const batchSize = 5;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (post) => {
        const sentiment = await this.analyzeSentiment(post.content);
        return {
          postId: post.id,
          sentiment,
          originalPost: { ...post, sentiment: sentiment.sentiment, sentimentScore: sentiment.score }
        };
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes para respetar límites de API
      if (i + batchSize < posts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Análisis de sentimiento de respaldo usando palabras clave
   */
  private fallbackSentimentAnalysis(text: string): SentimentResult {
    const positiveWords = [
      'excelente', 'bueno', 'genial', 'increíble', 'fantástico', 'perfecto',
      'feliz', 'alegría', 'amor', 'éxito', 'victoria', 'logro', 'positivo',
      'maravilloso', 'espectacular', 'brillante', 'impresionante', 'útil',
      'gracias', 'agradecido', 'recomiendo', 'apoyo', 'felicidades'
    ];

    const negativeWords = [
      'malo', 'horrible', 'terrible', 'pésimo', 'odio', 'enojo', 'tristeza',
      'problema', 'error', 'falla', 'decepción', 'frustración', 'molesto',
      'inaceptable', 'deplorable', 'indignante', 'preocupante', 'crítico',
      'rechazo', 'protesta', 'contra', 'negativo', 'desastre'
    ];

    const lowerText = text.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) {
        positiveCount++;
        foundKeywords.push(word);
      }
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) {
        negativeCount++;
        foundKeywords.push(word);
      }
    });

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 50;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(85, 60 + (positiveCount * 10));
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max(15, 40 - (negativeCount * 10));
    }

    return {
      sentiment,
      score,
      confidence: Math.min(0.6, (positiveCount + negativeCount) * 0.2),
      keywords: foundKeywords.slice(0, 5),
      emotions: []
    };
  }

  /**
   * Genera un resumen de sentimientos para múltiples posts
   */
  generateSentimentSummary(results: BatchSentimentResult[]) {
    if (results.length === 0) {
      return {
        totalPosts: 0,
        averageScore: 50,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        topKeywords: [],
        topEmotions: [],
        trend: 'stable' as 'positive' | 'negative' | 'stable'
      };
    }

    const totalPosts = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.sentiment.score, 0) / totalPosts;
    
    const sentimentCounts = results.reduce((acc, r) => {
      acc[r.sentiment.sentiment]++;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });

    const sentimentDistribution = {
      positive: (sentimentCounts.positive / totalPosts) * 100,
      negative: (sentimentCounts.negative / totalPosts) * 100,
      neutral: (sentimentCounts.neutral / totalPosts) * 100
    };

    // Agregar todas las palabras clave y contar frecuencia
    const keywordCounts: { [key: string]: number } = {};
    const emotionCounts: { [key: string]: number } = {};

    results.forEach(r => {
      r.sentiment.keywords.forEach(keyword => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
      r.sentiment.emotions?.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const topEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

    // Determinar tendencia general
    let trend: 'positive' | 'negative' | 'stable' = 'stable';
    if (sentimentDistribution.positive > 60) {
      trend = 'positive';
    } else if (sentimentDistribution.negative > 40) {
      trend = 'negative';
    }

    return {
      totalPosts,
      averageScore: Math.round(averageScore),
      sentimentDistribution: {
        positive: Math.round(sentimentDistribution.positive),
        negative: Math.round(sentimentDistribution.negative),
        neutral: Math.round(sentimentDistribution.neutral)
      },
      topKeywords,
      topEmotions,
      trend
    };
  }
}
