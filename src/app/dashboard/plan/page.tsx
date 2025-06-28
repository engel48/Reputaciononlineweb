"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { CreditCard, Calendar, Star, Check, ArrowRight, Zap, Users, BarChart3, Shield, Crown } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  creditos: number;
  duracion: number;
  caracteristicas: string[];
  popular?: boolean;
  color: string;
  icono: any;
}

export default function PlanPage() {
  const { user } = useUser();
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [planActual, setPlanActual] = useState<Plan | null>(null);

  // Planes disponibles
  const planesDisponibles: Plan[] = [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      descripcion: 'Ideal para pequeñas empresas o profesionales independientes',
      precio: 99000,
      creditos: 1000,
      duracion: 30,
      caracteristicas: [
        'Hasta 5 redes sociales',
        'Análisis básico de sentimiento',
        'Reportes mensuales',
        'Soporte por email'
      ],
      color: 'bg-gray-500',
      icono: Users
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      descripcion: 'Perfecto para empresas medianas que necesitan mayor análisis',
      precio: 249000,
      creditos: 3000,
      duracion: 30,
      caracteristicas: [
        'Hasta 15 redes sociales',
        'Análisis avanzado de sentimiento',
        'Reportes semanales',
        'Alertas en tiempo real',
        'Soporte prioritario'
      ],
      popular: true,
      color: 'bg-[#01257D]',
      icono: BarChart3
    },
    {
      id: 'empresarial',
      nombre: 'Plan Empresarial',
      descripcion: 'Solución completa para grandes empresas y figuras públicas',
      precio: 499000,
      creditos: 10000,
      duracion: 30,
      caracteristicas: [
        'Redes sociales ilimitadas',
        'IA avanzada y análisis predictivo',
        'Reportes personalizados',
        'API dedicada',
        'Gestor de cuenta dedicado',
        'Integración con CRM'
      ],
      color: 'bg-gradient-to-r from-yellow-400 to-orange-500',
      icono: Crown
    }
  ];

  useEffect(() => {
    // Mapear plan del usuario a plan local
    if (user) {
      let planLocalId = 'basico';
      if (user.plan === 'basic') planLocalId = 'basico';
      else if (user.plan === 'pro') planLocalId = 'profesional';
      else if (user.plan === 'enterprise') planLocalId = 'empresarial';
      else if (user.plan === 'free') planLocalId = 'basico'; // Plan por defecto para free
      
      const planUsuario = planesDisponibles.find(p => p.id === planLocalId) || planesDisponibles[0];
      setPlanActual(planUsuario);
      console.log('Plan actual del usuario:', user.plan, '-> Plan local:', planLocalId);
    }
  }, [user]);

  const cambiarPlan = async (nuevoPlan: Plan) => {
    setCargando(true);
    
    try {
      // Convertir plan local a formato de pago
      let planId = 'basic';
      if (nuevoPlan.id === 'basico') planId = 'basic';
      else if (nuevoPlan.id === 'profesional') planId = 'pro';
      else if (nuevoPlan.id === 'empresarial') planId = 'enterprise';
      
      console.log('Redirigiendo a página de pago para plan:', planId);
      
      // Redirigir a la página de pago
      router.push(`/dashboard/pago?plan=${planId}`);
      
    } catch (error) {
      console.error('Error al cambiar plan:', error);
    } finally {
      setCargando(false);
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Mi Plan Actual
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Gestiona tu suscripción y descubre planes que se adapten mejor a tus necesidades
        </p>
      </motion.div>

      {/* Plan Actual */}
      {planActual && (
        <motion.div variants={itemVariants}>
          <Card className="border-2 border-[#01257D] bg-gradient-to-r from-[#01257D]/5 to-blue-50 dark:from-[#01257D]/10 dark:to-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${planActual.color} text-white`}>
                    <planActual.icono className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[#01257D] dark:text-white">
                      {planActual.nombre}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Plan actual activo
                    </CardDescription>
                  </div>
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
                  <div className="text-3xl font-bold text-[#01257D] dark:text-white">
                    {formatearPrecio(planActual.precio)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    por {planActual.duracion} días
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#01257D] dark:text-white">
                    {planActual.creditos.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    créditos incluidos
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {user?.credits?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    créditos disponibles
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upgrade Options */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Planes Disponibles
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {planesDisponibles.map((plan) => (
            <motion.div key={plan.id} variants={itemVariants}>
              <Card className={`relative h-full ${plan.popular ? 'border-2 border-[#01257D] shadow-lg' : 'border border-gray-200 dark:border-gray-700'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#01257D] text-white border-[#01257D] px-4 py-1">
                      <Star className="h-4 w-4 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`mx-auto p-4 rounded-full ${plan.color} text-white mb-4 w-fit`}>
                    <plan.icono className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white">
                    {plan.nombre}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {plan.descripcion}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-[#01257D] dark:text-white">
                      {formatearPrecio(plan.precio)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      por {plan.duracion} días
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-[#01257D] dark:text-white">
                        {plan.creditos.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        créditos incluidos
                      </div>
                    </div>
                    
                    <ul className="space-y-2">
                      {plan.caracteristicas.map((caracteristica, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {caracteristica}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className={`w-full ${planActual?.id === plan.id 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#01257D] hover:bg-[#013AAA]'
                    } text-white`}
                    onClick={() => cambiarPlan(plan)}
                    disabled={cargando || planActual?.id === plan.id}
                  >
                    {cargando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : planActual?.id === plan.id ? (
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
          ))}
        </div>
      </motion.div>

      {/* Información adicional */}
      <motion.div variants={itemVariants}>
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ¿Necesitas ayuda para elegir?
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Nuestro equipo de soporte puede ayudarte a encontrar el plan perfecto para tus necesidades. 
                  Contacta con nosotros para una consulta personalizada gratuita.
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
