"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditProvider } from '@/context/CreditosContext';
import {
  Home, CreditCard, BarChart3, Settings, Bell, Users,
  Search, User, LogOut, Menu, X, Database, Globe, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false); // Empezar expandido para mejor UX
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setMobileMenuOpen(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      router.push('/admin');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0B1120]">
      {/* Overlay para móvil */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B1120] bg-opacity-70 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Barra lateral - Nuevo diseño Navy */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1120] shadow-xl transition-all duration-300 ${
          isMobile
            ? `w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`
            : `${isCollapsed ? 'w-20' : 'w-64'} hidden md:flex`
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#1A202C] px-6">
          <Link href="/admin" className="flex items-center">
            <div className="h-8 w-8 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
              <span className="text-[#00E5FF] font-bold text-lg">A</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 text-xl font-bold text-white">Admin Panel</span>
            )}
          </Link>

          {/* Toggle button para desktop */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Usuario admin */}
        <div className="border-b border-[#1A202C] p-4">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
              <User className="h-6 w-6" />
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Admin Usuario</p>
                <p className="text-xs text-gray-400">Administrador</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <div className="px-3 py-2">
            {(!isCollapsed || isMobile) && (
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Dashboard</h3>
            )}
            <nav className="space-y-1">
              <Link
                href="/admin"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Inicio' : ''}
              >
                <Home className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Inicio'}
              </Link>
            </nav>
          </div>

          <div className="px-3 py-2">
            {(!isCollapsed || isMobile) && (
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Créditos</h3>
            )}
            <nav className="space-y-1">
              <Link
                href="/admin/creditos"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/creditos' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Gestión de Créditos' : ''}
              >
                <CreditCard className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/creditos' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Gestión de Créditos'}
              </Link>
              <Link
                href="/admin/creditos/asignar"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/creditos/asignar' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Asignar Créditos' : ''}
              >
                <Database className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/creditos/asignar' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Asignar Créditos'}
              </Link>
              <Link
                href="/admin/creditos/reportes"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/creditos/reportes' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Reportes' : ''}
              >
                <BarChart3 className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/creditos/reportes' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Reportes'}
              </Link>
              <Link
                href="/admin/pagos"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/pagos' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Pagos' : ''}
              >
                <DollarSign className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/pagos' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Pagos'}
              </Link>
            </nav>
          </div>

          <div className="px-3 py-2">
            {(!isCollapsed || isMobile) && (
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Gestión</h3>
            )}
            <nav className="space-y-1">
              <Link
                href="/admin/usuarios"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/usuarios' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Usuarios' : ''}
              >
                <Users className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/usuarios' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Usuarios'}
              </Link>
              <Link
                href="/admin/redes-sociales"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/redes-sociales' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Redes Sociales' : ''}
              >
                <Globe className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/redes-sociales' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Redes Sociales'}
              </Link>
              <Link
                href="/admin/configuracion"
                className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  pathname === '/admin/configuracion' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
                title={isCollapsed ? 'Configuración' : ''}
              >
                <Settings className={`h-5 w-5 transition-colors ${
                  isCollapsed ? 'mx-auto' : 'mr-3'
                } ${pathname === '/admin/configuracion' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
                {(!isCollapsed || isMobile) && 'Configuración'}
              </Link>
            </nav>
          </div>

          {/* Logout at bottom of sidebar */}
          <div className="mt-auto px-3 py-4 border-t border-[#1A202C]">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
              title={isCollapsed ? 'Cerrar Sesión' : ''}
            >
              <LogOut className={`h-5 w-5 text-gray-500 group-hover:text-red-400 transition-colors ${
                isCollapsed ? 'mx-auto' : 'mr-3'
              }`} />
              {(!isCollapsed || isMobile) && 'Cerrar Sesión'}
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${
        isMobile ? 'md:pl-0' : isCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>
        {/* Barra superior - Nuevo diseño */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white dark:bg-[#151C2E] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-b border-gray-100 dark:border-[#1A202C]">
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center md:ml-0">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-lg text-gray-500 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors md:hidden"
              >
                <span className="sr-only">Abrir menú</span>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Desktop toggle button */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden md:inline-flex -ml-0.5 -mt-0.5 h-12 w-12 items-center justify-center rounded-lg text-gray-500 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
              >
                <span className="sr-only">{isCollapsed ? "Expandir" : "Colapsar"} menú</span>
                <Menu className="h-6 w-6" />
              </button>
              <div className="ml-4 flex w-full max-w-xs items-center md:ml-0">
                <div className="relative w-full">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full rounded-xl border border-gray-200 dark:border-[#1A202C] bg-gray-50 dark:bg-[#1A202C] py-2 pl-10 pr-3 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-[#00E5FF] focus:bg-white dark:focus:bg-[#151C2E] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/30 transition-all"
                    placeholder="Buscar..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              {/* Botón de notificaciones */}
              <button className="rounded-xl p-2 text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors">
                <span className="sr-only">Ver notificaciones</span>
                <Bell className="h-5 w-5" />
              </button>

              {/* Perfil de usuario */}
              <div className="relative ml-3">
                <button className="flex items-center rounded-xl p-1 hover:bg-[#00E5FF]/10 transition-colors">
                  <span className="sr-only">Abrir menú de usuario</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                    <User className="h-5 w-5" />
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-3 py-2 text-sm font-medium rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreditProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </CreditProvider>
  );
}