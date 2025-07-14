"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Brain, Target, TrendingUp, Users, Heart, 
  MessageSquare, Calendar, Clock, Zap, Star, Award,
  CheckCircle, AlertTriangle, Lightbulb, Send, 
  BarChart3, PieChart, ArrowRight, ArrowUp, ArrowDown,
  RefreshCw, Download, Settings, Filter, Search,
  Mic, Video, Camera, Edit, Share2, Globe, MapPin,
  ThumbsUp, ThumbsDown, Eye, Bookmark, Play
} from 'lucide-react';

interface BrandRecommendation {
  id: string;
  type: 'content' | 'timing' | 'platform' | 'collaboration' | 'crisis' | 'growth';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  reasoning: string;
  expectedImpact: {
    reach: number;
    engagement: number;
    sentiment: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  timeToImplement: string;
  resources: string[];
  actions: string[];
  success_metrics: string[];
  deadline?: string;
}

interface ContentSuggestion {
  id: string;
  type: 'post' | 'video' | 'story' | 'article' | 'podcast';
  platform: string;
  title: string;
  description: string;
  tone: 'professional' | 'casual' | 'inspiring' | 'educational' | 'emotional';
  target_audience: string;
  optimal_time: string;
  hashtags: string[];
  content_pillars: string[];
  expected_performance: {
    reach: number;
    engagement: number;
    sentiment: number;
  };
  ai_confidence: number;
}

interface BrandInsight {
  id: string;
  category: 'reputation' | 'audience' | 'competition' | 'trends' | 'opportunities';
  title: string;
  insight: string;
  data_points: {
    metric: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  actionable: boolean;
  impact_level: 'low' | 'medium' | 'high';
}

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface AIBrandAdvisorProps {
  userProfile: UserProfile;
}

export default function AIBrandAdvisor({ userProfile }: AIBrandAdvisorProps) {
  const [activeView, setActiveView] = useState<'dashboard' | 'recommendations' | 'content' | 'insights' | 'strategy'>('dashboard');
  const [selectedRecommendation, setSelectedRecommendation] = useState<BrandRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [recommendations, setRecommendations] = useState<BrandRecommendation[]>([
    {
      id: '1',
      type: 'content',
      priority: 'high',
      title: 'Crear serie de videos educativos sobre política económica',
      description: 'Desarrollar contenido educativo que simplifique conceptos económicos complejos para el público general.',
      reasoning: 'Análisis de tendencias muestra 340% más engagement en contenido educativo. Tu audiencia busca información clara sobre economía.',
      expectedImpact: {
        reach: 2800000,
        engagement: 156000,
        sentiment: 78
      },
      difficulty: 'medium',
      timeToImplement: '2-3 semanas',
      resources: ['Equipo de video', 'Guionista especializado', 'Economista consultor'],
      actions: [
        'Definir 5 temas económicos prioritarios',
        'Crear guiones simplificados',
        'Producir videos de 3-5 minutos',
        'Lanzar campaña promocional'
      ],
      success_metrics: ['Views > 500K por video', 'Engagement rate > 8%', 'Sentiment > 75%'],
      deadline: '2024-02-15'
    },
    {
      id: '2',
      type: 'timing',
      priority: 'urgent',
      title: 'Optimizar horarios de publicación para máximo alcance',
      description: 'Ajustar estrategia de publicación basada en análisis de actividad de audiencia.',
      reasoning: 'Datos muestran que publicar entre 7-9 PM incrementa engagement 45%. Actualmente publicas en horarios subóptimos.',
      expectedImpact: {
        reach: 1200000,
        engagement: 89000,
        sentiment: 5
      },
      difficulty: 'easy',
      timeToImplement: 'Inmediato',
      resources: ['Herramienta de programación', 'Análisis de audiencia'],
      actions: [
        'Programar posts principales 7-9 PM',
        'Stories al mediodía (12-2 PM)',
        'Videos educativos domingos 6 PM',
        'Interacciones en vivo jueves 8 PM'
      ],
      success_metrics: ['Aumento 30% en alcance', 'Engagement rate > 6%', 'Saves incremento 25%']
    },
    {
      id: '3',
      type: 'collaboration',
      priority: 'medium',
      title: 'Colaboración estratégica con influencers educativos',
      description: 'Establecer alianzas con creators que compartan valores educativos y políticos similares.',
      reasoning: 'Colaboraciones cruzadas pueden expandir audiencia 60%. Influencers educativos tienen alta credibilidad en tu target.',
      expectedImpact: {
        reach: 3500000,
        engagement: 234000,
        sentiment: 82
      },
      difficulty: 'hard',
      timeToImplement: '4-6 semanas',
      resources: ['Budget colaboraciones', 'Estratega de partnerships', 'Manager de influencers'],
      actions: [
        'Identificar 10 influencers afines',
        'Proponer contenido conjunto',
        'Negociar términos colaboración',
        'Ejecutar campaña cruzada'
      ],
      success_metrics: ['Nuevos followers > 50K', 'Cross-pollination > 20%', 'Brand mention increase'],
      deadline: '2024-03-01'
    },
    {
      id: '4',
      type: 'crisis',
      priority: 'high',
      title: 'Preparar narrativa proactiva sobre controversias pasadas',
      description: 'Desarrollar estrategia de comunicación que aborde críticas recurrentes de manera proactiva.',
      reasoning: 'Análisis de sentiment muestra patrones negativos recurrentes. Narrativa proactiva puede mejorar percepción 35%.',
      expectedImpact: {
        reach: 1800000,
        engagement: 98000,
        sentiment: 25
      },
      difficulty: 'hard',
      timeToImplement: '3-4 semanas',
      resources: ['Estratega de comunicación', 'Crisis manager', 'Fact-checkers'],
      actions: [
        'Audit completo de críticas históricas',
        'Desarrollar narrativa de respuesta',
        'Crear contenido explicativo',
        'Plan de despliegue gradual'
      ],
      success_metrics: ['Sentiment improvement > 20%', 'Crisis mention reduction', 'Positive story dominance']
    }
  ]);

  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([
    {
      id: '1',
      type: 'video',
      platform: 'TikTok',
      title: 'Explicando el presupuesto nacional en 60 segundos',
      description: 'Video dinámico con gráficos animados que desglosa el presupuesto nacional de forma simple y visual.',
      tone: 'educational',
      target_audience: 'Jóvenes 18-35 años',
      optimal_time: 'Domingo 6:00 PM',
      hashtags: ['#PresupuestoFácil', '#EconomíaParaTodos', '#PolíticaClara', '#EducaciónCívica'],
      content_pillars: ['Educación', 'Transparencia', 'Juventud'],
      expected_performance: {
        reach: 1200000,
        engagement: 96000,
        sentiment: 82
      },
      ai_confidence: 94
    },
    {
      id: '2',
      type: 'post',
      platform: 'Instagram',
      title: 'Carrusel: 5 logros de mi gestión que quizás no conocías',
      description: 'Post tipo carrusel destacando logros específicos con datos verificables y fuentes.',
      tone: 'professional',
      target_audience: 'Adultos 25-55 años',
      optimal_time: 'Miércoles 8:00 PM',
      hashtags: ['#LogrosReales', '#TransparenciaTotal', '#GestiónEfectiva'],
      content_pillars: ['Logros', 'Transparencia', 'Credibilidad'],
      expected_performance: {
        reach: 890000,
        engagement: 67000,
        sentiment: 75
      },
      ai_confidence: 88
    },
    {
      id: '3',
      type: 'story',
      platform: 'Instagram',
      title: 'Behind the scenes: preparando propuesta de ley',
      description: 'Stories mostrando el proceso de trabajo, reuniones con expertos y preparación de propuestas.',
      tone: 'casual',
      target_audience: 'Seguidores actuales',
      optimal_time: 'Martes 1:00 PM',
      hashtags: ['#BehindTheScenes', '#TrabajoReal', '#Proceso'],
      content_pillars: ['Transparencia', 'Proceso', 'Humanización'],
      expected_performance: {
        reach: 450000,
        engagement: 34000,
        sentiment: 71
      },
      ai_confidence: 79
    }
  ]);

  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([
    {
      id: '1',
      category: 'audience',
      title: 'Tu audiencia está envejeciendo - necesitas estrategia para jóvenes',
      insight: 'Análisis demográfico muestra que 68% de tu audiencia tiene más de 35 años. Para campañas futuras, necesitas captar votantes jóvenes.',
      data_points: [
        { metric: 'Audiencia 18-25', value: '12%', trend: 'down' },
        { metric: 'Audiencia 26-35', value: '20%', trend: 'stable' },
        { metric: 'Audiencia 36+', value: '68%', trend: 'up' }
      ],
      actionable: true,
      impact_level: 'high'
    },
    {
      id: '2',
      category: 'competition',
      title: 'Competidores te superan en contenido de video',
      insight: 'Análisis competitivo revela que rivals políticos tienen 3x más engagement en videos. Tu estrategia está muy centrada en texto.',
      data_points: [
        { metric: 'Videos vs texto ratio', value: '1:8', trend: 'down' },
        { metric: 'Video engagement avg', value: '2.1%', trend: 'down' },
        { metric: 'Competitor video avg', value: '6.8%', trend: 'up' }
      ],
      actionable: true,
      impact_level: 'high'
    },
    {
      id: '3',
      category: 'trends',
      title: 'Temas ambientales están ganando tracción en tu región',
      insight: 'Análisis de tendencias muestra incremento 240% en conversaciones sobre medio ambiente en tu región durante últimos 3 meses.',
      data_points: [
        { metric: 'Menciones ambientales', value: '+240%', trend: 'up' },
        { metric: 'Engagement en tema', value: '8.4%', trend: 'up' },
        { metric: 'Tu participación', value: '0.8%', trend: 'stable' }
      ],
      actionable: true,
      impact_level: 'medium'
    }
  ]);

  // Simular generación de nuevas recomendaciones
  const generateNewRecommendations = async () => {
    setIsGenerating(true);
    
    // Simular procesamiento de IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newRecommendation: BrandRecommendation = {
      id: Date.now().toString(),
      type: 'growth',
      priority: 'medium',
      title: 'Estrategia de micro-targeting para nuevos votantes',
      description: 'Implementar campaña segmentada para capturar audiencias específicas basada en análisis de comportamiento.',
      reasoning: 'IA detectó oportunidades de crecimiento en segmentos poco explorados de 18-25 años en áreas urbanas.',
      expectedImpact: {
        reach: 980000,
        engagement: 78000,
        sentiment: 73
      },
      difficulty: 'medium',
      timeToImplement: '2-4 semanas',
      resources: ['Datos demográficos', 'Budget publicitario', 'Creative team'],
      actions: [
        'Definir micro-segmentos objetivo',
        'Crear contenido específico por segmento',
        'Configurar campañas dirigidas',
        'Monitorear y optimizar performance'
      ],
      success_metrics: ['Nuevo audience growth > 15K', 'Segment engagement > 7%', 'Cost per acquisition < $2']
    };
    
    setRecommendations(prev => [newRecommendation, ...prev]);
    setLastUpdate(new Date());
    setIsGenerating(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'hard': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content': return <Edit className="w-5 h-5" />;
      case 'timing': return <Clock className="w-5 h-5" />;
      case 'platform': return <Globe className="w-5 h-5" />;
      case 'collaboration': return <Users className="w-5 h-5" />;
      case 'crisis': return <AlertTriangle className="w-5 h-5" />;
      case 'growth': return <TrendingUp className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* AI Status */}
      <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              <Brain className="w-6 h-6 mr-2" />
              Sofia AI - Tu Asesora Personal de Marca
            </h3>
            <p className="text-blue-100">
              Análisis continuo de tu reputación digital y recomendaciones personalizadas en tiempo real
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">94%</div>
            <div className="text-sm text-blue-100">Precisión IA</div>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Monitoreando 24/7
          </div>
          <div className="flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            {recommendations.length} recomendaciones activas
          </div>
          <div className="flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AIMetricCard
          icon={TrendingUp}
          title="Impacto Potencial"
          value="2.8M"
          subtitle="Reach proyectado"
          trend="up"
        />
        <AIMetricCard
          icon={Target}
          title="Precisión IA"
          value="94%"
          subtitle="Confianza promedio"
          trend="up"
        />
        <AIMetricCard
          icon={Lightbulb}
          title="Recomendaciones"
          value={recommendations.length.toString()}
          subtitle="Pendientes de acción"
          trend="stable"
        />
        <AIMetricCard
          icon={Star}
          title="Score de Marca"
          value="87/100"
          subtitle="Índice reputacional"
          trend="up"
        />
      </div>

      {/* Recomendaciones prioritarias */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <Sparkles className="w-6 h-6 text-purple-500 mr-2" />
            Recomendaciones Prioritarias
          </h3>
          <button
            onClick={generateNewRecommendations}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generar Nuevas
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {recommendations.filter(r => r.priority === 'urgent' || r.priority === 'high').slice(0, 3).map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedRecommendation(rec)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    {getDifficultyIcon(rec.difficulty)}
                    <span className="ml-1">{rec.timeToImplement}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span className="text-gray-500">Alcance:</span>
                  <div className="font-medium">{(rec.expectedImpact.reach / 1000000).toFixed(1)}M</div>
                </div>
                <div>
                  <span className="text-gray-500">Engagement:</span>
                  <div className="font-medium">{(rec.expectedImpact.engagement / 1000).toFixed(0)}K</div>
                </div>
                <div>
                  <span className="text-gray-500">Sentiment:</span>
                  <div className="font-medium">{rec.expectedImpact.sentiment}%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  <strong>IA sugiere:</strong> {rec.reasoning.substring(0, 80)}...
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Ver Detalles
                  </button>
                  <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                    Implementar
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Eye className="w-5 h-5 text-blue-500 mr-2" />
            Insights Clave
          </h3>
          <div className="space-y-3">
            {brandInsights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="font-medium text-sm">{insight.title}</h5>
                <p className="text-xs text-gray-600 mt-1">{insight.insight.substring(0, 100)}...</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    insight.impact_level === 'high' ? 'bg-red-100 text-red-800' :
                    insight.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact_level} impact
                  </span>
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    Ver más →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Video className="w-5 h-5 text-green-500 mr-2" />
            Contenido Sugerido
          </h3>
          <div className="space-y-3">
            {contentSuggestions.slice(0, 2).map((suggestion) => (
              <div key={suggestion.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{suggestion.title}</h5>
                  <div className="flex items-center text-xs text-green-600">
                    <Brain className="w-3 h-3 mr-1" />
                    {suggestion.ai_confidence}%
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">{suggestion.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {suggestion.hashtags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    Crear →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Todas las Recomendaciones</h3>
          <div className="flex space-x-3">
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todas las prioridades</option>
              <option>Solo urgentes</option>
              <option>Solo altas</option>
              <option>Solo medias</option>
            </select>
            <select className="px-3 py-2 border rounded-lg text-sm">
              <option>Todos los tipos</option>
              <option>Solo contenido</option>
              <option>Solo timing</option>
              <option>Solo colaboraciones</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    {getTypeIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{rec.title}</h4>
                    <p className="text-gray-600 mt-1">{rec.description}</p>
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>IA Reasoning:</strong> {rec.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority.toUpperCase()}
                  </div>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    {getDifficultyIcon(rec.difficulty)}
                    <span className="ml-1">{rec.difficulty} • {rec.timeToImplement}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {(rec.expectedImpact.reach / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Alcance Esperado</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {(rec.expectedImpact.engagement / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {rec.expectedImpact.sentiment}%
                  </div>
                  <div className="text-sm text-gray-600">Sentiment</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                <div>
                  <h5 className="font-medium mb-2">Plan de Acción:</h5>
                  <ul className="space-y-1">
                    {rec.actions.map((action, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <ArrowRight className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Métricas de Éxito:</h5>
                  <ul className="space-y-1">
                    {rec.success_metrics.map((metric, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <Target className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Recursos necesarios:</span> {rec.resources.join(', ')}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRecommendation(rec)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Ver Detalle Completo
                  </button>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Implementar Ahora
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Sugerencias de Contenido IA</h3>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Generar Nuevas Ideas
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contentSuggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600">{suggestion.platform} • {suggestion.type}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-sm text-purple-600">
                    <Brain className="w-4 h-4 mr-1" />
                    {suggestion.ai_confidence}% confianza
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.optimal_time}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{suggestion.description}</p>

              <div className="mb-4">
                <div className="text-sm font-medium mb-2">Hashtags sugeridos:</div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.hashtags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-purple-600">
                    {(suggestion.expected_performance.reach / 1000).toFixed(0)}K
                  </div>
                  <div className="text-gray-600">Alcance</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-blue-600">
                    {(suggestion.expected_performance.engagement / 1000).toFixed(0)}K
                  </div>
                  <div className="text-gray-600">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">
                    {suggestion.expected_performance.sentiment}%
                  </div>
                  <div className="text-gray-600">Sentiment</div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                  Crear Contenido
                </button>
                <button className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-6">Insights de IA sobre tu Marca</h3>
        
        <div className="space-y-6">
          {brandInsights.map((insight) => (
            <div key={insight.id} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{insight.title}</h4>
                  <p className="text-sm text-gray-500 capitalize">{insight.category}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    insight.impact_level === 'high' ? 'bg-red-100 text-red-800' :
                    insight.impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact_level} impact
                  </span>
                  {insight.actionable && (
                    <div className="flex items-center mt-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Accionable
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-600 mb-4">{insight.insight}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insight.data_points.map((point, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-xl font-bold ${
                      point.trend === 'up' ? 'text-green-600' :
                      point.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {point.value}
                      {point.trend === 'up' && <ArrowUp className="w-4 h-4 inline ml-1" />}
                      {point.trend === 'down' && <ArrowDown className="w-4 h-4 inline ml-1" />}
                    </div>
                    <div className="text-sm text-gray-600">{point.metric}</div>
                  </div>
                ))}
              </div>

              {insight.actionable && (
                <div className="mt-4 pt-4 border-t">
                  <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                    Ver Recomendaciones Relacionadas
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
              <Sparkles className="w-8 h-8 text-purple-500 mr-3" />
              AI Personal Brand Advisor
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Recomendaciones inteligentes impulsadas por IA para optimizar tu presencia digital
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              IA actualizada: {lastUpdate.toLocaleTimeString()}
            </div>
            <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              <Download className="w-4 h-4 mr-2 inline" />
              Exportar Análisis
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'recommendations', label: 'Recomendaciones', icon: Lightbulb },
            { id: 'content', label: 'Contenido IA', icon: Edit },
            { id: 'insights', label: 'Insights', icon: Eye },
            { id: 'strategy', label: 'Estrategia', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'recommendations' && renderRecommendations()}
          {activeView === 'content' && renderContent()}
          {activeView === 'insights' && renderInsights()}
          {activeView === 'strategy' && renderDashboard()}
        </motion.div>
      </AnimatePresence>

      {/* Modal de detalle de recomendación */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Detalle de Recomendación</h3>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{selectedRecommendation.title}</h4>
                  <p className="text-gray-600 mb-4">{selectedRecommendation.description}</p>
                  
                  <div className="p-4 bg-purple-50 rounded-lg mb-4">
                    <h5 className="font-medium mb-2">Razonamiento de IA:</h5>
                    <p className="text-sm text-purple-800">{selectedRecommendation.reasoning}</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(selectedRecommendation.expectedImpact.reach / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-600">Alcance Esperado</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(selectedRecommendation.expectedImpact.engagement / 1000).toFixed(0)}K
                      </div>
                      <div className="text-sm text-gray-600">Engagement</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedRecommendation.expectedImpact.sentiment}%
                      </div>
                      <div className="text-sm text-gray-600">Sentiment</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-3">Plan de Acción Detallado:</h5>
                    <ul className="space-y-2">
                      {selectedRecommendation.actions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                            {index + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-3">Recursos Necesarios:</h5>
                    <ul className="space-y-1 mb-4">
                      {selectedRecommendation.resources.map((resource, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {resource}
                        </li>
                      ))}
                    </ul>
                    
                    <h5 className="font-medium mb-3">Métricas de Éxito:</h5>
                    <ul className="space-y-1">
                      {selectedRecommendation.success_metrics.map((metric, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <Target className="w-4 h-4 text-blue-500 mr-2" />
                          {metric}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    Compartir con Equipo
                  </button>
                  <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    Implementar Ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AIMetricCard({ icon: Icon, title, value, subtitle, trend }: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  trend: 'up' | 'down' | 'stable';
}) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-purple-500" />
        {getTrendIcon()}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <div className="text-gray-600 dark:text-gray-400 font-medium">{title}</div>
      <div className="text-sm text-gray-500">{subtitle}</div>
    </div>
  );
}