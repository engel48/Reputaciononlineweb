const POSITIVE_WORDS = [
  'excelente', 'genial', 'increíble', 'amor', 'feliz', 'gracias', 'bueno',
  'mejor', 'perfecto', 'brillante', 'espectacular', 'fantástico', 'útil',
  'great', 'awesome', 'amazing', 'love', 'wonderful', 'perfect', 'nice',
  '❤️', '👍', '😊', '🔥', '✨',
];

const NEGATIVE_WORDS = [
  'malo', 'terrible', 'horrible', 'odio', 'pésimo', 'peor', 'nunca',
  'decepción', 'aburrido', 'basura',
  'hate', 'worst', 'awful', 'stupid', 'boring', 'trash', 'garbage',
  '👎', '😠', '😡',
];

export interface BasicSentiment {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}

export function analyzeSentimentBasic(text: string): BasicSentiment {
  const lower = (text || '').toLowerCase();
  let positive = 0;
  let negative = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) positive++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negative++;
  }

  if (positive > negative) {
    return { label: 'positive', score: Math.min(positive * 25, 100) };
  }
  if (negative > positive) {
    return { label: 'negative', score: -Math.min(negative * 25, 100) };
  }
  return { label: 'neutral', score: 0 };
}
