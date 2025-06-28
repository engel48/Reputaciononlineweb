"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { fadeInUp, staggerFadeIn, createTimeline } from '../../lib/gsap-animations';
import { aiPatternLearning, aiRecognitionResponse, aiNeuralConnections } from '../../lib/ai-animations';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function LoginPage() {
  // Estados para manejar la entrada de usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [intentosLogin, setIntentosLogin] = useState(0);
  const [bloqueadoHasta, setBloqueadoHasta] = useState<Date | null>(null);
  const [exitoLogin, setExitoLogin] = useState(false);
  
  // Referencias para animaciones
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Inicializar animaciones
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const tl = createTimeline({ defaults: { ease: 'power3.out' } });
    
    // Animar título y logo con efecto "inteligente"
    if (titleRef.current) {
      tl.from(titleRef.current, {
        opacity: 0, 
        y: -20, 
        duration: 0.7,
        clearProps: 'all'
      });
    }
    
    // Animar subtítulo con efecto adaptativo
    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        opacity: 0, 
        filter: 'blur(8px)',
        duration: 0.8,
        clearProps: 'all'
      }, '-=0.4');
    }
    
    // Animar características con efecto de IA de reconocimiento de patrones
    if (featuresRef.current && featuresRef.current.children.length > 0) {
      aiPatternLearning(featuresRef.current, '*', {
        delay: 0.3
      });
    }
    
    // Animar formulario con efecto "inteligente" de reconocimiento
    if (formRef.current) {
      const formInputs = formRef.current.querySelectorAll('input');
      const formLabels = formRef.current.querySelectorAll('label');
      const formButtons = formRef.current.querySelectorAll('button');
      
      tl.from(formRef.current, {
        opacity: 0, 
        scale: 0.95, 
        duration: 0.5,
        clearProps: 'all'
      }, '-=0.2');
      
      // Simulación de análisis de campos - delay reducido para menor lag
      aiNeuralConnections(Array.from(formLabels), Array.from(formInputs), {
        delay: 0.2
      });
      
      // Simulación de respuesta de IA al formulario - delay reducido
      aiRecognitionResponse(formRef.current, Array.from(formButtons), {
        delay: 0.4
      });
    }
    
    return () => {
      tl.kill();
    };
  }, []);

  // Verificar si está bloqueado por intentos fallidos
  const estaBloquedo = () => {
    if (!bloqueadoHasta) return false;
    return new Date() < bloqueadoHasta;
  };

  // Función mejorada para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar bloqueo por intentos fallidos
    if (estaBloquedo()) {
      const tiempoRestante = Math.ceil((bloqueadoHasta!.getTime() - new Date().getTime()) / 1000);
      setError(`Demasiados intentos fallidos. Intenta de nuevo en ${tiempoRestante} segundos.`);
      return;
    }
    
    // Validación mejorada
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    
    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Autenticación con API de Prisma - con reintentos y mejor manejo de errores
    try {
      setCargando(true);
      setError('');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim().toLowerCase(), 
          password,
          recordarme 
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        // Login exitoso - resetear intentos
        setIntentosLogin(0);
        setBloqueadoHasta(null);
        setExitoLogin(true);
        
        // Mostrar mensaje de éxito brevemente
        setTimeout(() => {
          // Redirección basada en onboarding y tipo de perfil
          if (data.user.onboardingCompleted) {
            // Redireccionar según el tipo de perfil
            if (data.user.profileType === 'political') {
              window.location.href = '/dashboard-politico';
            } else {
              window.location.href = '/dashboard';
            }
          } else {
            window.location.href = '/onboarding';
          }
        }, 500);
        
      } else {
        // Login fallido - incrementar intentos
        const nuevosIntentos = intentosLogin + 1;
        setIntentosLogin(nuevosIntentos);
        
        // Bloquear después de 5 intentos fallidos
        if (nuevosIntentos >= 5) {
          const bloqueoHasta = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos
          setBloqueadoHasta(bloqueoHasta);
          setError('Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.');
        } else {
          const intentosRestantes = 5 - nuevosIntentos;
          setError(`${data.message || 'Credenciales incorrectas.'} Te quedan ${intentosRestantes} intentos.`);
        }
      }
    } catch (err: any) {
      console.error('Error de autenticación:', err);
      
      if (err.name === 'AbortError') {
        setError('La conexión tardó demasiado. Por favor intenta de nuevo.');
      } else if (err.message?.includes('Failed to fetch')) {
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        setError('Error al iniciar sesión. Por favor intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Panel lateral - Solo visible en pantallas medianas y grandes */}
      <div className="relative hidden w-1/2 bg-[#01257D] md:block">
        <AnimatedBackground 
          className="opacity-40" 
          particleColor="rgba(255, 255, 255, 0.6)" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div
            ref={titleRef}
            className="mb-8 flex flex-col items-center text-center"
          >
            {/* Logo ROL */}
            <div className="mb-6">
              <img 
                src="/reputacion-online-logo.png" 
                alt="ROL - Reputación Online" 
                className="h-20 w-auto"
              />
            </div>
          </div>
          
          <h2 
            ref={subtitleRef}
            className="text-center text-xl font-light leading-relaxed max-w-md"
          >
            Monitorea, analiza, gestiona y protege tu Reputación Online
          </h2>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white text-opacity-70">
          2025 Reputación Online. Todos los derechos reservados.
        </div>
      </div>
      
      {/* Formulario de inicio de sesión */}
      <div className="flex w-full items-center justify-center px-4 md:w-1/2 md:px-0">
        <div 
          ref={formRef}
          className="w-full max-w-md space-y-8 p-8"
        >
          {/* Logo solo visible en móviles */}
          <div className="text-center md:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#01257D]">
              <div className="h-8 w-8 rounded-full bg-white"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reputación Online</h1>
            <p className="text-gray-500 dark:text-gray-400">Gestiona tu presencia digital</p>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Iniciar Sesión</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Accede a tu cuenta para gestionar tu reputación online
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-3 pl-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={mostrarPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md border-gray-300 py-3 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                  >
                    {mostrarPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="recordarme"
                  name="recordarme"
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700"
                />
                <label htmlFor="recordarme" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Recordarme
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={cargando || estaBloquedo() || exitoLogin}
                className={`group relative flex w-full justify-center rounded-md border border-transparent py-3 px-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:ring-offset-2 transition-all duration-200 ${
                  cargando || estaBloquedo() || exitoLogin
                    ? 'bg-gray-400 cursor-not-allowed'
                    : exitoLogin
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#01257D] hover:bg-[#013AAA] text-white'
                } dark:bg-[#01257D] dark:hover:bg-[#013AAA]`}
              >
                {cargando ? (
                  <span className="flex items-center text-white">
                    <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : exitoLogin ? (
                  <span className="flex items-center text-white">
                    <svg className="mr-2 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ¡Exitoso!
                  </span>
                ) : estaBloquedo() ? (
                  <span className="text-gray-600">Cuenta Bloqueada</span>
                ) : (
                  <span className="text-white">Iniciar Sesión</span>
                )}
              </button>
            </div>
          </form>

          {/* Divisor */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">O continúa con</span>
              </div>
            </div>
          </div>

          {/* Botones de Redes Sociales */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-red-300 bg-white hover:bg-red-50 py-2 px-4 text-sm font-medium text-red-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={() => {
                // TODO: Implementar login con Google
                alert('Login con Google - Próximamente disponible');
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-blue-600 bg-blue-600 hover:bg-blue-700 py-2 px-4 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => {
                // TODO: Implementar login con Facebook
                alert('Login con Facebook - Próximamente disponible');
              }}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="ml-2">Facebook</span>
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link href="/register" className="font-medium text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
