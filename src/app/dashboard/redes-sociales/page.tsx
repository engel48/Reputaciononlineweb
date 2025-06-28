"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import SocialNetworkConnectorFixed from '@/components/user/SocialNetworkConnectorFixed';
import { useUser } from '@/context/UserContext';

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
  linkedin: SocialConnection;
  tiktok: SocialConnection;
}

export default function RedesSocialesPage() {
  const { user } = useUser();

  const handleSocialConnectionComplete = (networks: SocialConnectionsState) => {
    console.log('Redes sociales conectadas:', networks);
    // Aquí podrías mostrar una notificación de éxito o realizar otras acciones
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            Redes Sociales
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Conecta y gestiona tus cuentas de redes sociales para monitorear tu reputación online
          </p>
        </motion.div>

        {/* Información del usuario */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de tu cuenta</CardTitle>
                <CardDescription>
                  Usuario: {user.name} • Plan: {user.plan.toUpperCase()}
                  {user.socialMedia && user.socialMedia.length > 0 && (
                    <span className="ml-2 text-green-600">
                      • {user.socialMedia.filter(sm => sm.connected).length} redes conectadas
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        )}

        {/* Connector de redes sociales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Conectar Redes Sociales</CardTitle>
              <CardDescription>
                Conecta tus cuentas de redes sociales para comenzar a monitorear menciones, 
                analizar sentimiento y gestionar tu reputación online de manera integral.
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

        {/* Información adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Por qué conectar redes sociales?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#01257D] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Monitoreo en tiempo real</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detecta menciones y comentarios sobre ti o tu marca en tiempo real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#01257D] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Análisis de sentimiento</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Comprende la percepción del público hacia tu marca o persona
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#01257D] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Respuesta rápida</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Responde a comentarios y gestiona crisis de reputación rápidamente
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-[#01257D] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Informes detallados</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Obtén reportes completos sobre tu presencia en redes sociales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
