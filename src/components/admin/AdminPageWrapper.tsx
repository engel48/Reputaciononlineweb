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
    <div className="min-h-screen bg-[#0B1120]">
      <AdminSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-[#151C2E] border-b border-gray-800 flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
