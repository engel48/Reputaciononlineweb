"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';

export default function ConfiguracionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-[#01257D] mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Configuración del Sistema
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestiona las configuraciones globales de la plataforma
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#01257D] transition-colors"
              >
                ← Volver al Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="text-center">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Configuración Integrada
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              La configuración del sistema se encuentra integrada en el panel principal de administración.
            </p>
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-[#01257D] text-white rounded-md hover:bg-[#013AAA] font-medium"
            >
              Ir al Panel Principal
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              En el panel principal, haz clic en la pestaña "Configuraciones del Sistema"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}