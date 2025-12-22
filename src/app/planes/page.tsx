"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  ArrowRight,
  Star,
  Users,
  Shield,
  Zap,
  Globe,
  HeadphonesIcon,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export default function PlanesPage() {
  const planes = [
    {
      name: "Básico",
      price: "29",
      period: "mes",
      description: "Ideal para personas y pequeños negocios",
      popular: false,
      features: [
        "Hasta 1,000 menciones/mes",
        "3 plataformas sociales",
        "Análisis de sentimientos básico",
        "Reportes semanales",
        "Soporte por email",
        "Dashboard básico",
        "Alertas por email"
      ],
      cta: "Comenzar Gratis",
      href: "/register?plan=basic"
    },
    {
      name: "Profesional",
      price: "99",
      period: "mes",
      description: "Para empresas en crecimiento",
      popular: true,
      features: [
        "Hasta 10,000 menciones/mes",
        "Todas las plataformas",
        "IA avanzada + análisis competitivo",
        "Reportes diarios + alertas en tiempo real",
        "Soporte prioritario 24/7",
        "Dashboard político incluido",
        "API access básico",
        "Exportación de datos",
        "Análisis de influencers"
      ],
      cta: "Comenzar Prueba Gratis",
      href: "/register?plan=pro"
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Para grandes organizaciones",
      popular: false,
      features: [
        "Menciones ilimitadas",
        "Integración API completa",
        "IA personalizada + modelos custom",
        "Reportes en tiempo real + white label",
        "Account manager dedicado",
        "SLA garantizado 99.9%",
        "Integración SSO",
        "Capacitación personalizada",
        "Consultoría estratégica"
      ],
      cta: "Contactar Ventas",
      href: "/contacto"
    }
  ];

  const faqs = [
    {
      question: "¿Puedo cambiar de plan en cualquier momento?",
      answer: "Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard. Los cambios se aplican inmediatamente y se prorratea la facturación."
    },
    {
      question: "¿Ofrecen una prueba gratuita?",
      answer: "Sí, ofrecemos una prueba gratuita de 14 días para todos los planes sin necesidad de tarjeta de crédito."
    },
    {
      question: "¿Qué plataformas sociales monitorean?",
      answer: "Monitoreamos X (Twitter), Facebook, Instagram, YouTube y más de 100 sitios de noticias y blogs."
    },
    {
      question: "¿Cómo funciona el análisis de sentimientos?",
      answer: "Utilizamos IA avanzada con modelos de lenguaje natural que analizan el contexto, sarcasmo y emociones con 95% de precisión."
    },
    {
      question: "¿Incluyen soporte técnico?",
      answer: "Todos los planes incluyen soporte técnico. El plan Profesional tiene soporte prioritario 24/7 y Enterprise incluye un account manager dedicado."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#01257D] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Inicio
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src="/reputacion-online-logo.png" 
                alt="Reputación Online" 
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Planes y Precios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-[#01257D] font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link 
                href="/register"
                className="bg-[#01257D] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#013AAA] transition-colors"
              >
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Planes que se <span className="text-[#01257D]">Adaptan a Ti</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Desde startups hasta grandes corporaciones, tenemos el plan perfecto para tu reputación digital
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center items-center space-x-4 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              14 días gratis
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Cancela cuando quieras
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {planes.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-[#01257D] to-blue-600 text-white transform scale-105'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {plan.name}
                  </h3>
                  <p className={`mb-6 ${
                    plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {plan.description}
                  </p>
                  <div className={`mb-2 ${
                    plan.popular ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>
                    {plan.price === 'Personalizado' ? (
                      <div className="text-3xl font-bold">Personalizado</div>
                    ) : (
                      <div className="text-4xl font-bold">
                        ${plan.price}
                        <span className={`text-lg ${
                          plan.popular ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          /{plan.period}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm ${
                    plan.popular ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {plan.price !== 'Personalizado' ? 'Facturación mensual' : 'Contactar para precio'}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className={`flex items-center ${
                      plan.popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${
                        plan.popular ? 'text-yellow-300' : 'text-green-500'
                      }`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-center block transition-colors ${
                    plan.popular
                      ? 'bg-white text-[#01257D] hover:bg-gray-100'
                      : 'bg-[#01257D] text-white hover:bg-[#013AAA] dark:bg-[#01257D] dark:hover:bg-[#013AAA]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Security and Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              🔒 Todos los planes incluyen encriptación de datos y cumplimiento GDPR
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Seguridad SSL</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">GDPR Compliant</span>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">99.9% Uptime</span>
              </div>
              <div className="flex flex-col items-center">
                <HeadphonesIcon className="w-8 h-8 text-orange-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Soporte 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Comparación Detallada
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Encuentra el plan perfecto para tus necesidades
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-200 dark:border-gray-600 p-4 text-left text-gray-900 dark:text-white font-semibold">
                    Características
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 p-4 text-center text-gray-900 dark:text-white font-semibold">
                    Básico
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 p-4 text-center bg-[#01257D] text-white font-semibold">
                    Profesional
                  </th>
                  <th className="border border-gray-200 dark:border-gray-600 p-4 text-center text-gray-900 dark:text-white font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Menciones/mes', '1,000', '10,000', 'Ilimitadas'],
                  ['Plataformas', '3 principales', 'Todas', 'Todas + custom'],
                  ['IA Analysis', 'Básico', 'Avanzado', 'Personalizado'],
                  ['Reportes', 'Semanales', 'Diarios', 'Tiempo real'],
                  ['API Access', '✗', 'Básico', 'Completo'],
                  ['Soporte', 'Email', '24/7 Prioritario', 'Account Manager'],
                  ['SLA', '✗', '99%', '99.9%']
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="border border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-900 dark:text-white">
                      {row[0]}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 text-center text-gray-700 dark:text-gray-300">
                      {row[1]}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 text-center bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-medium">
                      {row[2]}
                    </td>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 text-center text-gray-700 dark:text-gray-300">
                      {row[3]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Todo lo que necesitas saber sobre nuestros planes
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-[#01257D] to-blue-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para Transformar tu Reputación Digital?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Únete a más de 1,200 empresas que ya confían en nuestra tecnología
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register"
                className="group bg-white text-[#01257D] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                🚀 Comenzar Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="group border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Ver Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}