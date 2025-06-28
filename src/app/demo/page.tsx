"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3,
  Globe,
  Target,
  Zap,
  Activity,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export default function DemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [animatedStats, setAnimatedStats] = useState({
    mentions: 0,
    sentiment: 0,
    reach: 0,
    engagement: 0
  });

  const demoSteps = [
    {
      title: "Monitoreo en Tiempo Real",
      description: "Ve cómo capturamos menciones de todas las plataformas sociales instantáneamente",
      highlight: "mentions"
    },
    {
      title: "Análisis de Sentimientos con IA",
      description: "Nuestra IA avanzada analiza el sentimiento de cada mención con 95% de precisión",
      highlight: "sentiment"
    },
    {
      title: "Alcance y Viralidad",
      description: "Mide el impacto real de tu presencia digital y detecta contenido viral",
      highlight: "reach"
    },
    {
      title: "Engagement Inteligente",
      description: "Identifica oportunidades de interacción y mejora tu estrategia de contenido",
      highlight: "engagement"
    }
  ];

  const targetStats = {
    mentions: 2847,
    sentiment: 89,
    reach: 2800000,
    engagement: 94.2
  };

  // Auto-play demo
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Animate stats
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats(current => ({
        mentions: Math.min(current.mentions + (targetStats.mentions / steps), targetStats.mentions),
        sentiment: Math.min(current.sentiment + (targetStats.sentiment / steps), targetStats.sentiment),
        reach: Math.min(current.reach + (targetStats.reach / steps), targetStats.reach),
        engagement: Math.min(current.engagement + (targetStats.engagement / steps), targetStats.engagement)
      }));
    }, interval);

    const cleanup = setTimeout(() => {
      clearInterval(timer);
      setAnimatedStats(targetStats);
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(cleanup);
    };
  }, [currentStep]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.floor(num).toString();
  };

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
                Demo Interactivo
              </h1>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Demo Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Controls */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Descubre el Poder de <span className="text-[#01257D]">Reputación Online</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-6"
          >
            Demo interactivo de nuestro dashboard de análisis de reputación digital
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center space-x-4 mb-8"
          >
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-[#01257D] hover:bg-[#013AAA] text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  Pausar Demo
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Reproducir Demo
                </>
              )}
            </button>
            <button
              onClick={() => {
                setCurrentStep(0);
                setIsPlaying(true);
              }}
              className="flex items-center px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reiniciar
            </button>
          </motion.div>
        </div>

        {/* Demo Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mb-8"
        >
          {/* Dashboard Header */}
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Dashboard Demo - {demoSteps[currentStep].title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {demoSteps[currentStep].description}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-500 font-semibold text-sm">EN VIVO</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              animate={{ 
                scale: demoSteps[currentStep].highlight === 'mentions' ? 1.05 : 1,
                borderColor: demoSteps[currentStep].highlight === 'mentions' ? '#01257D' : 'transparent'
              }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border-2"
            >
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <span className="text-green-500 text-sm font-semibold">+12%</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {formatNumber(animatedStats.mentions)}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Menciones Hoy
              </div>
            </motion.div>

            <motion.div
              animate={{ 
                scale: demoSteps[currentStep].highlight === 'sentiment' ? 1.05 : 1,
                borderColor: demoSteps[currentStep].highlight === 'sentiment' ? '#01257D' : 'transparent'
              }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border-2"
            >
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="w-8 h-8 text-green-500" />
                <span className="text-green-500 text-sm font-semibold">{Math.floor(animatedStats.sentiment)}%</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                Positivo
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Sentimiento General
              </div>
            </motion.div>

            <motion.div
              animate={{ 
                scale: demoSteps[currentStep].highlight === 'reach' ? 1.05 : 1,
                borderColor: demoSteps[currentStep].highlight === 'reach' ? '#01257D' : 'transparent'
              }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border-2"
            >
              <div className="flex items-center justify-between mb-4">
                <Globe className="w-8 h-8 text-purple-500" />
                <span className="text-green-500 text-sm font-semibold">+8%</span>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {formatNumber(animatedStats.reach)}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Alcance Total
              </div>
            </motion.div>

            <motion.div
              animate={{ 
                scale: demoSteps[currentStep].highlight === 'engagement' ? 1.05 : 1,
                borderColor: demoSteps[currentStep].highlight === 'engagement' ? '#01257D' : 'transparent'
              }}
              className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 border-2"
            >
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-orange-500" />
                <span className="text-green-500 text-sm font-semibold">🔥</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {animatedStats.engagement.toFixed(1)}%
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Engagement Rate
              </div>
            </motion.div>
          </div>

          {/* Demo Mentions Feed */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Menciones en Tiempo Real
            </h3>
            <div className="space-y-4">
              {[
                { platform: 'X', user: '@usuario_ejemplo', message: '¡Excelente servicio! La plataforma es increíble 🚀', sentiment: 'positive' },
                { platform: 'Instagram', user: '@influencer_digital', message: 'Recomiendo totalmente esta herramienta ⭐', sentiment: 'positive' },
                { platform: 'Facebook', user: 'María González', message: 'Interface muy intuitiva y fácil de usar', sentiment: 'positive' }
              ].map((mention, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-start space-x-4 p-4 bg-white dark:bg-gray-600 rounded-lg"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    mention.platform === 'X' ? 'bg-blue-500' :
                    mention.platform === 'Instagram' ? 'bg-pink-500' : 'bg-blue-600'
                  }`}>
                    {mention.platform === 'X' ? 'X' : mention.platform === 'Instagram' ? 'IG' : 'FB'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{mention.user}</span>
                      <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                        Positivo
                      </span>
                      <span className="text-gray-400 text-xs">hace {index + 1} min</span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{mention.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Demo Steps Indicator */}
        <div className="flex justify-center space-x-2 mb-8">
          {demoSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep ? 'bg-[#01257D] w-8' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center bg-gradient-to-r from-[#01257D] to-blue-600 rounded-2xl p-8 text-white"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Listo para Transformar tu Reputación Digital?
          </h2>
          <p className="text-lg mb-6 text-blue-100">
            Únete a más de 1,200 empresas que ya confían en nuestra plataforma
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group bg-white text-[#01257D] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center"
            >
              🚀 Comenzar Gratis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center justify-center"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <div className="flex justify-center space-x-6 mt-6 text-sm text-blue-100">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Setup en 5 minutos
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Soporte 24/7
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}