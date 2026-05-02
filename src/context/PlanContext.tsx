"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';

// Definicion de features por plan (interface estable)
export interface PlanFeatures {
  // Limites generales
  maxSocialAccounts: number;
  maxMonthlyCredits: number;
  maxSearchQueries: number;
  maxReports: number;

  // Caracteristicas booleanas
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

  // Caracteristicas politicas (opcionales)
  hasVoterSentiment?: boolean;
  hasCampaignTracking?: boolean;
  hasPoliticalInsights?: boolean;
  hasElectionAnalytics?: boolean;
  hasOpponentTracking?: boolean;
  hasPublicOpinionPolls?: boolean;
  hasMediaCoverage?: boolean;
  hasSpeechAnalysis?: boolean;
}

interface DbPlan {
  code: string;
  name: string;
  description: string;
  priceCop: number;
  monthlyCredits: number;
  maxSocialAccounts: number;
  multiAccountPerPlatform: boolean;
  features: Record<string, boolean>;
  isPopular: boolean;
  displayOrder: number;
}

// Fallback minimo SOLO para uso mientras el fetch a /api/plans no termina o
// si la API esta caida. NO es la fuente de verdad — la DB lo es.
const FALLBACK_FEATURES: PlanFeatures = {
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
};

// Mapeo de keys del jsonb features (camelCase corto) a las propiedades hasXxx
// del PlanFeatures interface usadas en la UI.
const FEATURE_KEY_TO_PROP: Record<string, keyof PlanFeatures> = {
  advancedAnalytics: 'hasAdvancedAnalytics',
  realTimeMonitoring: 'hasRealTimeMonitoring',
  sentimentAnalysis: 'hasSentimentAnalysis',
  competitorAnalysis: 'hasCompetitorAnalysis',
  customReports: 'hasCustomReports',
  apiAccess: 'hasAPIAccess',
  prioritySupport: 'hasPrioritySupport',
  whiteLabeling: 'hasWhiteLabeling',
  multiLanguageSupport: 'hasMultiLanguageSupport',
  predictiveAnalytics: 'hasPredictiveAnalytics',
  influencerIdentification: 'hasInfluencerIdentification',
  crisisManagement: 'hasCrisisManagement',
  teamCollaboration: 'hasTeamCollaboration',
  dataExport: 'hasDataExport',
  customDashboards: 'hasCustomDashboards',
  automatedReporting: 'hasAutomatedReporting',
  integrations: 'hasIntegrations',
  dedicatedManager: 'hasDedicatedManager',
  voterSentiment: 'hasVoterSentiment',
  campaignTracking: 'hasCampaignTracking',
  politicalInsights: 'hasPoliticalInsights',
  electionAnalytics: 'hasElectionAnalytics',
  opponentTracking: 'hasOpponentTracking',
  publicOpinionPolls: 'hasPublicOpinionPolls',
  mediaCoverage: 'hasMediaCoverage',
  speechAnalysis: 'hasSpeechAnalysis',
};

function dbPlanToFeatures(plan: DbPlan): PlanFeatures {
  const out: PlanFeatures = { ...FALLBACK_FEATURES };
  out.maxSocialAccounts = plan.maxSocialAccounts;
  out.maxMonthlyCredits = plan.monthlyCredits;

  // Limites no presentes en plans table: derivar segun marcadores en features
  out.maxSearchQueries = plan.features.unlimitedSearches ? -1 : Math.max(10, plan.monthlyCredits / 10);
  out.maxReports = plan.features.unlimitedReports ? -1 : Math.max(1, Math.floor(plan.monthlyCredits / 500));

  for (const [jsonKey, propName] of Object.entries(FEATURE_KEY_TO_PROP)) {
    if (plan.features[jsonKey] !== undefined) {
      (out as any)[propName] = plan.features[jsonKey];
    }
  }
  return out;
}

interface PlanContextType {
  features: PlanFeatures;
  currentPlan: string;
  plans: DbPlan[];
  loading: boolean;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  canUseFeature: (featureName: keyof PlanFeatures, currentUsage?: number) => boolean;
  getFeatureLimit: (featureName: keyof PlanFeatures) => number;
  isFeatureUnlimited: (featureName: keyof PlanFeatures) => boolean;
  upgradeRequired: (featureName: keyof PlanFeatures) => string | null;
  getUpgradeMessage: (featureName: keyof PlanFeatures) => string;
  changePlan: (newPlan: string) => Promise<boolean>;
  refetchPlans: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, updateUser } = useUser();
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPlan = user?.plan || 'free';

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(Array.isArray(data.plans) ? data.plans : []);
    } catch (err) {
      console.warn('PlanContext: error cargando /api/plans, usando fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Refetch cuando cambia el plan del usuario (compra/upgrade)
  useEffect(() => {
    const handler = () => { fetchPlans(); };
    if (typeof window !== 'undefined') {
      window.addEventListener('planChanged', handler as EventListener);
      window.addEventListener('plansChanged', handler as EventListener);
      return () => {
        window.removeEventListener('planChanged', handler as EventListener);
        window.removeEventListener('plansChanged', handler as EventListener);
      };
    }
  }, [fetchPlans]);

  const planFromDb = plans.find((p) => p.code === currentPlan);
  const features: PlanFeatures = planFromDb
    ? dbPlanToFeatures(planFromDb)
    : FALLBACK_FEATURES;

  const hasFeature = (featureName: keyof PlanFeatures): boolean => {
    const value = features[featureName];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0 || value === -1;
    return false;
  };

  const canUseFeature = (featureName: keyof PlanFeatures, currentUsage: number = 0): boolean => {
    const value = features[featureName];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value === -1) return true;
      return currentUsage < value;
    }
    return false;
  };

  const getFeatureLimit = (featureName: keyof PlanFeatures): number => {
    const value = features[featureName];
    return typeof value === 'number' ? value : 0;
  };

  const isFeatureUnlimited = (featureName: keyof PlanFeatures): boolean => {
    const value = features[featureName];
    return typeof value === 'number' && value === -1;
  };

  const upgradeRequired = (featureName: keyof PlanFeatures): string | null => {
    if (hasFeature(featureName)) return null;
    // Recorrer planes en orden de display_order ascendente buscando el primero
    // que tenga la feature habilitada
    const ordered = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
    for (const p of ordered) {
      if (p.code === currentPlan) continue;
      const planFeatures = dbPlanToFeatures(p);
      const value = planFeatures[featureName];
      if ((typeof value === 'boolean' && value) || (typeof value === 'number' && (value > 0 || value === -1))) {
        return p.code;
      }
    }
    return null;
  };

  const getUpgradeMessage = (featureName: keyof PlanFeatures): string => {
    const requiredPlanCode = upgradeRequired(featureName);
    if (!requiredPlanCode) {
      return 'Esta caracteristica esta disponible en tu plan actual.';
    }
    const plan = plans.find((p) => p.code === requiredPlanCode);
    const name = plan?.name || requiredPlanCode;
    return `Esta caracteristica requiere el ${name} o superior.`;
  };

  const changePlan = async (newPlan: string): Promise<boolean> => {
    try {
      await updateUser({ plan: newPlan as 'free' | 'basic' | 'pro' | 'enterprise' });
      return true;
    } catch (error) {
      console.error('PlanContext: error cambiando plan:', error);
      return false;
    }
  };

  const contextValue: PlanContextType = {
    features,
    currentPlan,
    plans,
    loading,
    hasFeature,
    canUseFeature,
    getFeatureLimit,
    isFeatureUnlimited,
    upgradeRequired,
    getUpgradeMessage,
    changePlan,
    refetchPlans: fetchPlans,
  };

  return (
    <PlanContext.Provider value={contextValue}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextType => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error('usePlan debe ser usado dentro de un PlanProvider');
  }
  return context;
};
