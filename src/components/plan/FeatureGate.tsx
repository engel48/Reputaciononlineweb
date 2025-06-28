"use client";

import React from 'react';
import { usePlan, PlanFeatures } from '@/context/PlanContext';
import { Lock, Crown, Zap, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
  upgradeUrl?: string;
  currentUsage?: number;
}

export default function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradeButton = true,
  upgradeUrl = '/dashboard/plan',
  currentUsage = 0
}: FeatureGateProps) {
  const { hasFeature, canUseFeature, getUpgradeMessage, upgradeRequired, currentPlan } = usePlan();
  
  const featureAvailable = hasFeature(feature);
  const canUse = canUseFeature(feature, currentUsage);
  
  // Debug logs
  console.log(`🔍 FeatureGate [${feature}]:`, {
    currentPlan,
    featureAvailable,
    canUse,
    currentUsage
  });
  
  // Si la característica está disponible y se puede usar
  if (featureAvailable && canUse) {
    return <>{children}</>;
  }
  
  // Si se proporciona un fallback personalizado
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Mensaje por defecto cuando la característica no está disponible
  const requiredPlan = upgradeRequired(feature);
  const upgradeMessage = getUpgradeMessage(feature);
  
  return (
    <div className="relative">
      {/* Contenido bloqueado con overlay */}
      <div className="relative">
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
        
        {/* Overlay de bloqueo */}
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center p-6 max-w-sm">
            <div className="mb-4 flex justify-center">
              <div className="p-3 bg-gradient-to-br from-[#01257D] to-[#013AAA] rounded-full">
                <Lock className="h-6 w-6 text-white" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Función Premium
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {upgradeMessage}
            </p>
            
            {showUpgradeButton && requiredPlan && (
              <Link
                href={upgradeUrl}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#01257D] to-[#013AAA] text-white rounded-lg hover:from-[#013AAA] hover:to-[#01257D] transition-all duration-200 transform hover:scale-105"
              >
                <Crown className="mr-2 h-4 w-4" />
                Actualizar Plan
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar límites de uso
interface UsageLimitProps {
  feature: keyof PlanFeatures;
  currentUsage: number;
  label: string;
  className?: string;
}

export function UsageLimit({ feature, currentUsage, label, className = '' }: UsageLimitProps) {
  const { getFeatureLimit, isFeatureUnlimited, canUseFeature } = usePlan();
  
  const limit = getFeatureLimit(feature);
  const unlimited = isFeatureUnlimited(feature);
  const canUse = canUseFeature(feature, currentUsage);
  
  if (unlimited) {
    return (
      <div className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}>
        <span className="text-green-600 dark:text-green-400 font-medium">Ilimitado</span> {label}
      </div>
    );
  }
  
  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;
  
  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-medium ${
          isOverLimit ? 'text-red-600 dark:text-red-400' :
          isNearLimit ? 'text-yellow-600 dark:text-yellow-400' :
          'text-gray-900 dark:text-white'
        }`}>
          {currentUsage} / {limit}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isOverLimit ? 'bg-red-500' :
            isNearLimit ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isOverLimit && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Has excedido el límite de tu plan actual
        </p>
      )}
      
      {isNearLimit && !isOverLimit && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          Te acercas al límite de tu plan
        </p>
      )}
    </div>
  );
}

// Componente para mostrar insignia de plan
interface PlanBadgeProps {
  className?: string;
}

export function PlanBadge({ className = '' }: PlanBadgeProps) {
  const { currentPlan } = usePlan();
  
  const planConfig = {
    free: { label: 'Gratis', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
    basic: { label: 'Básico', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    pro: { label: 'Pro', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    enterprise: { label: 'Enterprise', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
  };
  
  const config = planConfig[currentPlan as keyof typeof planConfig] || planConfig.free;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <Crown className="mr-1 h-3 w-3" />
      {config.label}
    </span>
  );
}