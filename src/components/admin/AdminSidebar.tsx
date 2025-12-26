"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, Home, Users, CreditCard, DollarSign, Crown, Settings, Menu, Globe, LogOut
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
}

export default function AdminSidebar({ isCollapsed, onToggle, onLogout }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { href: '/admin/creditos', icon: CreditCard, label: 'Créditos' },
    { href: '/admin/pagos', icon: DollarSign, label: 'Pagos' },
    { href: '/admin/planes', icon: Crown, label: 'Planes' },
    { href: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: redirigir al login de admin
      router.push('/admin');
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1120] border-r border-gray-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        <Link href="/admin" className="flex items-center">
          <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00E5FF]" />
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-lg font-bold text-white">Admin</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#00E5FF]/15 text-[#00E5FF]'
                  : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] transition-all duration-200`}
        >
          <Globe className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium">Ir al Dashboard</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200`}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}
