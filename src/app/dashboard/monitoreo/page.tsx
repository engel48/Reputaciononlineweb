"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Radio, Users, Hash } from 'lucide-react';
import HashtagMonitoring from '@/components/hashtags/HashtagMonitoring';
import AudienceIntelligence from '@/components/social-listening/AudienceIntelligence';
import MediaMonitoring from '@/components/social-listening/MediaMonitoring';
import { SocialListeningCard } from '@/components/dashboard/SocialListeningCard';
import { useUser } from '@/context/UserContext';

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
        {/* Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="p-2 bg-gradient-to-br from-[#00E5FF] to-[#00B8D4] rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Activity className="h-6 w-6 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Centro de Monitoreo
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Monitorea tu reputacion en redes sociales, hashtags y medios en tiempo real
          </p>
        </motion.div>

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
