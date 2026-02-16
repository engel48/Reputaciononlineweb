"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, TrendingUp, MessageCircle, PieChart, Plus, Megaphone, CalendarDays, FileText, Target } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';

interface CampanaStats {
  seguidores: number;
  interacciones: number;
  menciones: number;
  sentimientoPositivo: number;
}

interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  ubicacion: string;
  asistentes: number;
}

interface PropuestaPolitica {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  aprobacion: number;
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function CampanaPage() {
  const { user } = useUser();
  const [stats, setStats] = useState<CampanaStats>({
    seguidores: 0,
    interacciones: 0,
    menciones: 0,
    sentimientoPositivo: 0
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [propuestas, setPropuestas] = useState<PropuestaPolitica[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar que el usuario tenga perfil politico
    if (user && user.profileType !== 'political') {
      window.location.href = '/dashboard';
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Cargar estadisticas reales desde la API
        const response = await fetch('/api/dashboard-analytics');
        if (response.ok) {
          const data = await response.json();
          if (data.stats) {
            setStats({
              seguidores: data.stats.followers || 0,
              interacciones: data.stats.interactions || 0,
              menciones: data.stats.mentions || 0,
              sentimientoPositivo: data.stats.positiveSentiment || 0
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de campana:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const statCards = [
    { label: 'Seguidores', value: stats.seguidores, icon: Users, color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Interacciones', value: stats.interacciones, icon: MessageCircle, color: 'from-green-500 to-green-600', bgLight: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Menciones', value: stats.menciones, icon: Megaphone, color: 'from-amber-500 to-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Sentimiento Positivo', value: stats.sentimientoPositivo, icon: TrendingUp, color: 'from-[#01257D] to-indigo-600', bgLight: 'bg-indigo-50 dark:bg-indigo-900/20', suffix: '%' },
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header con gradiente */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-3 bg-white/20 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Target className="h-7 w-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">Gestion de Campana</h1>
                <p className="text-white/70 text-sm">
                  Administra todos los aspectos de tu campana politica
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/campana/reporte"
              className="inline-flex items-center rounded-xl bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              <PieChart className="mr-2 h-4 w-4" />
              Generar Reporte
            </Link>
          </div>
        </motion.div>

        {/* Estadisticas */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="animate-pulse">
                  <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </motion.div>
            ))
          ) : (
            statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value > 0 ? stat.value.toLocaleString() : '0'}{stat.suffix || ''}
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {stats.seguidores === 0 && stats.menciones === 0 && !isLoading && (
          <motion.div
            variants={itemVariants}
            className="mb-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 text-center"
          >
            <Megaphone className="h-10 w-10 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Sin datos de campana todavia
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Conecta tus redes sociales para ver estadisticas de tu campana en tiempo real.
            </p>
          </motion.div>
        )}

        {/* Eventos politicos */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="mb-8 rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#01257D]" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Proximos Eventos</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center rounded-lg bg-[#01257D]/10 px-3 py-1.5 text-sm font-medium text-[#01257D] hover:bg-[#01257D]/20 transition-colors"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nuevo evento
            </motion.button>
          </div>

          {eventos.length === 0 ? (
            <div className="text-center py-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay eventos programados</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crea tu primer evento de campana</p>
              </motion.div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Evento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ubicacion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Asistentes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {eventos.map(evento => (
                    <tr key={evento.id}>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">{evento.titulo}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(evento.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{evento.ubicacion}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{evento.asistentes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Propuestas politicas */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#01257D]" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Propuestas Politicas</h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center rounded-lg bg-[#01257D]/10 px-3 py-1.5 text-sm font-medium text-[#01257D] hover:bg-[#01257D]/20 transition-colors"
            >
              <Plus className="mr-1 h-4 w-4" />
              Nueva propuesta
            </motion.button>
          </div>

          {propuestas.length === 0 ? (
            <div className="text-center py-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No hay propuestas registradas</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Registra tu primera propuesta politica</p>
              </motion.div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {propuestas.map(propuesta => (
                <motion.div
                  key={propuesta.id}
                  whileHover={{ y: -3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                >
                  <span className="inline-block rounded-full bg-[#01257D]/10 px-2.5 py-0.5 text-xs font-medium text-[#01257D] mb-2">
                    {propuesta.categoria}
                  </span>
                  <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-white">{propuesta.titulo}</h3>
                  <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{propuesta.descripcion}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Aprobacion</span>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">{propuesta.aprobacion}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-[#01257D] to-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${propuesta.aprobacion}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
