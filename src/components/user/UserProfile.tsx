"use client";

import React, { useState, useRef, useEffect } from 'react';
import { User as UserIcon, LogOut, Settings, CreditCard, Bell, ChevronDown, Calendar, Shield, Share2, Radio } from 'lucide-react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { useUser } from '@/context/UserContext';

const UserProfile = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Animaciones para el dropdown
  useEffect(() => {
    if (dropdownRef.current) {
      if (isOpen) {
        gsap.set(dropdownRef.current, { display: 'block', autoAlpha: 0, y: -10 });
        gsap.to(dropdownRef.current, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' });
        
        // Animar elementos internos
        const menuItems = dropdownRef.current.querySelectorAll('.menu-item');
        gsap.fromTo(menuItems, 
          { opacity: 0, y: 5 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.2, delay: 0.1 }
        );
      } else {
        gsap.to(dropdownRef.current, { 
          autoAlpha: 0, 
          y: -10, 
          duration: 0.2, 
          ease: 'power2.in',
          onComplete: () => {
            if (dropdownRef.current) {
              gsap.set(dropdownRef.current, { display: 'none' });
            }
          }
        });
      }
    }
  }, [isOpen]);

  // Animación del avatar cuando hay notificaciones
  useEffect(() => {
    if (buttonRef.current && user) {
      // Efecto de brillo pulsante alrededor del avatar (simula notificaciones pendientes)
      gsap.to(buttonRef.current, { 
        boxShadow: '0 0 0 2px rgba(0, 179, 176, 0.4)', 
        repeat: -1, 
        yoyo: true, 
        duration: 1.5,
        ease: 'sine.inOut'
      });
    }
    
    // Animar incremento de créditos (efecto contador)
    if (user && document.getElementById('credit-counter')) {
      const creditCounter = document.getElementById('credit-counter');
      const targetValue = user.credits;
      let currentValue = 0;
      
      gsap.to({}, {
        duration: 1.5,
        onUpdate: function() {
          const progress = this.progress();
          currentValue = Math.round(progress * targetValue);
          if (creditCounter) {
            creditCounter.textContent = currentValue.toLocaleString();
          }
        },
        onComplete: function() {
          if (creditCounter) {
            creditCounter.textContent = targetValue.toLocaleString();
          }
        }
      });
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700"></div>
    );
  }
  
  const handleLogout = () => {
    if (logout) {
      logout();
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center space-x-2 rounded-full border-2 border-transparent bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-white"
      >
        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
          {user ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="aspect-square h-full w-full"
            />
          ) : (
            <UserIcon className="h-6 w-6 text-gray-400" />
          )}
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary-500"></span>
        </span>
        <div className="hidden flex-col items-start text-left md:flex">
          <span className="text-sm font-medium">{user ? user.name : 'Usuario'}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {user ? (user.profileType === 'political' ? 'Perfil Político' : 'Perfil Personal') : 'Cargando...'}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>

      {/* Dropdown Menu */}
      <div
        ref={dropdownRef}
        className="absolute right-0 mt-2 hidden w-64 origin-top-right rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        style={{ visibility: 'hidden', opacity: 0 }}
      >
        {/* User Info */}
        <div className="border-b border-gray-100 dark:border-gray-700">
          {user && (
            <div className="rounded-t-md bg-gray-50 dark:bg-gray-800 p-4">
              <div className="flex items-center">
                <div className="relative flex h-14 w-14 overflow-hidden rounded-full border-2 border-primary-200 dark:border-primary-800">
                  <img
                    src={user?.avatarUrl || '/images/default-avatar.png'} 
                    alt={user?.name || 'Usuario'}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></span>
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">{user?.name || 'Usuario'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{user?.email || 'correo@ejemplo.com'}</p>
                  <div className="mt-1 flex items-center">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
                    <span className="ml-1 text-xs font-medium text-primary-600 dark:text-primary-400">
                      Plan {user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) : 'Básico'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Créditos disponibles
                </span>
                <p id="credit-counter" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {user?.credits ? user.credits.toLocaleString() : '0'}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(100, ((user?.credits || 0) / 3000) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="py-1">
          <Link href="/dashboard/perfil" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <UserIcon className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Mi Perfil
          </Link>
          
          <Link href="/dashboard/credito" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <CreditCard className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Mis Créditos
          </Link>

          <Link href="/dashboard/notificaciones" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Bell className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Notificaciones
            <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">5</span>
          </Link>
          
          <Link href="/dashboard/plan" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Calendar className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Mi Plan
            <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/20 dark:text-primary-300">{user?.plan === 'pro' ? 'Pro' : 'Básico'}</span>
          </Link>
          
          <Link href="/dashboard/privacidad" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Shield className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Privacidad
          </Link>

          <Link href="/dashboard/configuracion" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Settings className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Configuración
          </Link>

          <Link href="/dashboard/redes-sociales" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Share2 className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Redes Sociales
          </Link>

          <Link href="/dashboard/medios-de-comunicacion" className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700">
            <Radio className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
            Medios de Comunicación
          </Link>

          <button
            onClick={handleLogout}
            className="menu-item flex w-full items-center px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
          >
            <LogOut className="mr-3 h-4 w-4 text-red-500 dark:text-red-400" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
