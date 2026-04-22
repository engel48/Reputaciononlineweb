"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Radio, Users, Hash } from 'lucide-react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import AudienceIntelligence from '@/components/social-listening/AudienceIntelligence';
import MediaMonitoring from '@/components/social-listening/MediaMonitoring';
import { SocialListeningCard } from '@/components/dashboard/SocialListeningCard';
import { useUser } from '@/context/UserContext';
import { EmptyMentionsState } from '@/components/ui/EmptyMentionsState';
import { useHasMentionsData } from '@/hooks/useHasMentionsData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function MonitoreoPage() {
  const { user } = useUser();
  const { loading: hasDataLoading, hasAnyData } = useHasMentionsData();

  const userProfile = {
    type: user?.profileType || 'business',
    specialization: 'general',
    region: 'Colombia'
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
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 bg-white/20 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}>
                <Activity className="h-7 w-7 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Centro de Monitoreo
              </h1>
              <p className="text-white/70 text-sm">
                Monitorea tu reputacion en redes sociales, hashtags y medios en tiempo real
              </p>
            </div>
          </div>
        </motion.div>

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
        <motion.section
          className="mb-8"
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Radio className="h-5 w-5 text-[#00E5FF]" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Social Listening
            </h2>
          </div>
          <SocialListeningCard />
        </motion.section>

        {/* Grid: Hashtags + Audience Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Hash className="h-5 w-5 text-[#00E5FF]" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Monitoreo de Hashtags
              </h2>
            </div>
            <HashtagMonitoring />
          </motion.section>

          <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#00E5FF]" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Analisis de Audiencia
              </h2>
            </div>
            <AudienceIntelligence userProfile={userProfile} />
          </motion.section>
        </div>

        {/* Media Monitoring - Full Width */}
        <motion.section variants={itemVariants} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
          <MediaMonitoring userProfile={userProfile} />
        </motion.section>
      </div>
    </motion.div>
  );
}
