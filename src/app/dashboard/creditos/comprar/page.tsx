"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, CreditCard, ArrowRight, HelpCircle } from 'lucide-react';

export default function ComprarCreditosPage() {
  // Planes disponibles
  const planes = [
    {
      id: 'basico',
      nombre: 'Plan Básico',
      creditos: 5000,
      precio: 149900,
      duracion: '30 días',
      popular: false,
      caracteristicas: [
        'Monitoreo básico de redes sociales',
        'Análisis de sentimiento',
        'Reportes semanales',
        'Soporte por email'
      ]
    },
    {
      id: 'profesional',
      nombre: 'Plan Profesional',
      creditos: 15000,
      precio: 399900,
      duracion: '30 días',
      popular: true,
      caracteristicas: [
        'Monitoreo avanzado de redes sociales',
        'Análisis de sentimiento detallado',
        'Alertas en tiempo real',
        'Reportes personalizados',
        'Soporte prioritario'
      ]
    },
    {
      id: 'empresarial',
      nombre: 'Plan Empresarial',
      creditos: 50000,
      precio: 999900,
      duracion: '30 días',
      popular: false,
      caracteristicas: [
        'Monitoreo completo de redes sociales',
        'Análisis de sentimiento avanzado',
        'Alertas personalizadas',
        'Reportes automatizados',
        'API integración',
        'Soporte 24/7',
        'Consultoría mensual'
      ]
    }
  ];

  // Preguntas frecuentes
  const faqs = [
    {
      pregunta: '¿Cuánto tiempo duran los créditos?',
      respuesta: 'Los créditos tienen una validez de 30 días a partir de la fecha de compra. Te notificaremos cuando estén a punto de vencer.'
    },
    {
      pregunta: '¿Puedo cancelar mi suscripción?',
      respuesta: 'Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de usuario. No hay período mínimo de permanencia ni penalizaciones por cancelación.'
    },
    {
      pregunta: '¿Cómo se factura la compra?',
      respuesta: 'Al realizar la compra, generamos automáticamente una factura electrónica que será enviada al correo electrónico registrado en tu cuenta.'
    },
    {
      pregunta: '¿Qué métodos de pago aceptan?',
      respuesta: 'Aceptamos tarjetas de crédito (Visa, Mastercard, American Express), PSE, transferencia bancaria y diversos métodos de pago locales.'
    },
    {
      pregunta: '¿Puedo transferir créditos entre cuentas?',
      respuesta: 'No, los créditos son intransferibles y están asociados únicamente a la cuenta donde se realizó la compra.'
    }
  ];

  // Animaciones
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
      {/* Título de la página */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comprar Créditos</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Elige el plan que mejor se adapte a tus necesidades de monitoreo y análisis de reputación.
        </p>
      </motion.div>

      {/* Planes de créditos */}
      <motion.div 
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        variants={itemVariants}
      >
        {planes.map((plan) => (
          <div 
            key={plan.id}
            className={`relative overflow-hidden rounded-lg ${plan.popular ? 'border-2 border-primary-500 dark:border-primary-400' : 'border border-gray-200 dark:border-gray-700'}`}
          >
            {plan.popular && (
              <div className="absolute right-0 top-0 bg-primary-500 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white dark:bg-primary-400">
                Más Popular
              </div>
            )}

            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.nombre}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">$ {(plan.precio / 1000).toFixed(3)}</span>
                <span className="ml-1 text-xl font-semibold text-gray-500 dark:text-gray-400">COP</span>
              </div>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{plan.duracion}</p>

              <hr className="my-4 border-gray-200 dark:border-gray-700" />

              <div className="mb-4 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="mr-1 font-bold text-primary-600 dark:text-primary-400">{plan.creditos.toLocaleString('es-CO')}</span> 
                  créditos incluidos
                </p>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.caracteristicas.map((caracteristica, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="mr-2 h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{caracteristica}</span>
                  </li>
                ))}
              </ul>

              <button className={`mt-2 w-full rounded-md px-4 py-2 text-center text-sm font-medium ${plan.popular ? 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400' : 'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20'}`}>
                Comprar Plan
              </button>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Paquetes personalizados */}
      <motion.div
        className="card mt-8 p-6"
        variants={itemVariants}
      >
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">¿Necesitas un plan personalizado?</h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Podemos crear un paquete ajustado a tus necesidades específicas de monitoreo.
            </p>
          </div>
          <button className="flex items-center rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
            Contactar Ventas
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Métodos de pago */}
      <motion.div className="card p-6" variants={itemVariants}>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Métodos de Pago Aceptados</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <CreditCard className="mr-3 h-6 w-6 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarjetas de Crédito</span>
          </div>
          <div className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <img src="/path/to/pse-logo.svg" alt="PSE" className="mr-3 h-6 w-6" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">PSE</span>
          </div>
          <div className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <img src="/path/to/nequi-logo.svg" alt="Nequi" className="mr-3 h-6 w-6" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nequi</span>
          </div>
          <div className="flex items-center rounded-md border border-gray-200 p-3 dark:border-gray-700">
            <img src="/path/to/bancolombia-logo.svg" alt="Bancolombia" className="mr-3 h-6 w-6" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Transferencia</span>
          </div>
        </div>
        <div className="mt-4 flex items-center rounded-md bg-green-50 p-3 dark:bg-green-900/20">
          <Shield className="mr-2 h-5 w-5 text-green-600 dark:text-green-500" />
          <p className="text-sm text-green-700 dark:text-green-400">
            Todas las transacciones son seguras y están encriptadas con SSL.
          </p>
        </div>
      </motion.div>

      {/* Preguntas frecuentes */}
      <motion.div className="card p-6" variants={itemVariants}>
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">Preguntas Frecuentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="rounded-md border border-gray-200 dark:border-gray-700">
              <button className="flex w-full items-center justify-between p-4 text-left">
                <span className="text-base font-medium text-gray-900 dark:text-white">{faq.pregunta}</span>
                <HelpCircle className="h-5 w-5 text-gray-400" />
              </button>
              <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-300">{faq.respuesta}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Garantía */}
      <motion.div 
        className="card overflow-hidden rounded-lg border-2 border-primary-50 bg-primary-50 dark:border-primary-900 dark:bg-primary-900/20"
        variants={itemVariants}
      >
        <div className="p-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-800">
              <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400">Garantía de Satisfacción</h3>
            <p className="text-primary-600 dark:text-primary-300">
              Si no estás satisfecho con nuestro servicio dentro de los primeros 7 días, te reembolsaremos el 100% de tu compra sin hacer preguntas.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
