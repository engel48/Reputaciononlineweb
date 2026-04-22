"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser } from './UserContext';

// Definición de features por plan
export interface PlanFeatures {
  // Límites generales
  maxSocialAccounts: number;
  maxMonthlyCredits: number;
  maxSearchQueries: number;
  maxReports: number;
  
  // Características booleanas
  hasAdvancedAnalytics: boolean;
  hasRealTimeMonitoring: boolean;
  hasSentimentAnalysis: boolean;
  hasCompetitorAnalysis: boolean;
  hasCustomReports: boolean;
  hasAPIAccess: boolean;
  hasPrioritySupport: boolean;
  hasWhiteLabeling: boolean;
  hasMultiLanguageSupport: boolean;
  hasPredictiveAnalytics: boolean;
  hasInfluencerIdentification: boolean;
  hasCrisisManagement: boolean;
  hasTeamCollaboration: boolean;
  hasDataExport: boolean;
  hasCustomDashboards: boolean;
  hasAutomatedReporting: boolean;
  hasIntegrations: boolean;
  hasDedicatedManager: boolean;
  
  // Características específicas para políticos
  hasVoterSentiment?: boolean;
  hasCampaignTracking?: boolean;
  hasPoliticalInsights?: boolean;
  hasElectionAnalytics?: boolean;
  hasOpponentTracking?: boolean;
  hasPublicOpinionPolls?: boolean;
  hasMediaCoverage?: boolean;
  hasSpeechAnalysis?: boolean;
}

// Configuración de features por plan
const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    maxSocialAccounts: 1,
    maxMonthlyCredits: 100,
    maxSearchQueries: 10,
    maxReports: 1,
    hasAdvancedAnalytics: false,
    hasRealTimeMonitoring: false,
    hasSentimentAnalysis: true,
    hasCompetitorAnalysis: false,
    hasCustomReports: false,
    hasAPIAccess: false,
    hasPrioritySupport: false,
    hasWhiteLabeling: false,
    hasMultiLanguageSupport: false,
    hasPredictiveAnalytics: false,
    hasInfluencerIdentification: false,
    hasCrisisManagement: false,
    hasTeamCollaboration: false,
    hasDataExport: false,
    hasCustomDashboards: false,
    hasAutomatedReporting: false,
    hasIntegrations: false,
    hasDedicatedManager: false,
    hasVoterSentiment: false,
    hasCampaignTracking: false,
    hasPoliticalInsights: false,
    hasElectionAnalytics: false,
    hasOpponentTracking: false,
    hasPublicOpinionPolls: false,
    hasMediaCoverage: false,
    hasSpeechAnalysis: false,
  },
  basic: {
    maxSocialAccounts: 3,
    maxMonthlyCredits: 500,
    maxSearchQueries: 50,
    maxReports: 3,
    hasAdvancedAnalytics: false,
    hasRealTimeMonitoring: true,
    hasSentimentAnalysis: true,
    hasCompetitorAnalysis: false,
    hasCustomReports: false,
    hasAPIAccess: false,
    hasPrioritySupport: false,
    hasWhiteLabeling: false,
    hasMultiLanguageSupport: true,
    hasPredictiveAnalytics: false,
    hasInfluencerIdentification: false,
    hasCrisisManagement: false,
    hasTeamCollaboration: false,
    hasDataExport: true,
    hasCustomDashboards: false,
    hasAutomatedReporting: false,
    hasIntegrations: false,
    hasDedicatedManager: false,
    hasVoterSentiment: false,
    hasCampaignTracking: false,
    hasPoliticalInsights: false,
    hasElectionAnalytics: false,
    hasOpponentTracking: false,
    hasPublicOpinionPolls: false,
    hasMediaCoverage: true,
    hasSpeechAnalysis: false,
  },
  pro: {
    maxSocialAccounts: 4,
    maxMonthlyCredits: 5000,
    maxSearchQueries: 500,
    maxReports: 10,
    hasAdvancedAnalytics: true,
    hasRealTimeMonitoring: true,
    hasSentimentAnalysis: true,
    hasCompetitorAnalysis: true,
    hasCustomReports: true,
    hasAPIAccess: true,
    hasPrioritySupport: true,
    hasWhiteLabeling: false,
    hasMultiLanguageSupport: true,
    hasPredictiveAnalytics: true,
    hasInfluencerIdentification: true,
    hasCrisisManagement: true,
    hasTeamCollaboration: true,
    hasDataExport: true,
    hasCustomDashboards: true,
    hasAutomatedReporting: true,
    hasIntegrations: true,
    hasDedicatedManager: false,
    hasVoterSentiment: true,
    hasCampaignTracking: true,
    hasPoliticalInsights: true,
    hasElectionAnalytics: true,
    hasOpponentTracking: true,
    hasPublicOpinionPolls: true,
    hasMediaCoverage: true,
    hasSpeechAnalysis: true,
  },
  enterprise: {
    maxSocialAccounts: 8, // Múltiples cuentas por red permitidas
    maxMonthlyCredits: 50000, // Renovación mensual automática
    maxSearchQueries: -1, // Ilimitado
    maxReports: -1, // Ilimitado
    hasAdvancedAnalytics: true,
    hasRealTimeMonitoring: true,
    hasSentimentAnalysis: true,
    hasCompetitorAnalysis: true,
    hasCustomReports: true,
    hasAPIAccess: true,
    hasPrioritySupport: true,
    hasWhiteLabeling: true,
    hasMultiLanguageSupport: true,
    hasPredictiveAnalytics: true,
    hasInfluencerIdentification: true,
    hasCrisisManagement: true,
    hasTeamCollaboration: true,
    hasDataExport: true,
    hasCustomDashboards: true,
    hasAutomatedReporting: true,
    hasIntegrations: true,
    hasDedicatedManager: true,
    hasVoterSentiment: true,
    hasCampaignTracking: true,
    hasPoliticalInsights: true,
    hasElectionAnalytics: true,
    hasOpponentTracking: true,
    hasPublicOpinionPolls: true,
    hasMediaCoverage: true,
    hasSpeechAnalysis: true,
  },
};

interface PlanContextType {
  features: PlanFeatures;
  currentPlan: string;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  canUseFeature: (featureName: keyof PlanFeatures, currentUsage?: number) => boolean;
  getFeatureLimit: (featureName: keyof PlanFeatures) => number;
  isFeatureUnlimited: (featureName: keyof PlanFeatures) => boolean;
  upgradeRequired: (featureName: keyof PlanFeatures) => string | null;
  getUpgradeMessage: (featureName: keyof PlanFeatures) => string;
  changePlan: (newPlan: string) => Promise<boolean>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useUser();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Determinar el plan actual (default a 'free' si no está definido)
  const currentPlan = user?.plan || 'free';
  
  // Obtener las características del plan actual
  const features = PLAN_FEATURES[currentPlan] || PLAN_FEATURES.free;
  
  // Escuchar cambios de plan para forzar actualización
  useEffect(() => {
    const handlePlanChange = (event: CustomEvent) => {
      console.log('🔄 PlanContext: Plan change detected', event.detail);
      setForceUpdate(prev => prev + 1);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('planChanged' as any, handlePlanChange);
      
      return () => {
        window.removeEventListener('planChanged' as any, handlePlanChange);
      };
    }
  }, []);

  // Forzar actualización cuando cambie el plan del usuario
  useEffect(() => {
    console.log('🔄 PlanContext: User plan changed to:', user?.plan);
    setForceUpdate(prev => prev + 1);
  }, [user?.plan]);
  
  // Verificar si una característica está disponible
  const hasFeature = (featureName: keyof PlanFeatures): boolean => {
    const feature = features[featureName];
    const result = (() => {
      if (typeof feature === 'boolean') {
        return feature;
      }
      if (typeof feature === 'number') {
        return feature > 0 || feature === -1; // -1 significa ilimitado
      }
      return false;
    })();
    
    console.log(`🔍 Verificando feature "${featureName}" para plan "${currentPlan}":`, {
      featureValue: feature,
      hasAccess: result,
      planFeatures: features
    });
    
    return result;
  };
  
  // Verificar si se puede usar una característica considerando límites
  const canUseFeature = (featureName: keyof PlanFeatures, currentUsage: number = 0): boolean => {
    const feature = features[featureName];
    if (typeof feature === 'boolean') {
      return feature;
    }
    if (typeof feature === 'number') {
      if (feature === -1) return true; // Ilimitado
      return currentUsage < feature;
    }
    return false;
  };
  
  // Obtener el límite de una característica
  const getFeatureLimit = (featureName: keyof PlanFeatures): number => {
    const feature = features[featureName];
    if (typeof feature === 'number') {
      return feature;
    }
    return 0;
  };
  
  // Verificar si una característica es ilimitada
  const isFeatureUnlimited = (featureName: keyof PlanFeatures): boolean => {
    const feature = features[featureName];
    return typeof feature === 'number' && feature === -1;
  };
  
  // Determinar qué plan se necesita para acceder a una característica
  const upgradeRequired = (featureName: keyof PlanFeatures): string | null => {
    if (hasFeature(featureName)) {
      return null; // Ya tiene acceso
    }
    
    // Buscar el plan más económico que tenga esta característica
    const plans = ['basic', 'pro', 'enterprise'];
    for (const plan of plans) {
      const planFeatures = PLAN_FEATURES[plan];
      const feature = planFeatures[featureName];
      if ((typeof feature === 'boolean' && feature) || 
          (typeof feature === 'number' && (feature > 0 || feature === -1))) {
        return plan;
      }
    }
    
    return 'enterprise'; // Por defecto, enterprise tiene todo
  };
  
  // Obtener mensaje de upgrade
  const getUpgradeMessage = (featureName: keyof PlanFeatures): string => {
    const requiredPlan = upgradeRequired(featureName);
    if (!requiredPlan) {
      return 'Esta característica está disponible en tu plan actual.';
    }
    
    const planNames = {
      basic: 'Plan Básico',
      pro: 'Plan Pro',
      enterprise: 'Plan Enterprise'
    };
    
    return `Esta característica requiere el ${planNames[requiredPlan as keyof typeof planNames] || 'Plan Enterprise'} o superior.`;
  };
  
  // Función para cambiar plan
  const changePlan = async (newPlan: string): Promise<boolean> => {
    try {
      console.log('🔄 PlanContext: Iniciando cambio de plan a:', newPlan);
      await updateUser({ plan: newPlan as 'free' | 'basic' | 'pro' | 'enterprise' });
      console.log('✅ PlanContext: Plan cambiado exitosamente a:', newPlan);
      return true;
    } catch (error) {
      console.error('❌ PlanContext: Error changing plan:', error);
      return false;
    }
  };
  
  const contextValue: PlanContextType = {
    features,
    currentPlan,
    hasFeature,
    canUseFeature,
    getFeatureLimit,
    isFeatureUnlimited,
    upgradeRequired,
    getUpgradeMessage,
    changePlan,
  };
  
  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

// Hook personalizado para usar el contexto de planes
export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan debe ser usado dentro de un PlanProvider');
  }
  return context;
};