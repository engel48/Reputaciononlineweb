"use client";

import React, { useState } from 'react';
import { SubscriptionPlan, subscriptionPlans, yearlySubscriptionPlans } from '@/lib/subscription';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

interface PlanSelectorProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  selectedPlanId?: string;
}

export default function PlanSelector({ onSelectPlan, selectedPlanId }: PlanSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const plans = billingCycle === 'monthly' ? subscriptionPlans : yearlySubscriptionPlans;
  
  // Animación con GSAP (compatible con el estilo de animación actual)
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    })
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Selector de ciclo de facturación */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-1 inline-flex">
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              billingCycle === 'monthly' 
                ? 'bg-white dark:bg-gray-700 shadow' 
                : 'text-primary-700 dark:text-gray-300'
            }`}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensual
          </button>
          <button
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              billingCycle === 'yearly' 
                ? 'bg-white dark:bg-gray-700 shadow' 
                : 'text-primary-700 dark:text-gray-300'
            }`}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual <span className="text-green-500 text-xs font-bold">20% DESCUENTO</span>
          </button>
        </div>
      </div>
      
      {/* Tarjetas de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div 
            key={plan.id}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className={`relative rounded-xl border ${
              plan.isPopular 
                ? 'border-primary ring-2 ring-primary-400 ring-opacity-20' 
                : 'border-gray-200 dark:border-gray-700'
            } p-6 bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                Más popular
              </div>
            )}
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="text-sm text-primary dark:text-primary-400 mt-1">{plan.description}</p>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(plan.price / 1000).toFixed(3).slice(0, -1)}
              </span>
              <span className="text-primary dark:text-primary-400 ml-1">
                /{billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            </div>
            
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-primary-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => onSelectPlan(plan)}
              className={`mt-6 w-full py-2 px-4 rounded-lg flex justify-center items-center font-medium transition-colors ${
                selectedPlanId === plan.id
                  ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                  : 'bg-primary hover:bg-primary-700 text-white'
              }`}
            >
              {selectedPlanId === plan.id ? 'Plan Seleccionado' : 'Seleccionar Plan'} 
              {selectedPlanId !== plan.id && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
