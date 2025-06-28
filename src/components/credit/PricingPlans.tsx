"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Check, X, ChevronRight, Star } from 'lucide-react';

interface PlanFeature {
  title: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  description: string;
  features: PlanFeature[];
  isPopular?: boolean;
  buttonText: string;
}

interface PricingPlansProps {
  plans: PricingPlan[];
  yearlyBilling?: boolean;
}

const PricingPlans: React.FC<PricingPlansProps> = ({
  plans,
  yearlyBilling = false
}) => {
  const plansRef = useRef<HTMLDivElement>(null);
  const planRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (plansRef.current) {
      // Animación inicial del contenedor
      gsap.from(plansRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });

      // Animación de cada plan
      if (planRefs.current.length > 0) {
        gsap.from(planRefs.current, {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.2,
          ease: 'power2.out',
          delay: 0.3
        });
      }
    }
  }, [plans]);

  // Efecto de hover para planes
  const handlePlanHover = (index: number, isEnter: boolean) => {
    if (planRefs.current[index]) {
      gsap.to(planRefs.current[index], {
        scale: isEnter ? 1.03 : 1,
        boxShadow: isEnter ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  };

  return (
    <div ref={plansRef} className="w-full">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan, index) => (
          <div
            key={plan.id}
            ref={el => planRefs.current[index] = el}
            className={`relative rounded-lg border ${
              plan.isPopular
                ? 'border-primary-400 dark:border-primary-600'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white p-6 shadow-lg transition-all duration-300 dark:bg-gray-800`}
            onMouseEnter={() => handlePlanHover(index, true)}
            onMouseLeave={() => handlePlanHover(index, false)}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 right-6 inline-flex items-center rounded-full bg-primary-500 px-4 py-1 text-xs font-semibold text-white">
                <Star className="mr-1 h-3 w-3" />
                Más Popular
              </div>
            )}
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {yearlyBilling 
                  ? `$${Math.round(plan.price * 10)}` 
                  : `$${plan.price}`}
              </span>
              <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">
                {plan.billingPeriod}
              </span>
            </div>
            
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
            
            <ul className="mt-6 space-y-4">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <div className="flex-shrink-0">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {feature.title}
                  </p>
                </li>
              ))}
            </ul>
            
            <button
              className={`mt-8 flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium ${
                plan.isPopular
                  ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-600'
                  : 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50'
              }`}
            >
              {plan.buttonText}
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPlans;
