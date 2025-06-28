"use client";

import React from 'react';
import { motion } from 'framer-motion';
import ConfiguracionNotificaciones from '@/components/creditos/ConfiguracionNotificaciones';
import { Bell, Settings, ChevronRight } from 'lucide-react';

export default function ConfiguracionCreditosPage() {
  // Configuraciu00f3n de animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Tu00edtulo de la pu00e1gina */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuraciu00f3n de Cru00e9ditos</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Personaliza tus preferencias de notificaciones y alertas relacionadas con tus cru00e9ditos.
        </p>
      </motion.div>

      {/* Migas de pan */}
      <motion.div variants={itemVariants} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        <a href="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">Dashboard</a>
        <ChevronRight className="mx-2 h-4 w-4" />
        <a href="/dashboard/creditos" className="hover:text-primary-600 dark:hover:text-primary-400">Cru00e9ditos</a>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-gray-700 dark:text-gray-300">Configuraciu00f3n</span>
      </motion.div>

      {/* Secciu00f3n de configuraciu00f3n de notificaciones */}
      <motion.div variants={itemVariants}>
        <ConfiguracionNotificaciones />
      </motion.div>

      {/* Otras configuraciones */}
      <motion.div variants={itemVariants}>
        <div className="card p-6">
          <div className="mb-6 flex items-center">
            <Settings className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="heading-secondary">Otras Configuraciones</h2>
          </div>

          <div className="space-y-4">
            {/* Renovaciu00f3n automu00e1tica */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Renovaciu00f3n Automu00e1tica</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Renovar automu00e1ticamente mi plan cuando se agoten mis cru00e9ditos
                </p>
              </div>
              <div className="relative inline-block h-6 w-11">
                <input 
                  type="checkbox" 
                  id="renovacionAutomatica" 
                  className="peer sr-only" 
                />
                <label 
                  htmlFor="renovacionAutomatica"
                  className="absolute inset-0 cursor-pointer rounded-full bg-gray-200 transition peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-checked:bg-primary-500"
                >
                  <span className="absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>

            {/* Umbral de alerta personalizado */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Lu00edmite de Gasto Diario</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Establecer un lu00edmite mu00e1ximo de cru00e9ditos a gastar por du00eda
                </p>
              </div>
              <div className="relative inline-block h-6 w-11">
                <input 
                  type="checkbox" 
                  id="limiteGastoDiario" 
                  className="peer sr-only" 
                />
                <label 
                  htmlFor="limiteGastoDiario"
                  className="absolute inset-0 cursor-pointer rounded-full bg-gray-200 transition peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-checked:bg-primary-500"
                >
                  <span className="absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>

            {/* Prioridad de consumo */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">Prioridad de Consumo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Consumir primero los cru00e9ditos que estu00e9n pru00f3ximos a vencer
                </p>
              </div>
              <div className="relative inline-block h-6 w-11">
                <input 
                  type="checkbox" 
                  id="prioridadConsumo" 
                  className="peer sr-only" 
                  defaultChecked
                />
                <label 
                  htmlFor="prioridadConsumo"
                  className="absolute inset-0 cursor-pointer rounded-full bg-gray-200 transition peer-checked:bg-primary-600 dark:bg-gray-700 dark:peer-checked:bg-primary-500"
                >
                  <span className="absolute left-1 top-1 h-4 w-4 transform rounded-full bg-white transition peer-checked:translate-x-5"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400">
              Guardar Preferencias
            </button>
          </div>
        </div>
      </motion.div>

      {/* Informaciu00f3n de ayuda */}
      <motion.div variants={itemVariants}>
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Sabu00edas que...</h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                <p>
                  Puedes configurar notificaciones personalizadas para estar siempre al tanto del estado de tus cru00e9ditos. 
                  Esto te ayudaru00e1 a planificar mejor tus campau00f1as y evitar quedarte sin cru00e9ditos en momentos importantes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
