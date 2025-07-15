"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { usePathname } from 'next/navigation';
import { getPoliticalMetrics } from '@/lib/services/politicalAnalyticsService';

interface PoliticalMetrics {
  approval: number;
  votingIntention: number;
  politicalReach: number;
  politicalEngagement: number;
  demographicApproval: {
    young: number;    // 18-35
    middle: number;   // 36-50
    senior: number;   // 51+
  };
  topPoliticalIssues: Array<{
    issue: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    mentions: number;
    trend: number;
  }>;
  // Para integración con datos reales
  lastUpdated?: Date;
  dataSource?: 'real' | 'simulated';
}

interface PoliticalContextType {
  isPolitical: boolean;
  isFromPoliticalDashboard: boolean;
  theme: 'political' | 'standard';
  terminology: {
    satisfaction: string;
    mentions: string;
    analytics: string;
    audience: string;
    report: string;
  };
  metrics: PoliticalMetrics | null;
  features: {
    showApprovalMetrics: boolean;
    showVotingIntention: boolean;
    showPoliticalNews: boolean;
    showDemographicBreakdown: boolean;
    enhancedAnalytics: boolean;
  };
}

const defaultPoliticalMetrics: PoliticalMetrics = {
  approval: 72.4,
  votingIntention: 68.1,
  politicalReach: 2800000,
  politicalEngagement: 94.2,
  demographicApproval: {
    young: 68,
    middle: 74,
    senior: 76
  },
  topPoliticalIssues: [
    { issue: 'Política Económica', sentiment: 'positive', mentions: 1234, trend: 23 },
    { issue: 'Educación Pública', sentiment: 'positive', mentions: 987, trend: 18 },
    { issue: 'Reforma Tributaria', sentiment: 'neutral', mentions: 856, trend: 15 },
    { issue: 'Seguridad Ciudadana', sentiment: 'negative', mentions: 743, trend: 12 }
  ],
  dataSource: 'simulated',
  lastUpdated: new Date()
};

const PoliticalContext = createContext<PoliticalContextType>({
  isPolitical: false,
  isFromPoliticalDashboard: false,
  theme: 'standard',
  terminology: {
    satisfaction: 'Satisfacción',
    mentions: 'Menciones',
    analytics: 'Analytics',
    audience: 'Audiencia',
    report: 'Reporte'
  },
  metrics: null,
  features: {
    showApprovalMetrics: false,
    showVotingIntention: false,
    showPoliticalNews: false,
    showDemographicBreakdown: false,
    enhancedAnalytics: false
  }
});

export function PoliticalProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const pathname = usePathname();
  const [isFromPoliticalDashboard, setIsFromPoliticalDashboard] = useState(false);
  const [politicalMetrics, setPoliticalMetrics] = useState<PoliticalMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  
  const isPolitical = user?.profileType === 'political';
  
  // Cargar métricas políticas cuando sea usuario político
  useEffect(() => {
    console.log('🔄 Political metrics loading check:', {
      isPolitical,
      hasUserId: !!user?.id,
      isLoadingMetrics,
      currentMetrics: politicalMetrics ? 'exists' : 'null'
    });
    
    if (isPolitical && user?.id && !isLoadingMetrics) {
      console.log('🚀 Starting to load political metrics for user:', user.id);
      setIsLoadingMetrics(true);
      getPoliticalMetrics(user.id)
        .then((metrics) => {
          console.log('✅ Political metrics loaded successfully:', metrics);
          setPoliticalMetrics(metrics);
        })
        .catch((error) => {
          console.error('❌ Error loading political metrics:', error);
          console.log('🔄 Using default political metrics as fallback');
          setPoliticalMetrics(defaultPoliticalMetrics);
        })
        .finally(() => {
          setIsLoadingMetrics(false);
          console.log('✅ Political metrics loading completed');
        });
    }
  }, [isPolitical, user?.id]);
  
  // Detectar si venimos del dashboard político
  useEffect(() => {
    const checkReferrer = () => {
      // Verificar si la ruta anterior era del dashboard político
      const fromPolitical = sessionStorage.getItem('fromPoliticalDashboard') === 'true';
      setIsFromPoliticalDashboard(fromPolitical);
      
      // Si estamos en el dashboard político, marcar la sesión
      if (pathname?.includes('dashboard-politico')) {
        sessionStorage.setItem('fromPoliticalDashboard', 'true');
        setIsFromPoliticalDashboard(true);
      }
      
      // IMPORTANTE: Mantener el estado político mientras navegamos en dashboard normal
      // si venimos del dashboard político
      if (pathname?.includes('/dashboard/') && fromPolitical) {
        setIsFromPoliticalDashboard(true);
      }
    };
    
    checkReferrer();
  }, [pathname]);
  
  // Limpiar la marca SOLO cuando salimos completamente del dashboard
  useEffect(() => {
    if (!pathname?.includes('dashboard') && !pathname?.includes('dashboard-politico')) {
      sessionStorage.removeItem('fromPoliticalDashboard');
      setIsFromPoliticalDashboard(false);
    }
  }, [pathname]);
  
  const contextValue: PoliticalContextType = {
    isPolitical,
    isFromPoliticalDashboard: isPolitical && isFromPoliticalDashboard,
    theme: isPolitical && isFromPoliticalDashboard ? 'political' : 'standard',
    terminology: isPolitical && isFromPoliticalDashboard ? {
      satisfaction: 'Aprobación',
      mentions: 'Menciones Políticas',
      analytics: 'Análisis Político',
      audience: 'Votantes y Simpatizantes',
      report: 'Reporte Político'
    } : {
      satisfaction: 'Satisfacción',
      mentions: 'Menciones',
      analytics: 'Analytics',
      audience: 'Audiencia',
      report: 'Reporte'
    },
    metrics: isPolitical ? (politicalMetrics || defaultPoliticalMetrics) : null,
    features: {
      showApprovalMetrics: isPolitical && isFromPoliticalDashboard,
      showVotingIntention: isPolitical && isFromPoliticalDashboard,
      showPoliticalNews: isPolitical,
      showDemographicBreakdown: isPolitical && isFromPoliticalDashboard,
      enhancedAnalytics: isPolitical
    }
  };

  // Debug logs para entender el problema
  useEffect(() => {
    console.log('🔍 PoliticalContext Debug:', {
      user: user ? { id: user.id, name: user.name, profileType: user.profileType } : null,
      isPolitical,
      isFromPoliticalDashboard,
      pathname,
      sessionStorage: sessionStorage.getItem('fromPoliticalDashboard'),
      politicalMetrics: politicalMetrics ? 'loaded' : 'null',
      contextValue: {
        isPolitical: contextValue.isPolitical,
        isFromPoliticalDashboard: contextValue.isFromPoliticalDashboard,
        hasMetrics: !!contextValue.metrics
      }
    });
  }, [user, isPolitical, isFromPoliticalDashboard, pathname, politicalMetrics]);
  
  return (
    <PoliticalContext.Provider value={contextValue}>
      {children}
    </PoliticalContext.Provider>
  );
}

export function usePolitical() {
  const context = useContext(PoliticalContext);
  if (!context) {
    throw new Error('usePolitical must be used within a PoliticalProvider');
  }
  return context;
}

// Hook helper para verificar rápidamente si debe mostrar contenido político
export function usePoliticalFeature(feature: keyof PoliticalContextType['features']) {
  const { features } = usePolitical();
  return features[feature];
}

// Componente helper para renderizado condicional
export function PoliticalOnly({ 
  children, 
  requirePoliticalDashboard = false 
}: { 
  children: React.ReactNode;
  requirePoliticalDashboard?: boolean;
}) {
  const { isPolitical, isFromPoliticalDashboard } = usePolitical();
  
  // Si requirePoliticalDashboard es true, necesita ambas condiciones
  // Si es false, solo necesita ser usuario político
  if (!isPolitical || (requirePoliticalDashboard && !isFromPoliticalDashboard)) {
    return null;
  }
  
  return <>{children}</>;
}

// Componente para mostrar métricas políticas adicionales
export function PoliticalMetricsCard() {
  const { metrics, isFromPoliticalDashboard, isPolitical } = usePolitical();
  
  // Debug log
  console.log('🎯 PoliticalMetricsCard Debug:', {
    isPolitical,
    isFromPoliticalDashboard,
    hasMetrics: !!metrics,
    shouldRender: !!(metrics && isPolitical)
  });
  
  // Mostrar si es usuario político, sin importar desde dónde navegó
  if (!metrics || !isPolitical) {
    console.log('❌ PoliticalMetricsCard: Not rendering because:', {
      hasMetrics: !!metrics,
      isPolitical
    });
    return null;
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con gradiente político */}
      <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-500 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Métricas Políticas Exclusivas</h3>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">
            Perfil Político
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Aprobación General</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.approval}%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Intención de Voto</p>
            <p className="text-2xl font-bold text-orange-600">{metrics.votingIntention}%</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Alcance Político</p>
            <p className="text-2xl font-bold text-blue-600">
              {(metrics.politicalReach / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Engagement Político</p>
            <p className="text-2xl font-bold text-green-600">{metrics.politicalEngagement}%</p>
          </div>
        </div>
        
        {/* Aprobación demográfica */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Aprobación por Grupos Demográficos
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">18-35 años</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.demographicApproval.young}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">36-50 años</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.demographicApproval.middle}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">51+ años</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.demographicApproval.senior}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Temas políticos principales */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Principales Temas Políticos
          </h4>
          <div className="space-y-2">
            {metrics.topPoliticalIssues.slice(0, 3).map((issue, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {issue.issue}
                  </span>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      issue.sentiment === 'positive' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : issue.sentiment === 'negative'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {issue.sentiment === 'positive' ? 'Positivo' : 
                       issue.sentiment === 'negative' ? 'Negativo' : 'Neutral'}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {issue.mentions} menciones
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    +{issue.trend}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer con timestamp */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Última actualización: {metrics.lastUpdated?.toLocaleString('es-ES') || 'Ahora'} • 
            Datos: {metrics.dataSource === 'real' ? 'API Real' : 'Simulados'}
          </p>
        </div>
      </div>
    </div>
  );
}