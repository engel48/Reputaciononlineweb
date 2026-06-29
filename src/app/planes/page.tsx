"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Shield,
  Globe,
  HeadphonesIcon,
} from 'lucide-react';

interface PublicPlan {
  code: string;
  name: string;
  description: string;
  priceCop: number;
  monthlyCredits: number;
  maxSocialAccounts: number;
  multiAccountPerPlatform: boolean;
  maxAccountsPerPlatform: number;
  features: Record<string, boolean>;
  isPopular: boolean;
  displayOrder: number;
}

const FEATURE_LABELS: Array<{ key: string; label: string }> = [
  { key: 'sentimentAnalysis', label: 'Analisis de sentimiento con IA' },
  { key: 'realTimeMonitoring', label: 'Monitoreo en tiempo real' },
  { key: 'advancedAnalytics', label: 'Analiticas avanzadas' },
  { key: 'competitorAnalysis', label: 'Analisis de competencia' },
  { key: 'crisisManagement', label: 'Gestion de crisis reputacional' },
  { key: 'influencerIdentification', label: 'Identificacion de influencers' },
  { key: 'predictiveAnalytics', label: 'Analiticas predictivas' },
  { key: 'customReports', label: 'Reportes personalizados' },
  { key: 'automatedReporting', label: 'Reportes automatizados' },
  { key: 'apiAccess', label: 'Acceso a API' },
  { key: 'dataExport', label: 'Exportacion de datos' },
  { key: 'customDashboards', label: 'Dashboards personalizados' },
  { key: 'integrations', label: 'Integraciones con terceros' },
  { key: 'teamCollaboration', label: 'Colaboracion en equipo' },
  { key: 'mediaCoverage', label: 'Cobertura de medios colombianos' },
  { key: 'multiLanguageSupport', label: 'Soporte multi-idioma' },
  { key: 'whiteLabeling', label: 'White-labeling' },
  { key: 'prioritySupport', label: 'Soporte prioritario' },
  { key: 'dedicatedManager', label: 'Account manager dedicado' },
];

function formatCOP(value: number): string {
  if (value === 0) return 'Gratis';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildFeatureList(plan: PublicPlan): string[] {
  const lines: string[] = [];

  // Limites cuantitativos primero
  lines.push(`${plan.monthlyCredits.toLocaleString('es-CO')} creditos al mes`);
  if (plan.maxSocialAccounts > 0) {
    const total = plan.maxSocialAccounts;
    const perRed = plan.maxAccountsPerPlatform ?? 1;
    const accLine =
      total <= 1
        ? '1 cuenta social'
        : perRed > 1
        ? `Hasta ${perRed} cuentas por red social (${total} en total)`
        : `1 cuenta por cada red social (hasta ${total})`;
    lines.push(accLine);
  }

  // Features booleanas habilitadas
  for (const { key, label } of FEATURE_LABELS) {
    if (plan.features[key]) lines.push(label);
  }

  return lines;
}

export default function PlanesPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setPlans(data.plans || []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Error cargando planes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Para la tabla de comparacion, todos los keys de features que aparecen en algun plan
  const featureKeysInUse = Array.from(
    new Set(plans.flatMap((p) => Object.keys(p.features).filter((k) => p.features[k])))
  );
  const comparisonRows = FEATURE_LABELS.filter((f) => featureKeysInUse.includes(f.key));

  const faqs = [
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Si, puedes actualizar o degradar tu plan en cualquier momento desde tu dashboard. Los cambios se aplican inmediatamente.',
    },
    {
      question: '¿Como funcionan los creditos?',
      answer: 'Cada accion en la plataforma (analisis de sentimiento, busqueda de personas, conversaciones con la IA Julia) consume creditos. El balance se renueva automaticamente al maximo del plan el primer dia de cada mes.',
    },
    {
      question: '¿Que plataformas sociales monitorean?',
      answer: 'Monitoreamos Facebook, X (Twitter), Instagram y YouTube. Ademas hacemos scraping de los principales medios digitales colombianos: El Tiempo, El Espectador, Semana, La FM, Caracol, RCN y otros.',
    },
    {
      question: '¿Como funciona el analisis de sentimiento?',
      answer: 'Utilizamos modelos de IA (Llama 3.3 via Groq, con DeepSeek y OpenAI como fallback) para clasificar cada mencion como positiva, negativa o neutra y calcular un score de reputacion agregado por plataforma.',
    },
    {
      question: '¿Que metodos de pago aceptan?',
      answer: 'Procesamos pagos via Wompi Colombia: tarjeta credito/debito, PSE, Nequi, Daviplata y transferencia bancaria.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-[#01257D] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al Inicio
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Planes y Precios
            </h1>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-[#01257D] font-medium">
                Iniciar Sesion
              </Link>
              <Link href="/register" className="bg-[#01257D] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#013AAA] transition-colors">
                Comenzar Gratis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
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
            Desde personas y emprendedores hasta grandes organizaciones, tenemos el plan perfecto para tu reputacion digital en Colombia.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400"
          >
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Plan Free disponible
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Pago con Wompi Colombia
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
          {loading ? (
            <p className="text-center text-gray-600 dark:text-gray-400">Cargando planes...</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : plans.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400">No hay planes disponibles en este momento.</p>
          ) : (
            <div className={`grid gap-8 max-w-6xl mx-auto ${plans.length === 1 ? 'grid-cols-1' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' : plans.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
              {plans.map((plan, index) => {
                const featuresList = buildFeatureList(plan);
                const popular = plan.isPopular;
                const isFree = plan.priceCop === 0;
                const cta = isFree
                  ? { label: 'Comenzar Gratis', href: `/register?plan=${plan.code}` }
                  : { label: 'Suscribirme', href: `/register?plan=${plan.code}` };

                return (
                  <motion.div
                    key={plan.code}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`relative rounded-2xl p-8 ${
                      popular
                        ? 'bg-gradient-to-br from-[#01257D] to-blue-600 text-white transform md:scale-105'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold flex items-center">
                          <Star className="w-4 h-4 mr-1" />
                          Mas Popular
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      <h3 className={`text-2xl font-bold mb-2 ${popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {plan.name}
                      </h3>
                      <p className={`mb-6 min-h-[3rem] ${popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'}`}>
                        {plan.description}
                      </p>
                      <div className={popular ? 'text-white' : 'text-gray-900 dark:text-white'}>
                        <div className="text-4xl font-bold">
                          {formatCOP(plan.priceCop)}
                        </div>
                        <p className={`text-sm mt-1 ${popular ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                          {isFree ? 'Sin costo' : 'Facturacion mensual'}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {featuresList.map((feature, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start text-sm ${popular ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          <CheckCircle
                            className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${popular ? 'text-yellow-300' : 'text-green-500'}`}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={cta.href}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-center block transition-colors ${
                        popular
                          ? 'bg-white text-[#01257D] hover:bg-gray-100'
                          : 'bg-[#01257D] text-white hover:bg-[#013AAA]'
                      }`}
                    >
                      {cta.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-16"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Todos los planes incluyen encriptacion en transito y en reposo via Supabase.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-green-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">HTTPS / SSL</span>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">RLS por usuario</span>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 text-purple-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Servidores en LatAm</span>
              </div>
              <div className="flex flex-col items-center">
                <HeadphonesIcon className="w-8 h-8 text-orange-500 mb-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Soporte por email</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      {!loading && plans.length > 0 && (
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Comparacion Detallada
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
                      Caracteristica
                    </th>
                    {plans.map((p) => (
                      <th
                        key={p.code}
                        className={`border border-gray-200 dark:border-gray-600 p-4 text-center font-semibold ${
                          p.isPopular ? 'bg-[#01257D] text-white' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-900 dark:text-white">Precio mensual</td>
                    {plans.map((p) => (
                      <td key={p.code} className={`border border-gray-200 dark:border-gray-600 p-4 text-center font-semibold ${p.isPopular ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {formatCOP(p.priceCop)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-900 dark:text-white">Creditos / mes</td>
                    {plans.map((p) => (
                      <td key={p.code} className={`border border-gray-200 dark:border-gray-600 p-4 text-center ${p.isPopular ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {p.monthlyCredits.toLocaleString('es-CO')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-900 dark:text-white">Cuentas sociales</td>
                    {plans.map((p) => (
                      <td key={p.code} className={`border border-gray-200 dark:border-gray-600 p-4 text-center ${p.isPopular ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {(p.maxAccountsPerPlatform ?? 1) > 1 ? `${p.maxAccountsPerPlatform} por red` : '1 por red'}
                        <span className="block text-xs text-gray-500 dark:text-gray-400">{p.maxSocialAccounts} en total</span>
                      </td>
                    ))}
                  </tr>
                  {comparisonRows.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-200 dark:border-gray-600 p-4 font-medium text-gray-900 dark:text-white">
                        {row.label}
                      </td>
                      {plans.map((p) => (
                        <td
                          key={p.code}
                          className={`border border-gray-200 dark:border-gray-600 p-4 text-center ${
                            p.isPopular
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white font-medium'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {p.features[row.key] ? (
                            <CheckCircle className="w-5 h-5 mx-auto text-green-500" />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
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
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Empieza a gestionar tu reputacion digital hoy
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Crea tu cuenta y prueba la plataforma con el plan Free.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/register"
                className="group bg-white text-[#01257D] px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/contacto"
                className="group border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                Hablar con Ventas
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
