/**
 * SentimentAnalysisService — wrapper que usa Groq (vía aiService) por dentro.
 *
 * Antes usaba OpenAI GPT-3.5. Ahora delega a aiService.analyzeSentiment (Groq llama-3.3-70b).
 * Mantiene la misma interfaz pública para compatibilidad con callers existentes
 * (src/app/api/social-listening/sync, src/app/api/social-listening/analysis).
 */

import { aiService } from '@/lib/ai-service';
import { SocialPost } from './socialMediaService';

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // 0-100, donde 100 es muy positivo y 0 es muy negativo
  confidence: number; // 0-1
  keywords: string[];
  emotions?: string[];
}

export interface BatchSentimentResult {
  postId: string;
  sentiment: SentimentResult;
  originalPost: SocialPost;
}

const POSITIVE_WORDS = [
  'excelente', 'bueno', 'genial', 'increíble', 'fantástico', 'perfecto',
  'feliz', 'alegría', 'amor', 'éxito', 'victoria', 'logro', 'positivo',
  'maravilloso', 'espectacular', 'brillante', 'impresionante', 'útil',
  'gracias', 'agradecido', 'recomiendo', 'apoyo', 'felicidades',
];

const NEGATIVE_WORDS = [
  'malo', 'horrible', 'terrible', 'pésimo', 'odio', 'enojo', 'tristeza',
  'problema', 'error', 'falla', 'decepción', 'frustración', 'molesto',
  'inaceptable', 'deplorable', 'indignante', 'preocupante', 'crítico',
  'rechazo', 'protesta', 'contra', 'negativo', 'desastre',
];

export class SentimentAnalysisService {
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        score: 50,
        confidence: 0,
        keywords: [],
        emotions: [],
      };
    }

    try {
      const ai = await aiService.analyzeSentiment(text);
      // Convertir score de -1..+1 (Groq) a 0..100 (formato legacy)
      const score100 = Math.round(((ai.score + 1) / 2) * 100);
      // Extraer keywords simples del texto (el aiService no las devuelve)
      const keywords = this.extractKeywords(text);
      return {
        sentiment: ai.sentiment,
        score: Math.max(0, Math.min(100, score100)),
        confidence: 0.85,
        keywords,
        emotions: [],
      };
    } catch (error) {
      console.error('[sentimentAnalysisService] Error con Groq, fallback keyword-based:', error);
      return this.fallbackSentimentAnalysis(text);
    }
  }

  async analyzeBatchSentiment(posts: SocialPost[]): Promise<BatchSentimentResult[]> {
    const results: BatchSentimentResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (post) => {
          const sentiment = await this.analyzeSentiment(post.content);
          return {
            postId: post.id,
            sentiment,
            originalPost: {
              ...post,
              sentiment: sentiment.sentiment,
              sentimentScore: sentiment.score,
            },
          };
        })
      );
      results.push(...batchResults);

      if (i + batchSize < posts.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  private extractKeywords(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const w of [...POSITIVE_WORDS, ...NEGATIVE_WORDS]) {
      if (lower.includes(w) && !found.includes(w)) found.push(w);
    }
    return found.slice(0, 10);
  }

  private fallbackSentimentAnalysis(text: string): SentimentResult {
    const lower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    const foundKeywords: string[] = [];

    for (const w of POSITIVE_WORDS) {
      if (lower.includes(w)) {
        positiveCount++;
        foundKeywords.push(w);
      }
    }
    for (const w of NEGATIVE_WORDS) {
      if (lower.includes(w)) {
        negativeCount++;
        foundKeywords.push(w);
      }
    }

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 50;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(85, 60 + positiveCount * 10);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = Math.max(15, 40 - negativeCount * 10);
    }

    return {
      sentiment,
      score,
      confidence: Math.min(0.6, (positiveCount + negativeCount) * 0.2),
      keywords: foundKeywords.slice(0, 5),
      emotions: [],
    };
  }

  generateSentimentSummary(results: BatchSentimentResult[]) {
    if (results.length === 0) {
      return {
        totalPosts: 0,
        averageScore: 50,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        topKeywords: [],
        topEmotions: [],
        trend: 'stable' as 'positive' | 'negative' | 'stable',
      };
    }

    const totalPosts = results.length;
    const averageScore =
      results.reduce((sum, r) => sum + r.sentiment.score, 0) / totalPosts;

    const sentimentCounts = results.reduce(
      (acc, r) => {
        acc[r.sentiment.sentiment]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const sentimentDistribution = {
      positive: (sentimentCounts.positive / totalPosts) * 100,
      negative: (sentimentCounts.negative / totalPosts) * 100,
      neutral: (sentimentCounts.neutral / totalPosts) * 100,
    };

    const keywordCounts: { [key: string]: number } = {};
    const emotionCounts: { [key: string]: number } = {};

    results.forEach((r) => {
      r.sentiment.keywords.forEach((keyword) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
      });
      r.sentiment.emotions?.forEach((emotion) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const topEmotions = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);

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
        neutral: Math.round(sentimentDistribution.neutral),
      },
      topKeywords,
      topEmotions,
      trend,
    };
  }
}
