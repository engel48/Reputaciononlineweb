"use client";

import React from 'react';
import { Coins } from 'lucide-react';
import { CREDIT_COSTS, CreditAction, getActionLabel } from '@/lib/credit-costs';

interface CreditCostBadgeProps {
  action: CreditAction;
  quantity?: number;
  currentBalance?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function CreditCostBadge({
  action,
  quantity = 1,
  currentBalance,
  size = 'sm',
  showLabel = false,
  className = '',
}: CreditCostBadgeProps) {
  const cost = CREDIT_COSTS[action] * quantity;
  const canAfford = currentBalance === undefined || currentBalance < 0 || currentBalance >= cost;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${
        canAfford
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      } ${className}`}
      title={`${getActionLabel(action)}: ${cost} credito${cost !== 1 ? 's' : ''}`}
    >
      <Coins className={iconSizes[size]} />
      <span>{cost}</span>
      {showLabel && <span className="ml-0.5">cred.</span>}
    </span>
  );
}

interface CreditCostEstimateProps {
  totalCost: number;
  currentBalance?: number;
  className?: string;
}

export function CreditCostEstimate({ totalCost, currentBalance, className = '' }: CreditCostEstimateProps) {
  const canAfford = currentBalance === undefined || currentBalance < 0 || currentBalance >= totalCost;

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Coins className="h-4 w-4 text-amber-500" />
      <span className={canAfford ? 'text-gray-600 dark:text-gray-400' : 'text-red-600 dark:text-red-400 font-medium'}>
        Costo estimado: {totalCost} credito{totalCost !== 1 ? 's' : ''}
      </span>
      {!canAfford && currentBalance !== undefined && (
        <span className="text-red-500 text-xs">(tienes {currentBalance})</span>
      )}
    </div>
  );
}

interface InsufficientCreditsAlertProps {
  requiredCredits: number;
  currentBalance: number;
}

export function InsufficientCreditsAlert({ requiredCredits, currentBalance }: InsufficientCreditsAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4">
      <div className="flex items-start gap-3">
        <Coins className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Creditos insuficientes
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            Necesitas {requiredCredits} creditos pero solo tienes {currentBalance}.
          </p>
          <a
            href="/dashboard/creditos/comprar"
            className="inline-block mt-2 text-sm font-medium text-red-700 dark:text-red-300 underline hover:no-underline"
          >
            Recargar creditos
          </a>
        </div>
      </div>
    </div>
  );
}
