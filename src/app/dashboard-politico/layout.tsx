"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { CreditProvider } from '@/context/CreditosContext';
import { Home, BarChart3, Hash, Users, Menu, Search, FileText, Vote, TrendingUp, Target, Award } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import UserProfile from '@/components/user/UserProfile';
import HeaderSearch from '@/components/dashboard/HeaderSearch';
import { gsap } from 'gsap';

// Componente interno que maneja la verificación de onboarding
function PoliticalDashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const pathname = usePathname();

  // Verificar autenticación y onboarding
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Redirigir a onboarding si no está completo
      if (!user.onboardingCompleted) {
        router.push('/onboarding');
        return;
      }
    }
  }, [user, isLoading, router]);

  // Detectar si estamos en móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // En móvil siempre cerrado, en desktop manejado por hover
      if (window.innerWidth < 768) {
        setMenuOpen(false);
        setMenuHovered(false);
      }
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Animar apertura/cierre del menú
  useEffect(() => {
    const isExpanded = isMobile ? menuOpen : (menuOpen || menuHovered);
    
    if (isMobile) {
      if (menuOpen) {
        gsap.to('.sidebar', {
          x: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.to('.sidebar', {
          x: '-100%',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    } else {
      if (isExpanded) {
        gsap.to('.sidebar', {
          width: '16rem',
          duration: 0.3,
          ease: 'power2.out'
        });
        gsap.to('.main-content', {
          paddingLeft: '16rem',
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        gsap.to('.sidebar', {
          width: '5rem',
          duration: 0.3,
          ease: 'power2.out'
        });
        gsap.to('.main-content', {
          paddingLeft: '5rem',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  }, [menuOpen, menuHovered, isMobile]);

  // Cerrar menú al navegar en móvil
  useEffect(() => {
    if (isMobile) {
      setMenuOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#01257D] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.onboardingCompleted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Overlay para cerrar el menú en móvil */}
      {isMobile && menuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-50 transition-opacity" 
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Barra lateral de navegación política */}
      <aside 
        className={`sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-white shadow-lg transition-all duration-300 dark:bg-gray-800 ${isMobile ? 'w-64' : (menuOpen || menuHovered) ? 'w-64' : 'w-20'}`}
        style={isMobile && !menuOpen ? { transform: 'translateX(-100%)' } : {}}
        onMouseEnter={() => !isMobile && setMenuHovered(true)}
        onMouseLeave={() => !isMobile && setMenuHovered(false)}
      >
        <div className="flex flex-shrink-0 items-center px-4">
          <div className="flex items-center">
            {(menuOpen || menuHovered || isMobile) && (
              <img
                className="h-8 w-auto"
                src="/rol-logo.png"
                alt="Reputación Online - Político"
              />
            )}
          </div>
        </div>
        
        <div className="mt-5 flex-1 space-y-1 px-2">
          <nav className="space-y-1">
            <Link href="/dashboard-politico" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <Home className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Dashboard Político'}
            </Link>

            <Link href="/dashboard-politico/aprobacion" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/aprobacion' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <TrendingUp className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/aprobacion' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Aprobación'}
            </Link>

            <Link href="/dashboard-politico/intencion-voto" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/intencion-voto' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <Vote className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/intencion-voto' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Intención de Voto'}
            </Link>

            <Link href="/dashboard-politico/analisis" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/analisis' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <BarChart3 className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/analisis' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Análisis Político'}
            </Link>

            <Link href="/dashboard-politico/audiencia" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/audiencia' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <Users className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/audiencia' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Análisis de Audiencia'}
            </Link>

            <Link href="/dashboard-politico/hashtags" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/hashtags' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <Hash className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/hashtags' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Hashtags'}
            </Link>

            <Link href="/dashboard-politico/propuestas" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/propuestas' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <Target className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/propuestas' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Propuestas'}
            </Link>

            <Link href="/dashboard-politico/reportes" className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${pathname === '/dashboard-politico/reportes' ? 'bg-[#01257D]/10 text-[#01257D] dark:bg-[#01257D]/20 dark:text-[#01257D]' : 'text-gray-600 hover:bg-[#01257D]/10 hover:text-[#01257D] dark:text-gray-300 dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]'}`}>
              <FileText className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 ${pathname === '/dashboard-politico/reportes' ? 'text-[#01257D] dark:text-white' : 'text-gray-400 group-hover:text-[#01257D] dark:text-gray-400 dark:group-hover:text-white'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Reportes'}
            </Link>
          </nav>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content flex flex-1 flex-col transition-all duration-300" style={{ paddingLeft: isMobile ? '0' : (menuOpen || menuHovered) ? '16rem' : '5rem' }}>
        {/* Barra superior */}
        <header className="sticky top-0 z-50 flex h-16 flex-shrink-0 bg-white shadow dark:bg-gray-800">
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              {/* Botón toggle menu para móvil y escritorio */}
              <button
                className="mr-4 rounded-md border border-[#01257D] p-1.5 text-[#01257D] hover:bg-[#01257D]/10 hover:text-[#01257D] dark:border-[#01257D] dark:text-[#01257D] dark:hover:bg-[#01257D]/20 dark:hover:text-[#01257D]"
                onClick={toggleMenu}
                title={menuOpen ? "Contraer menú" : "Expandir menú"}
              >
                <span className="sr-only">{menuOpen ? "Contraer menú" : "Expandir menú"}</span>
                <Menu className="h-5 w-5" />
              </button>
              
              {/* Buscador rápido en la barra superior */}
              <HeaderSearch />
            </div>

            <div className="ml-4 flex items-center justify-end space-x-4">
              {/* Centro de notificaciones */}
              <NotificationCenter />
              
              {/* Perfil del usuario */}
              <UserProfile />
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

        {/* Footer político */}
        <footer className="bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  © 2024 Reputación Online - Dashboard Político
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <Award className="mr-1 h-3 w-3" />
                  Perfil Político
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function PoliticalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreditProvider>
      <PoliticalDashboardContent>
        {children}
      </PoliticalDashboardContent>
    </CreditProvider>
  );
}