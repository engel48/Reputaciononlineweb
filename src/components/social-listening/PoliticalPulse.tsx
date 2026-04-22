"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote, MapPin, TrendingUp, TrendingDown, Users, MessageSquare,
  Calendar, Target, BarChart3, PieChart, Activity, AlertTriangle,
  CheckCircle, Clock, ArrowUp, ArrowDown, Zap, Globe, Filter,
  Search, RefreshCw, Download, Share2, Eye, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { emitCreditsChanged } from '@/lib/credit-events';

interface CampaignMetrics {
  totalMentions: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  byRegion: Array<{
    region: string;
    mentions: number;
    sentiment: number;
    population: number;
  }>;
  byProposal: Array<{
    proposal: string;
    mentions: number;
    sentiment: number;
    engagement: number;
  }>;
  debatePerformance: Array<{
    date: string;
    event: string;
    sentimentBefore: number;
    sentimentAfter: number;
    change: number;
  }>;
  competitorComparison: Array<{
    candidate: string;
    mentions: number;
    sentiment: number;
    shareOfVoice: number;
  }>;
}

interface CrisisAlert {
  id: string;
  type: 'scandal' | 'controversy' | 'debate' | 'media';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  affectedRegions: string[];
  sentimentDrop: number;
  recommendations: string[];
}

interface UserProfile {
  type: string;
  specialization?: string;
  region?: string;
}

interface PoliticalPulseProps {
  userProfile: UserProfile;
}

export default function PoliticalPulse({ userProfile }: PoliticalPulseProps) {
  const [activeView, setActiveView] = useState<'overview' | 'regions' | 'proposals' | 'debates' | 'competitors'>('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch REAL political metrics from Supabase
  useEffect(() => {
    const fetchPoliticalData = async () => {
      setIsLoading(true);
      try {
        // Get user session
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();

        if (!session?.user?.id) {
          setMetrics(null);
          setIsLoading(false);
          return;
        }

        setUserId(session.user.id);

        // Check if user type is political
        if (userProfile.type !== 'politician' && userProfile.type !== 'political') {
          setMetrics(null);
          setIsLoading(false);
          return;
        }

        // Fetch real political metrics from Supabase
        const metricsResponse = await fetch(`/api/political-metrics?userId=${session.user.id}`);
        const politicalData = await metricsResponse.json();

        if (!politicalData.metrics) {
          setMetrics(null);
          setIsLoading(false);
          return;
        }

        // Fetch mentions grouped by region
        const mentionsByRegionResponse = await fetch(`/api/mentions/by-region?userId=${session.user.id}`);
        const regionData = await mentionsByRegionResponse.json();

        // Use Julia IA (Groq) to analyze political proposals
        const proposalAnalysisResponse = await fetch('/api/julia', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Analiza menciones políticas y extrae propuestas principales con sentiment y engagement',
            context: 'political-analysis',
            userId: session.user.id
          })
        });
        const proposalData = await proposalAnalysisResponse.json();
        emitCreditsChanged(proposalData.credits?.newBalance);

        setMetrics({
          totalMentions: politicalData.metrics.total_mentions || 0,
          sentiment: politicalData.metrics.sentiment_distribution || { positive: 0, negative: 0, neutral: 0 },
          byRegion: regionData.regions || [],
          byProposal: proposalData.proposals || [],
          debatePerformance: politicalData.metrics.debate_performance || [],
          competitorComparison: [] // Requires manual competitor configuration
        });

        // Fetch crisis alerts
        const crisisResponse = await fetch(`/api/crisis-alerts?userId=${session.user.id}`);
        const crisisData = await crisisResponse.json();
        setCrisisAlerts(crisisData.alerts || []);

        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error fetching political data:', error);
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoliticalData();

    // Refresh every minute
    const interval = setInterval(() => {
      fetchPoliticalData();
    }, 60000);

    return () => clearInterval(interval);
  }, [userProfile]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Alertas de Crisis */}
      {crisisAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg"
        >
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-800">
              Alertas de Crisis Activas ({crisisAlerts.length})
            </h3>
          </div>
          {crisisAlerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="ml-3 text-sm text-gray-600">
                      Caída de sentiment: -{alert.sentimentDrop}%
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">{alert.description}</p>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Regiones afectadas: </span>
                    <span className="text-sm text-gray-600">{alert.affectedRegions.join(', ')}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-700">Recomendaciones:</span>
                    {alert.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-gray-600 ml-4">• {rec}</div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={MessageSquare}
          title="Menciones Totales"
          value={(metrics?.totalMentions || 0).toLocaleString()}
          change="+15%"
          positive={true}
        />
        <MetricCard
          icon={TrendingUp}
          title="Sentiment Positivo"
          value={`${metrics?.sentiment.positive || 0}%`}
          change="+8%"
          positive={true}
        />
        <MetricCard
          icon={Users}
          title="Share of Voice"
          value="41%"
          change="+3%"
          positive={true}
        />
        <MetricCard
          icon={Target}
          title="Engagement Rate"
          value="23.4%"
          change="-2%"
          positive={false}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment por tiempo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Evolución del Sentiment</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-500">Gráfico de líneas - Sentiment vs Tiempo</p>
          </div>
        </div>

        {/* Share of Voice */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Share of Voice vs Competidores</h3>
          <div className="space-y-3">
            {(metrics?.competitorComparison || []).map((comp, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`font-medium ${comp.candidate === 'Tú' ? 'text-[#01257D]' : 'text-gray-700'}`}>
                  {comp.candidate}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${comp.candidate === 'Tú' ? 'bg-[#01257D]' : 'bg-gray-400'}`}
                      style={{ width: `${comp.shareOfVoice}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{comp.shareOfVoice}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegions = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6">Análisis por Regiones</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visualización de regiones con datos reales */}
            <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6 relative overflow-hidden">
              <h4 className="font-bold text-lg text-[#01257D] mb-4">🇨🇴 Distribución Regional</h4>
              {metrics?.byRegion && metrics.byRegion.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {metrics.byRegion.slice(0, 6).map((region, index) => (
                    <div key={index} className={`p-3 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer ${
                      region.sentiment >= 60 ? 'bg-green-100 border-green-400' :
                      region.sentiment >= 40 ? 'bg-yellow-100 border-yellow-400' :
                      'bg-red-100 border-red-400'
                    }`}>
                      <div className="font-semibold text-sm">{region.region}</div>
                      <div className={`text-lg font-bold ${
                        region.sentiment >= 60 ? 'text-green-700' :
                        region.sentiment >= 40 ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {region.sentiment}%
                        {region.sentiment >= 50 ? ' 👍' : ' 👎'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {region.mentions.toLocaleString()} menciones
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Sin datos regionales disponibles
                </div>
              )}
            </div>

            {/* Lista de regiones */}
            <div className="space-y-4">
              {(metrics?.byRegion || []).map((region, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{region.region}</h4>
                    <span className={`text-sm font-medium ${
                      region.sentiment >= 60 ? 'text-green-600' : 
                      region.sentiment >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {region.sentiment}% positivo
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Menciones:</span>
                      <span className="ml-2 font-medium">{region.mentions.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Población:</span>
                      <span className="ml-2 font-medium">{(region.population / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#01257D]"
                        style={{ width: `${region.sentiment}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProposals = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Análisis por Propuestas</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(metrics?.byProposal || []).map((proposal, index) => (
            <div key={index} className="p-6 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h4 className="font-semibold text-lg mb-4">{proposal.proposal}</h4>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#01257D]">
                    {proposal.mentions.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Menciones</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    proposal.sentiment >= 60 ? 'text-green-600' : 
                    proposal.sentiment >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {proposal.sentiment}%
                  </div>
                  <div className="text-sm text-gray-600">Sentiment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {proposal.engagement}%
                  </div>
                  <div className="text-sm text-gray-600">Engagement</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sentiment</span>
                  <span>{proposal.sentiment}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      proposal.sentiment >= 60 ? 'bg-green-500' : 
                      proposal.sentiment >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${proposal.sentiment}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Engagement</span>
                  <span>{proposal.engagement}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500"
                    style={{ width: `${proposal.engagement}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDebates = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-6">Performance en Debates</h3>
        <div className="space-y-4">
          {(metrics?.debatePerformance || []).map((debate, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{debate.event}</h4>
                  <p className="text-sm text-gray-600">{new Date(debate.date).toLocaleDateString()}</p>
                </div>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  debate.change > 0 ? 'bg-green-100 text-green-800' : 
                  debate.change < 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {debate.change > 0 ? <ArrowUp className="w-4 h-4" /> : 
                   debate.change < 0 ? <ArrowDown className="w-4 h-4" /> : null}
                  <span>{debate.change > 0 ? '+' : ''}{debate.change}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">{debate.sentimentBefore}%</div>
                  <div className="text-xs text-gray-500">Antes</div>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowUp className="w-6 h-6 text-[#01257D]" />
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#01257D]">{debate.sentimentAfter}%</div>
                  <div className="text-xs text-gray-500">Después</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Empty state for non-political users
  if (userProfile.type !== 'politician' && userProfile.type !== 'political') {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Political Pulse Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoreo especializado para campañas políticas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <Vote className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Funcionalidad disponible solo para perfiles políticos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Esta herramienta está diseñada específicamente para campañas políticas y candidatos
          </p>
        </div>
      </div>
    );
  }

  // Empty state for political users without data
  if (!metrics || metrics.totalMentions === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Political Pulse Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitoreo especializado para campañas políticas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
          <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Sin métricas políticas disponibles
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No se encontraron menciones o datos para análisis político
          </p>
          <p className="text-sm text-gray-500">
            El sistema recopila datos automáticamente cada minuto
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Political Pulse Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Monitoreo especializado para campañas políticas
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            
            <button className="px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#01257D]/90 flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'regions', label: 'Por Regiones', icon: MapPin },
            { id: 'proposals', label: 'Propuestas', icon: Target },
            { id: 'debates', label: 'Debates', icon: MessageSquare }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeView === tab.id
                  ? 'bg-[#01257D] text-white'
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
          {activeView === 'overview' && renderOverview()}
          {activeView === 'regions' && renderRegions()}
          {activeView === 'proposals' && renderProposals()}
          {activeView === 'debates' && renderDebates()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, change, positive }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 text-[#01257D]" />
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{value}</div>
      <div className="text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}