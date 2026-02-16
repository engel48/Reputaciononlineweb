"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import SocialNetworkConnectorFixed from '@/components/user/SocialNetworkConnectorFixed';
import { useUser } from '@/context/UserContext';
import { Radio, BarChart3, Zap, FileText, Share2 } from 'lucide-react';

interface SocialConnection {
  connected: boolean;
  username: string;
  displayName: string;
  followers: number;
  profileImage: string;
  lastSync: string | null;
  metrics: {
    posts: number;
    engagement: number;
    reach: number;
  };
}

interface SocialConnectionsState {
  facebook: SocialConnection;
  instagram: SocialConnection;
  x: SocialConnection;
  youtube: SocialConnection;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const benefits = [
  {
    icon: Radio,
    title: 'Monitoreo en tiempo real',
    desc: 'Detecta menciones y comentarios sobre ti o tu marca en tiempo real',
    color: 'text-[#00E5FF]',
    bg: 'bg-[#00E5FF]/10',
    border: 'border-l-[#00E5FF]'
  },
  {
    icon: BarChart3,
    title: 'Analisis de sentimiento',
    desc: 'Comprende la percepcion del publico hacia tu marca o persona',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-l-emerald-500'
  },
  {
    icon: Zap,
    title: 'Respuesta rapida',
    desc: 'Responde a comentarios y gestiona crisis de reputacion rapidamente',
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-l-amber-500'
  },
  {
    icon: FileText,
    title: 'Informes detallados',
    desc: 'Obten reportes completos sobre tu presencia en redes sociales',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-l-indigo-500'
  },
];

export default function RedesSocialesPage() {
  const { user } = useUser();

  const handleSocialConnectionComplete = (networks: SocialConnectionsState) => {
    console.log('Redes sociales conectadas:', networks);
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header con gradiente */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 bg-white/20 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
              >
                <Share2 className="h-7 w-7 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Redes Sociales
              </h1>
              <p className="text-white/70 text-sm">
                Conecta y gestiona tus cuentas de redes sociales para monitorear tu reputacion online
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info del usuario - rediseñado */}
        {user && (
          <motion.div variants={itemVariants} className="mb-6">
            <motion.div
              whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-[#01257D] to-indigo-600 rounded-xl shadow-lg">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Estado de tu cuenta</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Usuario: <span className="font-medium text-gray-700 dark:text-gray-300">{user.name}</span> &bull; Plan: <span className="font-medium text-[#01257D] dark:text-blue-400">{user.plan.toUpperCase()}</span>
                    </p>
                  </div>
                </div>
                {user.socialMedia && user.socialMedia.length > 0 && (
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="h-2.5 w-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {user.socialMedia.filter((sm: any) => sm.connected).length} redes conectadas
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Connector - rediseñado */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/10 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Conectar Redes Sociales</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Conecta tus cuentas de redes sociales para comenzar a monitorear menciones,
                analizar sentimiento y gestionar tu reputacion online de manera integral.
              </p>
            </div>
            <div className="p-6">
              <SocialNetworkConnectorFixed
                onComplete={handleSocialConnectionComplete}
                allowSkip={false}
                isOnboarding={false}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Beneficios - rediseñado como cards independientes */}
        <motion.div variants={itemVariants} className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Zap className="h-5 w-5 text-[#00E5FF] mr-2" />
            Por que conectar redes sociales?
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }}
                className={`relative overflow-hidden p-5 rounded-xl ${benefit.bg} border border-gray-200 dark:border-gray-700 transition-all cursor-default`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-600`}>
                    <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{benefit.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{benefit.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
