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
    if (isPolitical && user?.id && !isLoadingMetrics) {
      setIsLoadingMetrics(true);
      getPoliticalMetrics(user.id)
        .then((metrics) => {
          setPoliticalMetrics(metrics);
        })
        .catch((error) => {
          console.error('Error loading political metrics:', error);
          setPoliticalMetrics(defaultPoliticalMetrics);
        })
        .finally(() => {
          setIsLoadingMetrics(false);
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
    };
    
    checkReferrer();
  }, [pathname]);
  
  // Limpiar la marca cuando salimos completamente del contexto político
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
export function PoliticalOnly({ children }: { children: React.ReactNode }) {
  const { isPolitical, isFromPoliticalDashboard } = usePolitical();
  
  if (!isPolitical || !isFromPoliticalDashboard) {
    return null;
  }
  
  return <>{children}</>;
}

// Componente para mostrar métricas políticas adicionales
export function PoliticalMetricsCard() {
  const { metrics, isFromPoliticalDashboard } = usePolitical();
  
  if (!metrics || !isFromPoliticalDashboard) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Métricas Políticas</h3>
        <span className="text-sm bg-white/20 px-2 py-1 rounded">Exclusivo</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm opacity-90">Aprobación</p>
          <p className="text-2xl font-bold">{metrics.approval}%</p>
        </div>
        <div>
          <p className="text-sm opacity-90">Intención de Voto</p>
          <p className="text-2xl font-bold">{metrics.votingIntention}%</p>
        </div>
      </div>
    </div>
  );
}