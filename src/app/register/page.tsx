"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Check, Building, UserCheck, UserCog } from 'lucide-react';
import gsap from 'gsap';
import { fadeInUp, staggerFadeIn, createTimeline } from '../../lib/gsap-animations';
import { aiPatternLearning, aiDataAnalysis, aiDecisionMaking, aiAdaptiveInterface } from '../../lib/ai-animations';
import AnimatedBackground from '../../components/ui/AnimatedBackground';

export default function RegisterPage() {
  // Estados para manejar la entrada de usuario
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [aceptarTerminos, setAceptarTerminos] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [paso, setPaso] = useState(1); // Para el proceso de registro en 2 pasos
  const [tipoPerfil, setTipoPerfil] = useState<'personal'|'political'>('personal'); // Tipo de perfil: personal o político
  const [plan, setPlan] = useState('basic'); // Plan seleccionado
  
  // Referencias para animaciones
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Función para validar el correo electrónico
  const esEmailValido = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Función para validar la contraseña
  const esPasswordValida = (password: string) => {
    return password.length >= 8; // Criterio mínimo
  };

  // Inicializar animaciones
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const tl = createTimeline({ defaults: { ease: 'power3.out' } });
    
    // Animar título y logo con efecto "inteligente"
    if (titleRef.current) {
      tl.from(titleRef.current, {
        opacity: 0, 
        y: -20, 
        duration: 0.6,
        clearProps: 'all'
      });
    }
    
    // Animar subtítulo con efecto de aparición gradual
    if (subtitleRef.current) {
      tl.from(subtitleRef.current, {
        opacity: 0, 
        filter: 'blur(5px)',
        duration: 0.7,
        clearProps: 'all'
      }, '-=0.3');
    }
    
    // Animar características con un efecto de análisis de datos de IA
    if (featuresRef.current && featuresRef.current.children.length > 0) {
      const features = Array.from(featuresRef.current.children);
      aiDataAnalysis(features, {
        delay: 0.2
      });
    }
    
    // Animar formulario con efecto básico
    if (formRef.current) {
      tl.from(formRef.current, {
        opacity: 0,
        y: 15,
        duration: 0.4,
        clearProps: 'all'
      });
    }
    
    return () => {
      tl.kill();
    };
  }, []); // Sin dependencias para evitar re-renderizados infinitos

  // Función para manejar el envío del formulario del primer paso
  const handlePaso1 = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!nombre || !email || !password || !confirmarPassword || !tipoPerfil) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }
    
    if (!esEmailValido(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    
    if (!esPasswordValida(password)) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Avanzar al siguiente paso si todo está bien
    setError('');
    setPaso(2);
  };

  // Función para manejar el envío del formulario completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!empresa) {
      setError('Por favor ingresa el nombre de tu empresa');
      return;
    }
    
    if (!aceptarTerminos) {
      setError('Debes aceptar los términos y condiciones para continuar');
      return;
    }
    
    // Registro con API calls a Prisma
    setCargando(true);
    setError('');
    
    try {
      const requestData = {
        email,
        password,
        name: nombre,
        company: empresa,
        profileType: tipoPerfil,
        role: 'user',
        plan,
        credits: plan === 'basic' ? 500 : plan === 'pro' ? 5000 : 10000,
        onboardingCompleted: false,
      };
      
      // Usar API endpoint correcto para registro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // No guardar en localStorage inmediatamente
        // Mostrar mensaje de éxito y redirigir al login
        alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
        
        // Redirección al login para flujo correcto de autenticación
        window.location.href = '/login';
      } else {
        setError(data.message || 'Error al crear la cuenta. Inténtalo nuevamente.');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Panel lateral - Solo visible en pantallas medianas y grandes */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-[#01257D] to-[#013AAA] md:block">
        <AnimatedBackground 
          className="opacity-40" 
          particleColor="rgba(255, 255, 255, 0.6)" 
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div
            ref={titleRef}
            className="mb-8 flex items-center"
          >
            <div className="mr-3">
              <img 
                src="/reputacion-online-logo.png" 
                alt="ROL - Reputación Online" 
                className="h-12 w-auto"
              />
            </div>
            <h1 className="text-3xl font-bold">Reputación Online</h1>
          </div>
          
          <h2 
            ref={subtitleRef}
            className="mb-6 text-center text-2xl font-light"
          >
            Crea tu cuenta y descubre el poder de la gestión de reputación profesional
          </h2>
          
          <div
            ref={featuresRef}
            className="mt-4 space-y-4"
          >
            <div className="rounded-lg bg-white bg-opacity-10 p-4">
              <div className="mb-2 flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-400" />
                <h3 className="text-lg font-medium">Plan Básico Gratuito</h3>
              </div>
              <ul className="ml-7 list-disc space-y-1 text-sm">
                <li>500 créditos de bienvenida</li>
                <li>Monitoreo básico de menciones</li>
                <li>Análisis de sentimiento</li>
                <li>Soporte por correo electrónico</li>
              </ul>
            </div>
            
            <p className="text-center text-sm">
              Al registrarte, recibirás créditos de bienvenida para que puedas comenzar a utilizar nuestra plataforma inmediatamente.
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white text-opacity-70">
          2025 Reputación Online. Todos los derechos reservados.
        </div>
      </div>
      
      {/* Formulario de registro */}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Crear una cuenta</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {paso === 1 ? 'Comienza con tus datos personales' : `Un paso más para completar tu registro de ${tipoPerfil === 'political' ? 'perfil político' : 'persona natural'}`}
            </p>
          </div>
          
          {/* Indicador de pasos */}
          <div className="relative mx-auto mt-4 w-full max-w-xs">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 transform bg-gray-200 dark:bg-gray-700"></div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${paso >= 1 ? 'bg-[#01257D] text-white dark:bg-[#013AAA]' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                  <span className="text-sm font-medium">1</span>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">Cuenta</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full ${paso >= 2 ? 'bg-[#01257D] text-white dark:bg-[#013AAA]' : 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'}`}>
                  <span className="text-sm font-medium">2</span>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">Detalles</span>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}
          
          {paso === 1 ? (
            <form className="mt-8 space-y-6" onSubmit={handlePaso1}>
              <div className="space-y-4">
                {/* Selector de tipo de perfil */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de perfil <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setTipoPerfil('personal')}
                    className={`cursor-pointer rounded-lg border-2 ${tipoPerfil === 'personal' 
                      ? 'border-[#01257D] bg-blue-50 dark:bg-blue-900/20 dark:border-[#01257D]' 
                      : 'border-gray-200 dark:border-gray-700'} 
                      p-4 flex flex-col items-center justify-center transition-colors hover:border-[#01257D]/50`}
                  >
                    <UserCheck className={`h-8 w-8 mb-2 ${tipoPerfil === 'personal' ? 'text-[#01257D]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${tipoPerfil === 'personal' ? 'text-[#01257D] dark:text-[#01257D]' : 'text-gray-600 dark:text-gray-400'}`}>Persona Natural</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Individuos y profesionales</p>
                  </div>
                  
                  <div 
                    onClick={() => setTipoPerfil('political')}
                    className={`cursor-pointer rounded-lg border-2 ${tipoPerfil === 'political' 
                      ? 'border-[#01257D] bg-blue-50 dark:bg-blue-900/20 dark:border-[#01257D]' 
                      : 'border-gray-200 dark:border-gray-700'} 
                      p-4 flex flex-col items-center justify-center transition-colors hover:border-[#01257D]/50`}
                  >
                    <UserCog className={`h-8 w-8 mb-2 ${tipoPerfil === 'political' ? 'text-[#01257D]' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${tipoPerfil === 'political' ? 'text-[#01257D] dark:text-[#01257D]' : 'text-gray-600 dark:text-gray-400'}`}>Político</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">Candidatos y figuras políticas</p>
                  </div>
                </div>
              </div>

              <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      autoComplete="name"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-3 pl-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico <span className="text-red-500">*</span>
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
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-3 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Mínimo 8 caracteres"
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
                
                <div>
                  <label htmlFor="confirmar-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmar-password"
                      name="confirmar-password"
                      type={mostrarConfirmarPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      className="block w-full rounded-md border-gray-300 py-3 pl-10 pr-10 placeholder-gray-400 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      placeholder="Confirma tu contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                      onClick={() => setMostrarConfirmarPassword(!mostrarConfirmarPassword)}
                    >
                      {mostrarConfirmarPassword ? (
                        <EyeOff className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="step-button step-option flex w-full items-center justify-center rounded-lg bg-[#01257D] px-5 py-3 text-center text-base font-medium text-white hover:bg-[#013AAA] focus:ring-4 focus:ring-blue-300"
                  disabled={cargando}
                >
                  {cargando ? 'Procesando...' : 'Continuar'}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {tipoPerfil === 'political' ? 'Partido político o movimiento' : 'Nombre de empresa o marca'} <span className="text-red-500">*</span>
                </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="empresa"
                  name="empresa"
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-gray-900 placeholder-gray-500 focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-[#01257D] dark:focus:ring-[#01257D]"
                  placeholder={tipoPerfil === 'political' ? 'Nombre del partido político o movimiento' : 'Nombre de tu empresa o marca'}
                />
                  </div>
                </div>
                
                <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-800">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Selecciona tu plan inicial</h3>
                  <div className="mt-3 space-y-3">
                    {/* Plan Básico */}
                    <div className="flex items-start">
                      <input
                        id="plan-basico"
                        name="plan"
                        type="radio"
                        value="basic"
                        defaultChecked
                        className="h-4 w-4 border-gray-300 text-[#01257D] focus:ring-[#01257D]"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <label htmlFor="plan-basico" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Plan Básico - <span className="font-bold text-green-600">Gratuito</span>
                        </label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          • 500 créditos de bienvenida<br/>
                          • Monitoreo básico de menciones<br/>
                          • Análisis de sentimiento<br/>
                          • Soporte por correo electrónico
                        </div>
                      </div>
                    </div>

                    {/* Plan Pro */}
                    <div className="flex items-start">
                      <input
                        id="plan-pro"
                        name="plan"
                        type="radio"
                        value="pro"
                        className="h-4 w-4 border-gray-300 text-[#01257D] focus:ring-[#01257D]"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <label htmlFor="plan-pro" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Plan Pro - <span className="font-bold text-blue-600">$49.99/mes</span>
                        </label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          • 5,000 créditos mensuales<br/>
                          • Monitoreo avanzado en tiempo real<br/>
                          • Análisis de IA y tendencias<br/>
                          • Reportes personalizados<br/>
                          • Soporte prioritario
                        </div>
                      </div>
                    </div>

                    {/* Plan Enterprise */}
                    <div className="flex items-start">
                      <input
                        id="plan-enterprise"
                        name="plan"
                        type="radio"
                        value="enterprise"
                        className="h-4 w-4 border-gray-300 text-[#01257D] focus:ring-[#01257D]"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <label htmlFor="plan-enterprise" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Plan Enterprise - <span className="font-bold text-purple-600">$149.99/mes</span>
                        </label>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          • Créditos ilimitados<br/>
                          • Monitoreo global multi-idioma<br/>
                          • API personalizada<br/>
                          • Analítica predictiva con IA<br/>
                          • Account manager dedicado
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="terminos"
                      name="terminos"
                      type="checkbox"
                      checked={aceptarTerminos}
                      onChange={(e) => setAceptarTerminos(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#01257D] focus:ring-[#01257D]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terminos" className="font-medium text-gray-700 dark:text-gray-300">
                      Acepto los <a href="#" className="text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]">Términos y Condiciones</a> y la <a href="#" className="text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]">Política de Privacidad</a> <span className="text-red-500">*</span>
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Al registrarme, acepto recibir comunicaciones y actualizaciones sobre el servicio.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between space-x-4">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaso(1);
                  }}
                  className="flex w-full items-center justify-center rounded-lg bg-gray-200 px-5 py-3 text-center text-base font-medium text-gray-700 hover:bg-gray-300 focus:ring-4 focus:ring-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                >
                  Volver
                </button>
                
                <button
                  type="submit"
                  disabled={cargando}
                  className="step-button step-option flex w-full items-center justify-center rounded-lg bg-[#01257D] px-5 py-3 text-center text-base font-medium text-white hover:bg-[#013AAA] focus:ring-4 focus:ring-blue-300"
                >
                  {cargando ? (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </span>
                  ) : (
                    'Completar registro'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divisor */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">O regístrate con</span>
              </div>
            </div>
          </div>

          {/* Botones de Redes Sociales */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-red-300 bg-white hover:bg-red-50 py-2 px-4 text-sm font-medium text-red-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              onClick={() => {
                // TODO: Implementar registro con Google
                alert('Registro con Google - Próximamente disponible');
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
                // TODO: Implementar registro con Facebook
                alert('Registro con Facebook - Próximamente disponible');
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
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium text-[#01257D] hover:text-[#013AAA] dark:text-[#01257D]">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
