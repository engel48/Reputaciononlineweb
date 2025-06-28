import React, { useState, useEffect } from 'react';
import { useCredits } from '@/context/CreditosContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CreditCard, AlertTriangle, ChevronRight, TrendingUp, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function CreditosNotification() {
  const { currentBalance, totalUsed, totalPurchased } = useCredits();
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mostrarCompra, setMostrarCompra] = useState(false);
  
  // Umbral de alerta (20% de los créditos totales)
  const umbralAlerta = 20;
  
  useEffect(() => {
    if (currentBalance > 0) {
      const porcentajeDisponible = (currentBalance / totalPurchased) * 100;
      
      // Mostrar alerta si los créditos están por debajo del umbral
      if (porcentajeDisponible <= umbralAlerta) {
        setMostrarAlerta(true);
        
        // Si los créditos son muy bajos, mostrar también la opción de compra
        if (porcentajeDisponible <= 10) {
          setMostrarCompra(true);
        }
      } else {
        setMostrarAlerta(false);
        setMostrarCompra(false);
      }
    } else if (currentBalance <= 0) {
      // Si no hay créditos, mostrar alerta crítica
      setMostrarAlerta(true);
      setMostrarCompra(true);
    }
  }, [currentBalance, totalUsed, totalPurchased, umbralAlerta]);
  
  // Cerrar la notificación
  const cerrarNotificacion = () => {
    setMostrarAlerta(false);
  };
  
  // Animación para la notificación
  const notificationVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0,
      y: -50,
      transition: { 
        duration: 0.3 
      }
    }
  };
  
  // Determinar el color de la alerta según el nivel de créditos
  const getAlertaColor = () => {
    const porcentajeDisponible = (currentBalance / totalPurchased) * 100;
    
    if (currentBalance <= 0) {
      return 'bg-red-500 dark:bg-red-800';
    } else if (porcentajeDisponible <= 10) {
      return 'bg-red-500 dark:bg-red-800';
    } else if (porcentajeDisponible <= 30) {
      return 'bg-amber-500 dark:bg-amber-800';
    } else {
      return 'bg-blue-500 dark:bg-blue-800';
    }
  };
  
  // Obtener el mensaje de la alerta según el nivel de créditos
  const getMensajeAlerta = () => {
    const porcentajeDisponible = (currentBalance / totalPurchased) * 100;

    if (currentBalance <= 0) {
      return '¡No tienes créditos disponibles! Compra más para seguir usando la plataforma.';
    } else if (porcentajeDisponible <= 10) {
      return (
        <div className={`mb-4 rounded-lg border ${getBorderColorClass('critical')} ${getBgColorClass('critical')} p-4 shadow-md transition-all hover:shadow-lg`}>
          <div className="flex items-start">
            <div className="mr-3 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            <div className="w-full">
              <div className="mb-2 flex items-center justify-between">
                <h3 className={`text-lg font-bold text-red-800 dark:text-red-300`}>
                  ¡Nivel crítico de créditos!
                </h3>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                Solo te quedan {currentBalance} créditos disponibles.
              </p>

              <div className="mb-3 rounded-md bg-red-50 p-3 dark:bg-red-900/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Créditos disponibles
                  </span>
                  <span className="font-bold text-red-800 dark:text-red-300">
                    {currentBalance}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${Math.min(100, (currentBalance / 1000) * 100)}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                  Se estima que los créditos actuales se agotarán en{' '}
                  {Math.max(1, Math.floor(currentBalance / 10))} días según su ritmo de uso actual.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="flex-grow inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-600 dark:focus:ring-primary-400 transition-all"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Comprar créditos ahora
                </button>
                <button
                  className="flex-grow inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all"
                >
                  Ver planes premium
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (porcentajeDisponible <= 30) {
      return `Tus créditos están bajos. Te quedan ${currentBalance} créditos disponibles.`;
    } else {
      return `Estás por debajo del umbral de alerta (${umbralAlerta}%). Te quedan ${currentBalance} créditos.`;
    }
  };

  const getBorderColorClass = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'border-red-500 dark:border-red-800';
      case 'warning':
        return 'border-yellow-500 dark:border-yellow-800';
      case 'info':
        return 'border-blue-500 dark:border-blue-800';
      default:
        return '';
    }
  };

  const getBgColorClass = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/10';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/10';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/10';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {mostrarAlerta && (
        <motion.div
          className={`fixed right-4 top-4 z-50 w-80 rounded-lg shadow-xl ${getAlertaColor()} border border-white/20`}
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-base font-medium text-white">{getMensajeAlerta()}</p>
                <p className="mt-1 text-sm text-white/80">
                  {currentBalance === 0
                    ? 'Adquiere créditos para continuar usando todas las funciones.'
                    : `Saldo actual: ${currentBalance.toLocaleString('es-CO')} créditos.`}
                </p>
              </div>
              <div className="ml-2">
                <button
                  type="button"
                  className="inline-flex rounded-md bg-transparent text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={cerrarNotificacion}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {mostrarCompra && (
              <div className="mt-3">
                <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white shadow-sm transition-all hover:shadow-md">
                  <CreditCard className="mr-2 inline h-4 w-4" />
                  Comprar Créditos Ahora
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
