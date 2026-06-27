"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Home, BarChart3, Users, Menu, Search, FileText, Headphones, Share2, Brain, Radio, Target, Coins } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import UserProfile from '@/components/user/UserProfile';
import HeaderSearch from '@/components/dashboard/HeaderSearch';
import { useCredits } from '@/context/CreditosContext';
import { gsap } from 'gsap';

// Componente interno que maneja la verificación de onboarding
function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { currentBalance, isLoading: creditsLoading } = useCredits();
  const [menuOpen, setMenuOpen] = useState(false); // Cambiado a false por defecto
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
    // El sidebar/main-content solo existen cuando el layout autenticado ya montó.
    // Evita los warnings "GSAP target .sidebar not found" durante el estado de carga.
    if (typeof document === 'undefined' || !document.querySelector('.sidebar')) return;

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00E5FF] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.onboardingCompleted) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0B1120]">
      {/* Overlay para cerrar el menú en móvil */}
      {isMobile && menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0B1120] bg-opacity-70 transition-opacity backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Barra lateral de navegación - NUEVO DISEÑO NAVY */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-[#0B1120] shadow-xl transition-all duration-300 ${isMobile ? 'w-64' : (menuOpen || menuHovered) ? 'w-64' : 'w-20'}`}
        style={isMobile && !menuOpen ? { transform: 'translateX(-100%)' } : {}}
        onMouseEnter={() => !isMobile && setMenuHovered(true)}
        onMouseLeave={() => !isMobile && setMenuHovered(false)}
      >
        <div className="flex flex-shrink-0 items-center px-4 py-4 border-b border-[#1A202C]">
          <div className="flex items-center">
            {(menuOpen || menuHovered || isMobile) ? (
              <img
                className="h-8 w-auto"
                src="/rol-logo.png"
                alt="Reputación Online"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
                <span className="text-[#00E5FF] font-bold text-lg">R</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
          <nav className="space-y-1">
            <Link href="/dashboard" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Home className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Dashboard'}
            </Link>

            <Link href="/dashboard/analisis" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/analisis' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <BarChart3 className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/analisis' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Análisis'}
            </Link>

            <Link href="/dashboard/monitoreo" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/monitoreo' || pathname.startsWith('/dashboard/monitoreo') ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Radio className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/monitoreo' || pathname.startsWith('/dashboard/monitoreo') ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Monitoreo'}
            </Link>

            <Link href="/dashboard/audiencia" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/audiencia' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Users className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/audiencia' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Análisis de Audiencia'}
            </Link>

            <Link href="/dashboard/social-listening" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/social-listening' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Headphones className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/social-listening' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Social Listening'}
            </Link>

            <Link href="/dashboard/redes-sociales" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/redes-sociales' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Share2 className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/redes-sociales' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Redes Sociales'}
            </Link>

            <Link href="/dashboard/julia" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/julia' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Brain className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/julia' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Julia IA'}
            </Link>

            <Link href="/dashboard/busqueda-noticias" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/busqueda-noticias' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Search className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/busqueda-noticias' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Búsqueda y Noticias'}
            </Link>

            <Link href="/dashboard/busqueda-personas" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/busqueda-personas' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <Target className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/busqueda-personas' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Búsqueda de Personas'}
            </Link>

            <Link href="/dashboard/creditos/reportes" className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${pathname === '/dashboard/creditos/reportes' ? 'bg-[#00E5FF]/15 text-[#00E5FF]' : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'}`}>
              <FileText className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5 transition-colors ${pathname === '/dashboard/creditos/reportes' ? 'text-[#00E5FF]' : 'text-gray-500 group-hover:text-[#00E5FF]'}`} />
              {(menuOpen || menuHovered || isMobile) && 'Reportes'}
            </Link>
          </nav>
        </div>

        {/* Botón Recargar Créditos - fijo en el fondo del sidebar */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-[#1A202C]">
          <Link
            href="/dashboard/creditos/comprar"
            className="group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20"
          >
            <Coins className={`${(menuOpen || menuHovered || isMobile) ? 'mr-3' : 'mx-auto'} h-5 w-5`} />
            {(menuOpen || menuHovered || isMobile) && (
              <span className="flex items-center justify-between w-full">
                <span>Recargar</span>
                <span className="text-xs bg-[#00E5FF]/20 px-1.5 py-0.5 rounded">
                  {creditsLoading ? '...' : currentBalance.toLocaleString('es-CO')}
                </span>
              </span>
            )}
          </Link>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="main-content flex flex-1 flex-col transition-all duration-300" style={{ paddingLeft: isMobile ? '0' : (menuOpen || menuHovered) ? '16rem' : '5rem' }}>
        {/* Barra superior - NUEVO DISEÑO */}
        <header className="sticky top-0 z-50 flex h-16 flex-shrink-0 bg-white shadow-soft dark:bg-[#151C2E] border-b border-gray-100 dark:border-[#1A202C]">
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              {/* Botón toggle menu para móvil y escritorio */}
              <button
                className="mr-4 rounded-lg border border-[#00E5FF]/30 p-1.5 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:border-[#00E5FF] transition-all duration-200"
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
              {/* Saldo de créditos */}
              <Link
                href="/dashboard/creditos"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  currentBalance < 10
                    ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-100'
                    : currentBalance < 100
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100'
                    : 'bg-[#00E5FF]/10 text-[#00E5FF] hover:bg-[#00E5FF]/20'
                }`}
                title="Ver mis créditos"
              >
                <Coins className="h-4 w-4" />
                <span>{creditsLoading ? '...' : currentBalance.toLocaleString('es-CO')}</span>
              </Link>

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

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-[#1A202C] bg-white dark:bg-[#151C2E] px-4 sm:px-8 py-4">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>© {new Date().getFullYear()} Reputación Online · Monitoreo de reputación con IA</span>
            <span className="flex items-center gap-4">
              <Link href="/dashboard/creditos/comprar" className="hover:text-[#00E5FF]">Planes</Link>
              <a href="/politica-de-privacidad" className="hover:text-[#00E5FF]">Privacidad</a>
              <a href="/terminos-de-servicio" className="hover:text-[#00E5FF]">Términos</a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardContent>
      {children}
    </DashboardContent>
  );
}
