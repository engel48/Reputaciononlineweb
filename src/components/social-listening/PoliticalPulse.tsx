"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, MapPin, TrendingUp, TrendingDown, Users, MessageSquare,
  Calendar, Target, BarChart3, PieChart, Activity, AlertTriangle,
  CheckCircle, Clock, ArrowUp, ArrowDown, Zap, Globe, Filter,
  Search, RefreshCw, Download, Share2, Eye, ThumbsUp, ThumbsDown
} from 'lucide-react';

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

  const [metrics, setMetrics] = useState<CampaignMetrics>({
    totalMentions: 45230,
    sentiment: {
      positive: 62,
      negative: 25,
      neutral: 13
    },
    byRegion: [
      { region: 'Bogotá', mentions: 12450, sentiment: 65, population: 8000000 },
      { region: 'Medellín', mentions: 8920, sentiment: 58, population: 2500000 },
      { region: 'Cali', mentions: 6780, sentiment: 70, population: 2200000 },
      { region: 'Barranquilla', mentions: 4560, sentiment: 55, population: 1200000 },
      { region: 'Cartagena', mentions: 3890, sentiment: 72, population: 1000000 }
    ],
    byProposal: [
      { proposal: 'Reforma Tributaria', mentions: 15670, sentiment: 45, engagement: 78 },
      { proposal: 'Educación Gratuita', mentions: 13220, sentiment: 82, engagement: 85 },
      { proposal: 'Seguridad Ciudadana', mentions: 11890, sentiment: 68, engagement: 72 },
      { proposal: 'Salud Pública', mentions: 9450, sentiment: 75, engagement: 80 }
    ],
    debatePerformance: [
      { date: '2024-01-15', event: 'Debate Presidencial CNN', sentimentBefore: 58, sentimentAfter: 72, change: 14 },
      { date: '2024-01-08', event: 'Foro Económico', sentimentBefore: 62, sentimentAfter: 59, change: -3 },
      { date: '2024-01-02', event: 'Entrevista Semana', sentimentBefore: 55, sentimentAfter: 68, change: 13 }
    ],
    competitorComparison: [
      { candidate: 'Candidato A', mentions: 38920, sentiment: 58, shareOfVoice: 35 },
      { candidate: 'Tú', mentions: 45230, sentiment: 62, shareOfVoice: 41 },
      { candidate: 'Candidato B', mentions: 31450, sentiment: 52, shareOfVoice: 28 },
      { candidate: 'Candidato C', mentions: 18670, sentiment: 48, shareOfVoice: 17 }
    ]
  });

  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([
    {
      id: '1',
      type: 'controversy',
      title: 'Debate sobre propuesta tributaria genera controversia',
      description: 'Incremento del 35% en menciones negativas tras declaraciones sobre impuestos',
      severity: 'medium',
      timestamp: '2024-01-15T14:30:00Z',
      affectedRegions: ['Bogotá', 'Medellín'],
      sentimentDrop: 12,
      recommendations: [
        'Aclarar posición mediante comunicado oficial',
        'Programar entrevista explicativa',
        'Activar campaña en redes sociales'
      ]
    }
  ]);

  // Simular actualización de datos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Aquí iría la lógica real de actualización de datos
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
          value={metrics.totalMentions.toLocaleString()}
          change="+15%"
          positive={true}
        />
        <MetricCard
          icon={TrendingUp}
          title="Sentiment Positivo"
          value={`${metrics.sentiment.positive}%`}
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
            {metrics.competitorComparison.map((comp, index) => (
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
            {/* Mapa interactivo de Colombia */}
            <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute inset-0 p-4">
                <div className="h-full w-full relative">
                  {/* Simulación de mapa de Colombia con regiones */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
                    {/* Costa Atlántica */}
                    <div className="relative">
                      <div className="bg-green-300 hover:bg-green-400 transition-colors cursor-pointer rounded-lg p-2 mb-1 text-xs text-center shadow-sm">
                        <div className="font-semibold">Atlántico</div>
                        <div className="text-green-800">72% 👍</div>
                      </div>
                      <div className="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer rounded-lg p-2 mb-1 text-xs text-center shadow-sm ml-8">
                        <div className="font-semibold">Magdalena</div>
                        <div className="text-yellow-800">55% 😐</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Región Andina Central */}
                  <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
                    <div className="bg-green-400 hover:bg-green-500 transition-colors cursor-pointer rounded-lg p-3 mb-2 text-xs text-center shadow-lg">
                      <div className="font-bold">Bogotá</div>
                      <div className="text-green-900">65% 👍</div>
                      <div className="text-xs">12.4K menciones</div>
                    </div>
                  </div>
                  
                  {/* Antioquia */}
                  <div className="absolute top-24 left-8">
                    <div className="bg-green-300 hover:bg-green-400 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                      <div className="font-semibold">Antioquia</div>
                      <div className="text-green-800">58% 👍</div>
                      <div className="text-xs">8.9K</div>
                    </div>
                  </div>
                  
                  {/* Valle del Cauca */}
                  <div className="absolute top-32 left-12">
                    <div className="bg-green-400 hover:bg-green-500 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                      <div className="font-semibold">Valle</div>
                      <div className="text-green-900">70% 👍</div>
                      <div className="text-xs">6.8K</div>
                    </div>
                  </div>
                  
                  {/* Región Caribe */}
                  <div className="absolute top-28 right-8">
                    <div className="bg-yellow-300 hover:bg-yellow-400 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                      <div className="font-semibold">Bolívar</div>
                      <div className="text-yellow-800">55% 😐</div>
                      <div className="text-xs">4.6K</div>
                    </div>
                  </div>
                  
                  {/* Región Pacífica */}
                  <div className="absolute bottom-12 left-4">
                    <div className="bg-green-300 hover:bg-green-400 transition-colors cursor-pointer rounded-lg p-2 text-xs text-center shadow-sm">
                      <div className="font-semibold">Nariño</div>
                      <div className="text-green-800">62% 👍</div>
                      <div className="text-xs">2.1K</div>
                    </div>
                  </div>
                  
                  {/* Leyenda */}
                  <div className="absolute bottom-2 right-2 bg-white/90 rounded-lg p-2 text-xs">
                    <div className="font-semibold mb-1">Sentiment</div>
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <span>Alto (60%+)</span>
                    </div>
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span>Medio (40-60%)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-400 rounded"></div>
                      <span>Bajo (&lt;40%)</span>
                    </div>
                  </div>
                  
                  {/* Título del mapa */}
                  <div className="absolute top-2 left-2 bg-white/90 rounded-lg p-2">
                    <div className="font-bold text-sm text-[#01257D]">🇨🇴 Mapa de Sentiment</div>
                    <div className="text-xs text-gray-600">Click en regiones para detalles</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de regiones */}
            <div className="space-y-4">
              {metrics.byRegion.map((region, index) => (
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
          {metrics.byProposal.map((proposal, index) => (
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
          {metrics.debatePerformance.map((debate, index) => (
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