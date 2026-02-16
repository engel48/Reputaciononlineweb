"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Video, Brain, AlertTriangle, TrendingUp, TrendingDown,
  MapPin, Users, MessageSquare, Clock, Eye, Zap, Target,
  HeadphonesIcon, Radio, Tv, Smartphone, Globe, BarChart3,
  Shield, Bell, Settings, RefreshCw, Filter, Calendar,
  CheckCircle, XCircle, AlertCircle, Activity, Sparkles, Hash
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import FeatureGate, { UsageLimit, PlanBadge } from '@/components/plan/FeatureGate';
import PoliticalPulse from '@/components/social-listening/PoliticalPulse';
import InfluenceTracker from '@/components/social-listening/InfluenceTracker';
import AudienceIntelligence from '@/components/social-listening/AudienceIntelligence';
import CrisisManagement from '@/components/social-listening/CrisisManagement';
import MediaMonitoring from '@/components/social-listening/MediaMonitoring';
import AIBrandAdvisor from '@/components/social-listening/AIBrandAdvisor';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import HashtagGeoMap from '@/components/hashtags/HashtagGeoMap';

interface ListeningMetrics {
  totalMentions: number;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  reach: number;
  engagement: number;
  crisisAlerts: number;
  mediaAppearances: number;
}

interface UserProfile {
  type: 'político' | 'influencer' | 'empresa' | 'personalidad';
  specialization?: string;
  region?: string;
}

export default function SocialListeningPage() {
  const { user } = useUser();
  const { hasFeature, currentPlan } = usePlan();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'overview');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<ListeningMetrics | null>(null);

  // Fetch real data from APIs
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const session = await fetch('/api/auth/session').then(r => r.json());
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const metricsResponse = await fetch(`/api/social-listening/metrics?userId=${session.user.id}`);
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.metrics || null);

        const profileResponse = await fetch(`/api/user/profile?userId=${session.user.id}`);
        const profileData = await profileResponse.json();
        setUserProfile(profileData.profile || null);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setMetrics(null);
        setUserProfile(null);
        setIsLoading(false);
      }
    };
    fetchRealData();
  }, []);

  // Determinar tipo de usuario para personalización
  const getUserType = () => {
    return userProfile?.type || 'empresa';
  };

  // Configuración de tabs basada en el tipo de usuario
  const getTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Resumen', icon: BarChart3, premium: false },
      { id: 'hashtags', label: 'Hashtags', icon: Hash, premium: false },
      { id: 'crisis', label: 'Crisis Alert', icon: AlertTriangle, premium: true }
    ];

    if (getUserType() === 'político') {
      return [
        ...baseTabs,
        { id: 'political', label: 'Political Pulse', icon: Target, premium: true },
        { id: 'media', label: 'Media Monitor', icon: Tv, premium: true },
        { id: 'audience', label: 'Audience Intel', icon: Users, premium: false }
      ];
    } else if (getUserType() === 'influencer') {
      return [
        ...baseTabs,
        { id: 'influence', label: 'Influence Tracker', icon: TrendingUp, premium: true },
        { id: 'brand', label: 'Brand Advisor', icon: Sparkles, premium: true },
        { id: 'audience', label: 'Audience Intel', icon: Users, premium: false }
      ];
    }

    return baseTabs;
  };

  // Efectos y funciones
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
        // Aquí iría la lógica de actualización de datos
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const tabs = getTabs();

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return userProfile ? <OverviewTab metrics={metrics} userProfile={userProfile} /> : null;
      case 'hashtags':
        return <HashtagsTab />;
      case 'political':
        return hasFeature('hasAdvancedAnalytics') && userProfile ?
          <PoliticalPulse userProfile={userProfile} /> :
          <FeatureGate feature="hasAdvancedAnalytics"><></></FeatureGate>;
      case 'influence':
        return hasFeature('hasAdvancedAnalytics') && userProfile ?
          <InfluenceTracker userProfile={userProfile} /> : 
          <FeatureGate feature="hasAdvancedAnalytics"><></></FeatureGate>;
      case 'audience':
        return userProfile ? <AudienceIntelligence userProfile={userProfile} /> : null;
      case 'crisis':
        return hasFeature('hasCrisisManagement') && userProfile ?
          <CrisisManagement userProfile={userProfile} /> :
          <FeatureGate feature="hasCrisisManagement"><></></FeatureGate>;
      case 'media':
        return hasFeature('hasMediaCoverage') && userProfile ?
          <MediaMonitoring userProfile={userProfile} /> :
          <FeatureGate feature="hasMediaCoverage"><></></FeatureGate>;
      case 'brand':
        return hasFeature('hasPredictiveAnalytics') && userProfile ?
          <AIBrandAdvisor userProfile={userProfile} /> :
          <FeatureGate feature="hasPredictiveAnalytics"><></></FeatureGate>;
      default:
        return userProfile ? <OverviewTab metrics={metrics} userProfile={userProfile} /> : null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01257D] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Inicializando Social Listening...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 sm:p-6 lg:p-8"
      >
        {/* Header Heroico */}
        <motion.div
          variants={itemVariants}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-[#01257D] via-purple-600 to-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center">
                    <HeadphonesIcon className="mr-3 h-10 w-10" />
                    Social Listening
                    <PlanBadge className="ml-3" />
                  </h1>
                  <p className="text-xl text-blue-100 mb-4">
                    Monitoreo inteligente para {userProfile?.type || 'usuario'}s como {user?.name}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      <span>{metrics?.totalMentions?.toLocaleString() || '0'} menciones</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span>{metrics?.sentiment?.positive || '0'}% sentiment positivo</span>
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-2" />
                      <span>{metrics?.reach ? (metrics.reach / 1000000).toFixed(1) : '0'}M alcance</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full animate-pulse ${
                      (metrics?.crisisAlerts || 0) > 0 ? 'bg-red-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-sm">
                      {(metrics?.crisisAlerts || 0) > 0 ?
                        `${metrics?.crisisAlerts || 0} alertas activas` :
                        'Sin crisis detectadas'
                      }
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`p-1 rounded ${autoRefresh ? 'bg-green-500' : 'bg-gray-500'}`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-[#01257D] text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.premium && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-400 text-black text-xs rounded-full">
                      PRO
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Componente Overview Tab
function OverviewTab({ metrics, userProfile }: { metrics: ListeningMetrics | null, userProfile: UserProfile | null }) {
  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Cargando datos reales...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Métricas principales */}
      <div className="lg:col-span-2 space-y-6">
        {/* Cards de métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={MessageSquare}
            title="Menciones"
            value={metrics.totalMentions.toLocaleString()}
            change="--"
            positive={true}
          />
          <MetricCard
            icon={Eye}
            title="Alcance"
            value={`${(metrics.reach / 1000000).toFixed(1)}M`}
            change="--"
            positive={true}
          />
          <MetricCard
            icon={Activity}
            title="Engagement"
            value={`${metrics.engagement}%`}
            change="--"
            positive={true}
          />
          <MetricCard
            icon={AlertTriangle}
            title="Alertas"
            value={metrics.crisisAlerts.toString()}
            change="--"
            positive={true}
          />
        </div>

        {/* Gráfico de sentiment */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Análisis de Sentiment</h3>
          <div className="space-y-4">
            <SentimentBar
              label="Positivo"
              percentage={metrics.sentiment.positive}
              color="bg-green-500"
            />
            <SentimentBar
              label="Neutral"
              percentage={metrics.sentiment.neutral}
              color="bg-yellow-500"
            />
            <SentimentBar
              label="Negativo"
              percentage={metrics.sentiment.negative}
              color="bg-red-500"
            />
          </div>
        </div>
      </div>

      {/* Panel lateral */}
      <div className="space-y-6">
        {/* Perfil del usuario */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Tu Perfil</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
              <span className="font-medium capitalize">{userProfile?.type || 'No especificado'}</span>
            </div>
            {userProfile?.specialization && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Especialización:</span>
                <span className="font-medium">{userProfile.specialization}</span>
              </div>
            )}
            {userProfile?.region && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Región:</span>
                <span className="font-medium">{userProfile.region}</span>
              </div>
            )}
          </div>
        </div>

        {/* Alertas recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Alertas Recientes</h3>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              Sin alertas en este momento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({ icon: Icon, title, value, change, positive }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-[#01257D]" />
        <span className={`text-xs font-medium ${
          positive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change}
        </span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
    </div>
  );
}

function SentimentBar({ label, percentage, color }: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function HashtagsTab() {
  return (
    <div className="space-y-6">
      <HashtagMonitoring />
      <HashtagGeoMap />
    </div>
  );
}

function AlertItem({ type, message, time }: {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  time: string;
}) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'info': return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
      </div>
    </div>
  );
}