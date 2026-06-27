"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from './AdminSidebar';

interface AdminPageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminPageWrapper({ children, title, subtitle }: AdminPageWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    // Redirigir al login de admin
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </header>

        <main className="p-6 min-h-[calc(100vh-4rem-3.5rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Reputación Online · Panel de Administración</span>
          <span className="flex items-center gap-3">
            <a href="/dashboard" className="hover:text-[#01257D]">Ir al sitio</a>
            <a href="/politica-de-privacidad" className="hover:text-[#01257D]">Privacidad</a>
            <a href="/terminos-de-servicio" className="hover:text-[#01257D]">Términos</a>
          </span>
        </footer>
      </div>
    </div>
  );
}
