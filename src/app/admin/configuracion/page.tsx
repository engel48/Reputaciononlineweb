"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin';

export default function ConfiguracionPage() {
  const router = useRouter();

  return (
    <AdminPageWrapper title="Configuración del Sistema" subtitle="Gestiona las configuraciones globales de la plataforma">
      <div className="bg-[#151C2E] rounded-xl border border-gray-800 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00E5FF]/10 mb-4">
            <Settings className="h-8 w-8 text-[#00E5FF]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Configuración Integrada
          </h2>
          <p className="text-gray-400 mb-6">
            La configuración del sistema se encuentra integrada en el panel principal de administración.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="px-6 py-3 bg-[#00E5FF] text-[#0B1120] rounded-xl hover:bg-[#00D4ED] font-semibold transition-colors"
          >
            Ir al Panel Principal
          </button>
          <p className="text-sm text-gray-500 mt-4">
            En el panel principal, haz clic en la pestaña "Configuraciones del Sistema"
          </p>
        </div>
      </div>
    </AdminPageWrapper>
  );
}