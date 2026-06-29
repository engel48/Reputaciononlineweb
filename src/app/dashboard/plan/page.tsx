"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, Check, ArrowRight, Shield, Crown } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import { PLAN_FEATURE_CATALOG } from '@/lib/plan-features-catalog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatCOP(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(precio);
}

/** Etiquetas de los módulos incluidos en un plan, según su JSONB features. */
function planModules(features: Record<string, boolean> | undefined): string[] {
  if (!features) return [];
  return PLAN_FEATURE_CATALOG.filter((f) => features[f.key]).map((f) => f.label);
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PlanPage() {
  const { user } = useUser();
  const { plans, currentPlan, loading } = usePlan();
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  const ordered = [...plans].sort((a, b) => a.displayOrder - b.displayOrder);
  const actual = ordered.find((p) => p.code === currentPlan) || null;

  const cambiarPlan = (code: string) => {
    setCargando(true);
    router.push(`/dashboard/pago?plan=${code}`);
  };

  return (
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mi Plan Actual</h1>
            <p className="text-white/70 text-sm">
              Gestiona tu suscripción y descubre qué módulos incluye cada plan
            </p>
          </div>
        </div>
      </motion.div>

      {loading && plans.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#01257D]" />
        </div>
      )}

      {/* Plan actual */}
      {actual && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-[#01257D] bg-gradient-to-r from-[#01257D]/5 to-blue-50 dark:from-[#01257D]/10 dark:to-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-[#01257D] dark:text-white">{actual.name}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Plan actual activo</CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Check className="h-4 w-4 mr-1" />
                  Activo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#01257D] dark:text-white">{formatCOP(actual.priceCop)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">por mes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#01257D] dark:text-white">
                    {actual.monthlyCredits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">créditos/mes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{user?.credits?.toLocaleString() || '0'}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">créditos disponibles</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Planes disponibles */}
      {ordered.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Planes Disponibles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ordered.map((plan) => {
              const esActual = plan.code === currentPlan;
              const modules = planModules(plan.features);
              return (
                <motion.div key={plan.code} variants={itemVariants}>
                  <Card
                    className={`relative h-full flex flex-col ${
                      plan.isPopular ? 'border-2 border-[#01257D] shadow-lg' : 'border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-[#01257D] text-white border-[#01257D] px-4 py-1">
                          <Star className="h-4 w-4 mr-1" />
                          Más Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl text-gray-900 dark:text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">{plan.description}</CardDescription>
                      <div className="mt-4">
                        <div className="text-4xl font-bold text-[#01257D] dark:text-white">{formatCOP(plan.priceCop)}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">por mes</div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-[#01257D] dark:text-white">
                            {plan.monthlyCredits.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">créditos incluidos</div>
                        </div>
                        <ul className="space-y-2">
                          <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {plan.maxSocialAccounts <= 1
                              ? '1 cuenta social'
                              : (plan.maxAccountsPerPlatform ?? 1) > 1
                              ? `Hasta ${plan.maxAccountsPerPlatform} cuentas por red social (${plan.maxSocialAccounts} en total)`
                              : `1 cuenta por cada red social (hasta ${plan.maxSocialAccounts})`}
                          </li>
                          {modules.length > 0 ? (
                            modules.map((label) => (
                              <li key={label} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                {label}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-gray-400 italic">Sin módulos adicionales</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={`w-full ${
                          esActual ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#01257D] hover:bg-[#013AAA]'
                        } text-white`}
                        onClick={() => cambiarPlan(plan.code)}
                        disabled={cargando || esActual}
                      >
                        {esActual ? (
                          'Plan Actual'
                        ) : (
                          <>
                            Cambiar a este plan
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Ayuda */}
      <motion.div variants={itemVariants}>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">¿Necesitas ayuda para elegir?</h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Nuestro equipo puede ayudarte a encontrar el plan perfecto para tus necesidades. Contáctanos para una
                  consulta personalizada gratuita.
                </p>
                <Button
                  variant="outline"
                  className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
                >
                  Contactar Soporte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
