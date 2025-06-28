"use client";

import React, { useState } from 'react';
import { Settings, Bell, Shield, Globe, User, Save } from 'lucide-react';

export default function ConfiguracionPage() {
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: false,
    reportes: true,
    menciones: true
  });

  const [privacidad, setPrivacidad] = useState({
    perfilPublico: false,
    mostrarEmail: false,
    analiticasPublicas: false
  });

  const [idioma, setIdioma] = useState('es');
  const [tema, setTema] = useState('light');

  const handleGuardar = () => {
    // Aquí se guardarían las configuraciones
    console.log('Configuraciones guardadas:', {
      notificaciones,
      privacidad,
      idioma,
      tema
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#01257D]" />
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Personaliza tu experiencia en la plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#01257D]" />
            Notificaciones
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notificaciones por email
              </label>
              <input
                type="checkbox"
                checked={notificaciones.email}
                onChange={(e) => setNotificaciones({...notificaciones, email: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notificaciones push
              </label>
              <input
                type="checkbox"
                checked={notificaciones.push}
                onChange={(e) => setNotificaciones({...notificaciones, push: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Reportes semanales
              </label>
              <input
                type="checkbox"
                checked={notificaciones.reportes}
                onChange={(e) => setNotificaciones({...notificaciones, reportes: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Alertas de menciones
              </label>
              <input
                type="checkbox"
                checked={notificaciones.menciones}
                onChange={(e) => setNotificaciones({...notificaciones, menciones: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Privacidad */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#01257D]" />
            Privacidad
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Perfil público
              </label>
              <input
                type="checkbox"
                checked={privacidad.perfilPublico}
                onChange={(e) => setPrivacidad({...privacidad, perfilPublico: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Mostrar email públicamente
              </label>
              <input
                type="checkbox"
                checked={privacidad.mostrarEmail}
                onChange={(e) => setPrivacidad({...privacidad, mostrarEmail: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Analíticas públicas
              </label>
              <input
                type="checkbox"
                checked={privacidad.analiticasPublicas}
                onChange={(e) => setPrivacidad({...privacidad, analiticasPublicas: e.target.checked})}
                className="w-4 h-4 text-[#01257D] bg-gray-100 border-gray-300 rounded focus:ring-[#01257D] focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Preferencias generales */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#01257D]" />
            Preferencias
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema
              </label>
              <select
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información de cuenta */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#01257D]" />
            Información de cuenta
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de cuenta
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuario Premium
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Miembro desde
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enero 2024
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Última actividad
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hace 2 horas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleGuardar}
          className="inline-flex items-center px-6 py-3 bg-[#01257D] text-white font-medium rounded-lg hover:bg-[#013AAA] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:ring-opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
