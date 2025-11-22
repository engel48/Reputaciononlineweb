/**
 * Sistema de Análisis de Sentimiento en Español
 * Especializado para contexto político y de reputación colombiana
 */

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentAnalysis {
  sentiment: SentimentType;
  score: number; // -1.00 a 1.00
  confidence: number; // 0 a 1
  matchedKeywords: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  contextualFactors: {
    hasNegation: boolean;
    hasIntensifier: boolean;
    hasQuestionMark: boolean;
    hasExclamation: boolean;
  };
}

/**
 * Diccionario de palabras clave en español colombiano
 */
const SENTIMENT_KEYWORDS = {
  // Palabras positivas
  positive: [
    // Logros y éxito
    'éxito', 'exitoso', 'exitosa', 'logro', 'logrado', 'alcanzó', 'alcanzar',
    'triunfo', 'victoria', 'ganador', 'ganadora', 'destacado', 'destacada',

    // Reconocimiento
    'excelente', 'excelencia', 'sobresaliente', 'reconocido', 'reconocida',
    'premiado', 'premiada', 'galardonado', 'galardonada', 'distinguido', 'distinguida',

    // Mejora y progreso
    'mejora', 'mejoró', 'mejoramiento', 'avance', 'avanzó', 'progreso', 'progresó',
    'desarrollo', 'desarrolló', 'crecimiento', 'creció', 'innovación', 'innovador',

    // Aprobación
    'aprobó', 'aprobación', 'respaldo', 'respaldó', 'apoyo', 'apoyó', 'favorable',
    'positivo', 'positiva', 'beneficio', 'beneficioso', 'ventaja', 'ventajoso',

    // Liderazgo
    'líder', 'liderazgo', 'lideró', 'lideró', 'dirigió', 'comandó', 'encabezó',
    'referente', 'ejemplo', 'modelo', 'inspirador', 'inspiradora',

    // Calidad
    'calidad', 'excelente', 'óptimo', 'óptima', 'eficiente', 'eficaz', 'efectivo',
    'competente', 'capaz', 'hábil', 'talentoso', 'talentosa', 'brillante',

    // Honestidad y transparencia
    'honesto', 'honesta', 'transparente', 'transparencia', 'integridad', 'íntegro',
    'confiable', 'responsable', 'comprometido', 'comprometida', 'serio', 'seria',
  ],

  // Palabras negativas
  negative: [
    // Escándalos y corrupción
    'escándalo', 'escándalo', 'corrupción', 'corrupto', 'corrupta', 'soborno',
    'coima', 'mermelada', 'parapolitica', 'parapolítica', 'narcopolítica',

    // Acusaciones legales
    'acusación', 'acusado', 'acusada', 'denuncia', 'denunciado', 'denunciada',
    'investigación', 'investigado', 'investigada', 'proceso', 'procesado', 'procesada',
    'juicio', 'demanda', 'demandado', 'demandada', 'imputación', 'imputado',

    // Delitos
    'fraude', 'fraudulento', 'estafa', 'estafador', 'robo', 'robó', 'hurto',
    'malversación', 'peculado', 'cohecho', 'prevaricato', 'lavado de activos',

    // Críticas y desaprobación
    'crítica', 'criticó', 'criticado', 'criticada', 'cuestionado', 'cuestionada',
    'rechazó', 'rechazo', 'desaprobó', 'desaprobación', 'censura', 'censuró',
    'condena', 'condenó', 'reproche', 'reprochó', 'desacreditó', 'desacreditar',

    // Fracasos y errores
    'fracaso', 'fracasó', 'fracasado', 'fracasada', 'falló', 'falla', 'error',
    'equivocación', 'equivocó', 'incumplió', 'incumplimiento', 'ineficiente',
    'ineficaz', 'incompetente', 'incompetencia', 'negligencia', 'negligente',

    // Escándalos políticos
    'polémico', 'polémica', 'controversia', 'controversial', 'cuestionable',
    'sospechoso', 'sospechosa', 'dudoso', 'dudosa', 'irregular', 'irregularidad',

    // Violencia y agresión
    'violencia', 'violento', 'violenta', 'agresión', 'agresivo', 'agresiva',
    'amenaza', 'amenazó', 'atacó', 'ataque', 'golpeó', 'golpe', 'abuso',

    // Pérdidas y crisis
    'pérdida', 'perdió', 'crisis', 'colapso', 'colapsó', 'quiebra', 'quebró',
    'caída', 'cayó', 'descenso', 'descendió', 'deterioró', 'deterioro',
  ],

  // Palabras neutrales (contextuales)
  neutral: [
    'anunció', 'anuncio', 'declaró', 'declaración', 'dijo', 'afirmó', 'manifestó',
    'explicó', 'explicación', 'mencionó', 'comentó', 'habló', 'presentó',
    'reunión', 'reunió', 'asistió', 'participó', 'participación', 'evento',
    'propuesta', 'propuso', 'proyecto', 'plan', 'programa', 'iniciativa',
  ],
};

/**
 * Palabras que invierten el sentimiento (negación)
 */
const NEGATION_WORDS = [
  'no', 'nunca', 'jamás', 'tampoco', 'sin', 'ningún', 'ninguna',
  'nadie', 'nada', 'ni', 'ninguno', 'ninguna',
];

/**
 * Palabras que intensifican el sentimiento
 */
const INTENSIFIERS = [
  'muy', 'sumamente', 'extremadamente', 'totalmente', 'completamente',
  'absolutamente', 'profundamente', 'altamente', 'enormemente', 'gravemente',
  'severamente', 'fuertemente', 'increíblemente', 'extraordinariamente',
];

/**
 * Analiza el sentimiento de un texto en español
 */
export function analyzeSentiment(
  text: string,
  searchTerm: string,
  contextWindow: number = 100
): SentimentAnalysis {
  // Normalizar texto
  const normalizedText = text.toLowerCase().trim();

  // Encontrar la posición del término de búsqueda
  const termIndex = normalizedText.indexOf(searchTerm.toLowerCase());

  // Si no encuentra el término, analizar todo el texto
  let contextText = normalizedText;
  if (termIndex !== -1) {
    // Extraer contexto alrededor del término (antes y después)
    const start = Math.max(0, termIndex - contextWindow);
    const end = Math.min(normalizedText.length, termIndex + searchTerm.length + contextWindow);
    contextText = normalizedText.substring(start, end);
  }

  // Detectar factores contextuales
  const contextualFactors = {
    hasNegation: NEGATION_WORDS.some(word => contextText.includes(` ${word} `)),
    hasIntensifier: INTENSIFIERS.some(word => contextText.includes(` ${word} `)),
    hasQuestionMark: text.includes('?'),
    hasExclamation: text.includes('!'),
  };

  // Contar palabras clave encontradas
  const matchedKeywords = {
    positive: SENTIMENT_KEYWORDS.positive.filter(word =>
      contextText.includes(word)
    ),
    negative: SENTIMENT_KEYWORDS.negative.filter(word =>
      contextText.includes(word)
    ),
    neutral: SENTIMENT_KEYWORDS.neutral.filter(word =>
      contextText.includes(word)
    ),
  };

  // Calcular scores
  let positiveScore = matchedKeywords.positive.length;
  let negativeScore = matchedKeywords.negative.length;

  // Ajustar por intensificadores
  if (contextualFactors.hasIntensifier) {
    positiveScore *= 1.5;
    negativeScore *= 1.5;
  }

  // Ajustar por negación (invierte el sentimiento)
  if (contextualFactors.hasNegation) {
    const temp = positiveScore;
    positiveScore = negativeScore;
    negativeScore = temp;
  }

  // Calcular score final (-1.00 a 1.00)
  const totalScore = positiveScore + negativeScore;
  let score = 0;

  if (totalScore > 0) {
    score = (positiveScore - negativeScore) / totalScore;
  }

  // Normalizar score entre -1 y 1
  score = Math.max(-1, Math.min(1, score));

  // Determinar sentimiento
  let sentiment: SentimentType = 'neutral';
  if (score > 0.2) {
    sentiment = 'positive';
  } else if (score < -0.2) {
    sentiment = 'negative';
  }

  // Calcular confianza basado en cantidad de keywords encontradas
  const totalKeywords = matchedKeywords.positive.length +
                        matchedKeywords.negative.length;
  const confidence = Math.min(1, totalKeywords / 5); // Max confianza con 5+ keywords

  return {
    sentiment,
    score: parseFloat(score.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    matchedKeywords,
    contextualFactors,
  };
}

/**
 * Analiza el sentimiento de múltiples párrafos
 */
export function analyzeMultipleParagraphs(
  paragraphs: string[],
  searchTerm: string
): SentimentAnalysis {
  const analyses = paragraphs.map(p => analyzeSentiment(p, searchTerm));

  // Promediar scores
  const avgScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
  const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

  // Combinar keywords (using Array.from to avoid iterator issues with tsconfig target es5)
  const allPositive = Array.from(new Set(analyses.flatMap(a => a.matchedKeywords.positive)));
  const allNegative = Array.from(new Set(analyses.flatMap(a => a.matchedKeywords.negative)));
  const allNeutral = Array.from(new Set(analyses.flatMap(a => a.matchedKeywords.neutral)));

  // Determinar sentimiento general
  let sentiment: SentimentType = 'neutral';
  if (avgScore > 0.2) {
    sentiment = 'positive';
  } else if (avgScore < -0.2) {
    sentiment = 'negative';
  }

  return {
    sentiment,
    score: parseFloat(avgScore.toFixed(2)),
    confidence: parseFloat(avgConfidence.toFixed(2)),
    matchedKeywords: {
      positive: allPositive,
      negative: allNegative,
      neutral: allNeutral,
    },
    contextualFactors: {
      hasNegation: analyses.some(a => a.contextualFactors.hasNegation),
      hasIntensifier: analyses.some(a => a.contextualFactors.hasIntensifier),
      hasQuestionMark: analyses.some(a => a.contextualFactors.hasQuestionMark),
      hasExclamation: analyses.some(a => a.contextualFactors.hasExclamation),
    },
  };
}

/**
 * Extrae el contexto alrededor de un término de búsqueda
 */
export function extractContext(
  text: string,
  searchTerm: string,
  contextLength: number = 200
): string {
  const normalizedText = text.toLowerCase();
  const termIndex = normalizedText.indexOf(searchTerm.toLowerCase());

  if (termIndex === -1) {
    return text.substring(0, contextLength);
  }

  // Encontrar el inicio de la oración
  let start = termIndex;
  while (start > 0 && text[start] !== '.' && text[start] !== '!' && text[start] !== '?') {
    start--;
  }
  start = start === 0 ? 0 : start + 2; // +2 para saltar el punto y espacio

  // Encontrar el final de la oración
  let end = termIndex + searchTerm.length;
  while (end < text.length && text[end] !== '.' && text[end] !== '!' && text[end] !== '?') {
    end++;
  }
  end = Math.min(end + 1, text.length); // +1 para incluir el punto

  // Si la oración es muy corta, expandir el contexto
  if (end - start < contextLength) {
    const expansion = contextLength - (end - start);
    start = Math.max(0, start - expansion / 2);
    end = Math.min(text.length, end + expansion / 2);
  }

  return text.substring(start, end).trim();
}

/**
 * Detecta si un texto contiene crisis de reputación
 * (múltiples menciones negativas en poco texto)
 */
export function detectReputationCrisis(
  text: string,
  searchTerm: string
): {
  isCrisis: boolean;
  severity: 'low' | 'medium' | 'high';
  reasons: string[];
} {
  const analysis = analyzeSentiment(text, searchTerm);
  const reasons: string[] = [];
  let severity: 'low' | 'medium' | 'high' = 'low';

  // Criterios de crisis
  const hasMultipleNegativeKeywords = analysis.matchedKeywords.negative.length >= 3;
  const hasStrongNegativeSentiment = analysis.score <= -0.6;
  const hasHighConfidence = analysis.confidence >= 0.7;

  const criticalNegativeWords = [
    'corrupción', 'escándalo', 'acusación', 'fraude', 'investigación',
    'denuncia', 'condena', 'polémico', 'controversia',
  ];

  const hasCriticalWords = criticalNegativeWords.some(word =>
    text.toLowerCase().includes(word)
  );

  if (hasMultipleNegativeKeywords) {
    reasons.push('Múltiples palabras clave negativas detectadas');
    severity = 'medium';
  }

  if (hasStrongNegativeSentiment) {
    reasons.push('Sentimiento fuertemente negativo');
    severity = 'high';
  }

  if (hasCriticalWords) {
    reasons.push('Palabras críticas encontradas (corrupción, escándalo, etc.)');
    severity = 'high';
  }

  if (!hasHighConfidence) {
    severity = 'low';
  }

  const isCrisis = reasons.length >= 2 || (hasStrongNegativeSentiment && hasCriticalWords);

  return {
    isCrisis,
    severity,
    reasons,
  };
}
