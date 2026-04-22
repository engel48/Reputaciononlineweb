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
  ThumbsUp, ThumbsDown, Eye, Bookmark, Play, Loader2
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  const supabase = createClientComponentClient();
  const [activeView, setActiveView] = useState<'dashboard' | 'recommendations' | 'content' | 'insights' | 'strategy'>('dashboard');
  const [selectedRecommendation, setSelectedRecommendation] = useState<BrandRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userId, setUserId] = useState<string | null>(null);

  const [recommendations, setRecommendations] = useState<BrandRecommendation[]>([]);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [brandInsights, setBrandInsights] = useState<BrandInsight[]>([]);
  const [aiMetrics, setAiMetrics] = useState({
    potentialReach: 0,
    aiAccuracy: 0,
    brandScore: 0,
    activeRecommendations: 0
  });

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    fetchUser();
  }, [supabase]);

  // Cargar datos reales desde Supabase y Gemini AI
  useEffect(() => {
    if (!userId) return;

    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        // Obtener datos del usuario desde Supabase
        const { data: userData } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        const { data: socialData } = await supabase
          .from('social_media')
          .select('*')
          .eq('user_id', userId);

        const { data: mentionsData } = await supabase
          .from('mentions')
          .select('*')
          .eq('user_id', userId)
          .order('published_at', { ascending: false })
          .limit(50);

        // Generar recomendaciones con Julia IA (Groq)
        const response = await fetch('/api/julia', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Analiza estos datos reales del usuario y genera recomendaciones de marca estratégicas:

            Estadísticas: ${JSON.stringify(userData)}
            Redes Sociales: ${JSON.stringify(socialData)}
            Menciones Recientes: ${JSON.stringify(mentionsData?.slice(0, 10))}

            Genera un JSON con:
            {
              "recommendations": [
                {
                  "type": "content|timing|collaboration|crisis|growth",
                  "priority": "low|medium|high|urgent",
                  "title": "título breve",
                  "description": "descripción",
                  "reasoning": "razonamiento basado en datos reales",
                  "expectedImpact": { "reach": 0, "engagement": 0, "sentiment": 0 },
                  "difficulty": "easy|medium|hard",
                  "timeToImplement": "tiempo",
                  "resources": ["recurso1", "recurso2"],
                  "actions": ["acción1", "acción2"],
                  "success_metrics": ["métrica1", "métrica2"]
                }
              ],
              "contentSuggestions": [
                {
                  "type": "post|video|story",
                  "platform": "plataforma",
                  "title": "título",
                  "description": "descripción",
                  "tone": "professional|casual|inspiring",
                  "target_audience": "audiencia",
                  "optimal_time": "horario",
                  "hashtags": ["#tag1", "#tag2"],
                  "content_pillars": ["pilar1"],
                  "expected_performance": { "reach": 0, "engagement": 0, "sentiment": 0 },
                  "ai_confidence": 85
                }
              ],
              "insights": [
                {
                  "category": "reputation|audience|competition|trends",
                  "title": "título",
                  "insight": "insight detallado",
                  "data_points": [
                    { "metric": "métrica", "value": "valor", "trend": "up|down|stable" }
                  ],
                  "actionable": true,
                  "impact_level": "low|medium|high"
                }
              ],
              "metrics": {
                "potentialReach": 0,
                "aiAccuracy": 0,
                "brandScore": 0
              }
            }

            IMPORTANTE: Devuelve SOLO el JSON, sin markdown. Basa TODO en los datos reales proporcionados.`,
            context: `Usuario tipo: ${userProfile.type}, Especialización: ${userProfile.specialization || 'N/A'}, Región: ${userProfile.region || 'Colombia'}`
          })
        });

        if (!response.ok) {
          throw new Error('Error generating recommendations');
        }

        const data = await response.json();

        // Parsear respuesta de Gemini (puede venir como string JSON)
        let parsedData = data.response;
        if (typeof parsedData === 'string') {
          // Limpiar markdown si existe
          parsedData = parsedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = parsedData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No valid JSON found in response');
          }
        }

        // Actualizar estados con datos reales
        if (parsedData.recommendations) {
          setRecommendations(parsedData.recommendations.map((rec: any, index: number) => ({
            ...rec,
            id: `rec-${Date.now()}-${index}`
          })));
        }

        if (parsedData.contentSuggestions) {
          setContentSuggestions(parsedData.contentSuggestions.map((sugg: any, index: number) => ({
            ...sugg,
            id: `sugg-${Date.now()}-${index}`
          })));
        }

        if (parsedData.insights) {
          setBrandInsights(parsedData.insights.map((insight: any, index: number) => ({
            ...insight,
            id: `insight-${Date.now()}-${index}`
          })));
        }

        if (parsedData.metrics) {
          setAiMetrics({
            potentialReach: parsedData.metrics.potentialReach || 0,
            aiAccuracy: parsedData.metrics.aiAccuracy || 0,
            brandScore: parsedData.metrics.brandScore || 0,
            activeRecommendations: parsedData.recommendations?.length || 0
          });
        }

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error loading brand recommendations:', error);
        // No establecer datos de fallback - mostrar empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [userId, userProfile, supabase]);

  // Generar nuevas recomendaciones
  const generateNewRecommendations = async () => {
    if (!userId) return;

    setIsGenerating(true);
    try {
      // Obtener contexto actualizado
      const { data: recentActivity } = await supabase
        .from('mentions')
        .select('*')
        .eq('user_id', userId)
        .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('published_at', { ascending: false });

      const response = await fetch('/api/julia', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Basándote en la actividad reciente: ${JSON.stringify(recentActivity?.slice(0, 20))}, genera UNA nueva recomendación estratégica para mejorar la reputación y alcance. Devuelve SOLO un JSON con el formato de BrandRecommendation.`,
          context: `Generación de recomendación adicional`
        })
      });

      if (response.ok) {
        const data = await response.json();
        let parsedData = data.response;

        if (typeof parsedData === 'string') {
          parsedData = parsedData.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const jsonMatch = parsedData.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          }
        }

        const newRecommendation: BrandRecommendation = {
          ...parsedData,
          id: `rec-${Date.now()}`
        };

        setRecommendations(prev => [newRecommendation, ...prev]);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error generating new recommendation:', error);
    } finally {
      setIsGenerating(false);
    }
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

  // Empty State Component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Brain className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin datos disponibles</h3>
      <p className="text-gray-500 mb-6">{message}</p>
      <button
        onClick={generateNewRecommendations}
        className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generar con IA
      </button>
    </div>
  );

  // Loading State Component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center p-12">
      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
      <p className="text-gray-600">Generando recomendaciones...</p>
    </div>
  );

  const renderDashboard = () => {
    if (isLoading) return <LoadingState />;
    if (recommendations.length === 0) {
      return <EmptyState message="Analizando tus datos para generar recomendaciones personalizadas..." />;
    }

    return (
      <div className="space-y-6">
        {/* AI Status */}
        <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Brain className="w-6 h-6 mr-2" />
                Julia IA - Tu Asesora Personal de Marca
              </h3>
              <p className="text-blue-100">
                Análisis continuo de tu reputación digital y recomendaciones personalizadas en tiempo real
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{aiMetrics.aiAccuracy}%</div>
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
            value={aiMetrics.potentialReach > 0 ? `${(aiMetrics.potentialReach / 1000000).toFixed(1)}M` : '0'}
            subtitle="Reach proyectado"
            trend="up"
          />
          <AIMetricCard
            icon={Target}
            title="Precisión IA"
            value={`${aiMetrics.aiAccuracy}%`}
            subtitle="Confianza promedio"
            trend="up"
          />
          <AIMetricCard
            icon={Lightbulb}
            title="Recomendaciones"
            value={aiMetrics.activeRecommendations.toString()}
            subtitle="Pendientes de acción"
            trend="stable"
          />
          <AIMetricCard
            icon={Star}
            title="Score de Marca"
            value={`${aiMetrics.brandScore}/100`}
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
                    <div className="font-medium">{rec.expectedImpact.reach > 0 ? (rec.expectedImpact.reach / 1000000).toFixed(1) + 'M' : 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Engagement:</span>
                    <div className="font-medium">{rec.expectedImpact.engagement > 0 ? (rec.expectedImpact.engagement / 1000).toFixed(0) + 'K' : 'N/A'}</div>
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
            {brandInsights.length === 0 ? (
              <p className="text-gray-500 text-sm">Sin insights disponibles</p>
            ) : (
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
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Video className="w-5 h-5 text-green-500 mr-2" />
              Contenido Sugerido
            </h3>
            {contentSuggestions.length === 0 ? (
              <p className="text-gray-500 text-sm">Sin sugerencias de contenido disponibles</p>
            ) : (
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
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (isLoading) return <LoadingState />;
    if (recommendations.length === 0) {
      return <EmptyState message="No hay recomendaciones disponibles. Genera nuevas con IA." />;
    }

    return (
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
                      {rec.expectedImpact.reach > 0 ? (rec.expectedImpact.reach / 1000000).toFixed(1) + 'M' : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Alcance Esperado</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {rec.expectedImpact.engagement > 0 ? (rec.expectedImpact.engagement / 1000).toFixed(0) + 'K' : 'N/A'}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (contentSuggestions.length === 0) {
      return <EmptyState message="No hay sugerencias de contenido. Genera nuevas con IA." />;
    }

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Sugerencias de Contenido IA</h3>
            <button
              onClick={generateNewRecommendations}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
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
  };

  const renderInsights = () => {
    if (isLoading) return <LoadingState />;
    if (brandInsights.length === 0) {
      return <EmptyState message="No hay insights disponibles. Genera análisis con IA." />;
    }

    return (
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
  };

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
                        {selectedRecommendation.expectedImpact.reach > 0 ? (selectedRecommendation.expectedImpact.reach / 1000000).toFixed(1) + 'M' : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">Alcance Esperado</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedRecommendation.expectedImpact.engagement > 0 ? (selectedRecommendation.expectedImpact.engagement / 1000).toFixed(0) + 'K' : 'N/A'}
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
