"use client";

import React from 'react';
import { CreditProvider } from '@/context/CreditosContext';

/**
 * Layout minimalista para Admin
 *
 * ARQUITECTURA:
 * - Este layout NO tiene sidebar ni header
 * - El sidebar se maneja DENTRO de cada página después de autenticación
 * - Esto permite mostrar login limpio sin menú expuesto
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreditProvider>
      <div className="min-h-screen bg-[#0B1120]">
        {children}
      </div>
    </CreditProvider>
  );
}
