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

        {/* Info del usuario */}
        {user && (
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de tu cuenta</CardTitle>
                <CardDescription>
                  Usuario: {user.name} &bull; Plan: {user.plan.toUpperCase()}
                  {user.socialMedia && user.socialMedia.length > 0 && (
                    <span className="ml-2 text-green-600">
                      &bull; {user.socialMedia.filter((sm: any) => sm.connected).length} redes conectadas
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        )}

        {/* Connector */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Conectar Redes Sociales</CardTitle>
              <CardDescription>
                Conecta tus cuentas de redes sociales para comenzar a monitorear menciones,
                analizar sentimiento y gestionar tu reputacion online de manera integral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialNetworkConnectorFixed
                onComplete={handleSocialConnectionComplete}
                allowSkip={false}
                isOnboarding={false}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Beneficios mejorados */}
        <motion.div variants={itemVariants} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por que conectar redes sociales?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                    className={`flex items-start space-x-3 p-4 rounded-xl border-l-4 ${benefit.border} bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-shadow`}
                  >
                    <div className={`flex-shrink-0 p-2 rounded-lg ${benefit.bg}`}>
                      <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{benefit.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{benefit.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
