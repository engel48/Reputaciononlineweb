"use client";

import React from 'react';
import { Subscription, SubscriptionPlan, getNextBillingDate } from '@/lib/subscription';
import { CalendarDays, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface SubscriptionDetailsProps {
  subscription: Subscription;
  plan: SubscriptionPlan;
  onCancel: () => void;
  onUpgrade: () => void;
}

export default function SubscriptionDetails({ 
  subscription, 
  plan, 
  onCancel, 
  onUpgrade 
}: SubscriptionDetailsProps) {
  const nextBillingDate = getNextBillingDate(subscription.currentPeriodEnd);
  
  // Estado de la suscripción
  const getStatusBadge = () => {
    switch(subscription.status) {
      case 'active':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Activa</span>
          </div>
        );
      case 'past_due':
        return (
          <div className="flex items-center gap-1 text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300 px-2 py-1 rounded text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Pago Pendiente</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Cancelada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{subscription.status}</span>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalles de Suscripción</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administra tu plan y método de pago
          </p>
        </div>
        {getStatusBadge()}
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Plan Actual
        </h3>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{plan.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ${(plan.price / 1000).toFixed(3).slice(0, -1)} / 
                {plan.billingCycle === 'monthly' ? 'mes' : 'año'}
              </p>
            </div>
            
            <button
              onClick={onUpgrade}
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline"
            >
              Cambiar plan
            </button>
          </div>
          
          <div className="mt-4 flex items-center text-sm text-gray-700 dark:text-gray-300">
            <CalendarDays className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            {subscription.cancelAtPeriodEnd 
              ? `Tu plan se cancelará el ${nextBillingDate}`
              : `Próxima renovación el ${nextBillingDate}`
            }
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Método de Pago
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
            <CreditCard className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </div>
          <div>
            <p className="text-gray-900 dark:text-white font-medium">•••• •••• •••• 4242</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Expira 12/2025</p>
          </div>
          <button className="ml-auto text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:underline">
            Actualizar
          </button>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Cancelar Suscripción
        </h3>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Al cancelar tu suscripción, seguirás teniendo acceso al servicio hasta el final del periodo 
          de facturación actual.
        </p>
        
        <button
          onClick={onCancel}
          className="text-sm px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 
          dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 rounded-lg"
        >
          Cancelar suscripción
        </button>
      </div>
    </div>
  );
}
