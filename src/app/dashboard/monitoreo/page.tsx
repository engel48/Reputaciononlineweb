"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Radio, Users, Hash, BarChart3 } from 'lucide-react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import AudienceIntelligence from '@/components/social-listening/AudienceIntelligence';
import MediaMonitoring from '@/components/social-listening/MediaMonitoring';
import { SocialListeningCard } from '@/components/dashboard/SocialListeningCard';
import { useUser } from '@/context/UserContext';
import { EmptyMentionsState } from '@/components/ui/EmptyMentionsState';
import { useHasMentionsData } from '@/hooks/useHasMentionsData';
import FeatureGate from '@/components/plan/FeatureGate';
import AnalisisPage from '@/app/dashboard/analisis/page';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type Tab = 'monitoreo' | 'analisis';

export default function MonitoreoPage() {
  const { user } = useUser();
  const { loading: hasDataLoading, hasAnyData } = useHasMentionsData();
  const [tab, setTab] = useState<Tab>('monitoreo');

  const userProfile = {
    type: user?.profileType || 'business',
    specialization: 'general',
    region: 'Colombia',
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con gradiente */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Monitoreo y Análisis</h1>
              <p className="text-white/70 text-sm">
                Monitorea tu reputación en redes, hashtags y medios, y analiza tu reputación con IA — en un solo lugar
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pestañas: Monitoreo | Análisis de reputación */}
        <motion.div variants={itemVariants} className="flex gap-1 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('monitoreo')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'monitoreo'
                ? 'border-[#01257D] text-[#01257D] dark:text-[#00E5FF] dark:border-[#00E5FF]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            Monitoreo
          </button>
          <button
            onClick={() => setTab('analisis')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'analisis'
                ? 'border-[#01257D] text-[#01257D] dark:text-[#00E5FF] dark:border-[#00E5FF]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Análisis de reputación
          </button>
        </motion.div>

        {tab === 'monitoreo' ? (
          <>
            {/* Empty state si no hay datos */}
            {!hasDataLoading && !hasAnyData && (
              <motion.div variants={itemVariants} className="mb-8">
                <EmptyMentionsState
                  title="Tu centro de monitoreo está listo, falta conectar tus redes"
                  description="Una vez conectes Facebook, Instagram, X o YouTube, Julia traerá menciones, sentimiento y métricas automáticamente cada 30 minutos."
                />
              </motion.div>
            )}

            {/* Social Listening Overview */}
            <motion.section className="mb-8" variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-4">
                <Radio className="h-5 w-5 text-[#00E5FF]" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Social Listening</h2>
              </div>
              <SocialListeningCard />
            </motion.section>

            {/* Grid: Hashtags + Audience Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="h-5 w-5 text-[#00E5FF]" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Monitoreo de Hashtags</h2>
                </div>
                <HashtagMonitoring />
              </motion.section>

              <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-[#00E5FF]" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analisis de Audiencia</h2>
                </div>
                <AudienceIntelligence userProfile={userProfile} />
              </motion.section>
            </div>

            {/* Media Monitoring (monitoreo de noticias) - gateado a planes con el módulo */}
            <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <FeatureGate feature="hasMediaCoverage">
                <MediaMonitoring userProfile={userProfile} />
              </FeatureGate>
            </motion.section>
          </>
        ) : (
          <motion.div variants={itemVariants}>
            <AnalisisPage />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
