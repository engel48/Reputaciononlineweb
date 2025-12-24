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
    <div className="flex min-h-screen bg-[#0B1120]">
      {/* Panel lateral - Solo visible en pantallas medianas y grandes */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-[#0B1120] to-[#151C2E] md:block">
        <AnimatedBackground
          className="opacity-40"
          particleColor="rgba(0, 229, 255, 0.4)"
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
            <div className="rounded-xl bg-white/5 border border-[#00E5FF]/20 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center">
                <div className="mr-3 w-8 h-8 rounded-lg bg-[#00E5FF]/20 flex items-center justify-center">
                  <Check className="h-4 w-4 text-[#00E5FF]" />
                </div>
                <h3 className="text-lg font-medium">Plan Básico Gratuito</h3>
              </div>
              <ul className="ml-11 space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                  500 créditos de bienvenida
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                  Monitoreo básico de menciones
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                  Análisis de sentimiento
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]"></span>
                  Soporte por correo electrónico
                </li>
              </ul>
            </div>

            <p className="text-center text-sm text-gray-400">
              Al registrarte, recibirás créditos de bienvenida para comenzar a utilizar nuestra plataforma inmediatamente.
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white text-opacity-70">
          2025 Reputación Online. Todos los derechos reservados.
        </div>
      </div>
      
      {/* Formulario de registro */}
      <div className="flex w-full items-center justify-center px-4 md:w-1/2 md:px-0 bg-[#0B1120] overflow-y-auto">
        <div
          ref={formRef}
          className="w-full max-w-md space-y-6 p-8"
        >
          {/* Logo solo visible en móviles */}
          <div className="text-center md:hidden">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00E5FF]/10">
              <span className="text-2xl font-bold text-[#00E5FF]">R</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Reputación Online</h1>
            <p className="text-gray-400">Gestiona tu presencia digital</p>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Crear una cuenta</h2>
            <p className="mt-2 text-sm text-gray-400">
              {paso === 1 ? 'Comienza con tus datos personales' : `Un paso más para completar tu registro de ${tipoPerfil === 'political' ? 'perfil político' : 'persona natural'}`}
            </p>
          </div>
          
          {/* Indicador de pasos */}
          <div className="relative mx-auto mt-4 w-full max-w-xs">
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 transform bg-[#1F2840]"></div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${paso >= 1 ? 'bg-[#00E5FF] text-[#0B1120]' : 'bg-[#1F2840] text-gray-500'}`}>
                  <span className="text-sm font-medium">1</span>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-400">Cuenta</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${paso >= 2 ? 'bg-[#00E5FF] text-[#0B1120]' : 'bg-[#1F2840] text-gray-500'}`}>
                  <span className="text-sm font-medium">2</span>
                </div>
                <span className="mt-2 text-xs font-medium text-gray-400">Detalles</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {paso === 1 ? (
            <form className="mt-6 space-y-5" onSubmit={handlePaso1}>
              <div className="space-y-4">
                {/* Selector de tipo de perfil */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo de perfil <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setTipoPerfil('personal')}
                      className={`cursor-pointer rounded-xl border-2 ${tipoPerfil === 'personal'
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                        : 'border-[#1F2840] bg-[#151C2E]'}
                        p-4 flex flex-col items-center justify-center transition-all hover:border-[#00E5FF]/50`}
                    >
                      <UserCheck className={`h-7 w-7 mb-2 ${tipoPerfil === 'personal' ? 'text-[#00E5FF]' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${tipoPerfil === 'personal' ? 'text-[#00E5FF]' : 'text-gray-400'}`}>Persona Natural</span>
                      <p className="text-xs text-gray-500 text-center mt-1">Individuos y profesionales</p>
                    </div>

                    <div
                      onClick={() => setTipoPerfil('political')}
                      className={`cursor-pointer rounded-xl border-2 ${tipoPerfil === 'political'
                        ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                        : 'border-[#1F2840] bg-[#151C2E]'}
                        p-4 flex flex-col items-center justify-center transition-all hover:border-[#00E5FF]/50`}
                    >
                      <UserCog className={`h-7 w-7 mb-2 ${tipoPerfil === 'political' ? 'text-[#00E5FF]' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${tipoPerfil === 'political' ? 'text-[#00E5FF]' : 'text-gray-400'}`}>Político</span>
                      <p className="text-xs text-gray-500 text-center mt-1">Candidatos y figuras políticas</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-300">
                    Nombre completo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      autoComplete="name"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="block w-full rounded-xl border border-[#1F2840] bg-[#151C2E] py-3 pl-10 text-white placeholder-gray-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Correo electrónico <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-[#1F2840] bg-[#151C2E] py-3 pl-10 text-white placeholder-gray-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Contraseña <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[#1F2840] bg-[#151C2E] py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-[#00E5FF] transition-colors"
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
                  <label htmlFor="confirmar-password" className="block text-sm font-medium text-gray-300">
                    Confirmar contraseña <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="confirmar-password"
                      name="confirmar-password"
                      type={mostrarConfirmarPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      className="block w-full rounded-xl border border-[#1F2840] bg-[#151C2E] py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                      placeholder="Confirma tu contraseña"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-[#00E5FF] transition-colors"
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
                  className="flex w-full items-center justify-center rounded-xl bg-[#00E5FF] px-5 py-3 text-center text-base font-semibold text-[#0B1120] hover:bg-[#00B8D4] focus:ring-4 focus:ring-[#00E5FF]/30 transition-all shadow-[0_4px_20px_rgba(0,229,255,0.3)]"
                  disabled={cargando}
                >
                  {cargando ? 'Procesando...' : 'Continuar'}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-gray-300">
                    {tipoPerfil === 'political' ? 'Partido político o movimiento' : 'Nombre de empresa o marca'} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      id="empresa"
                      name="empresa"
                      type="text"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="block w-full rounded-xl border border-[#1F2840] bg-[#151C2E] py-3 pl-10 text-white placeholder-gray-500 focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-colors"
                      placeholder={tipoPerfil === 'political' ? 'Nombre del partido político o movimiento' : 'Nombre de tu empresa o marca'}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#151C2E] border border-[#1F2840] p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Selecciona tu plan inicial</h3>
                  <div className="space-y-3">
                    {/* Plan Básico */}
                    <label htmlFor="plan-basico" className={`flex items-start p-3 rounded-lg cursor-pointer transition-all ${plan === 'basic' ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30' : 'bg-[#0B1120] border border-[#1F2840] hover:border-[#00E5FF]/20'}`}>
                      <input
                        id="plan-basico"
                        name="plan"
                        type="radio"
                        value="basic"
                        checked={plan === 'basic'}
                        className="h-4 w-4 border-[#1F2840] text-[#00E5FF] focus:ring-[#00E5FF] bg-[#0B1120] mt-0.5"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <span className="text-sm font-medium text-white">
                          Plan Básico - <span className="font-bold text-green-400">Gratuito</span>
                        </span>
                        <p className="text-xs text-gray-500 mt-1">500 créditos • Monitoreo básico • Análisis de sentimiento</p>
                      </div>
                    </label>

                    {/* Plan Pro */}
                    <label htmlFor="plan-pro" className={`flex items-start p-3 rounded-lg cursor-pointer transition-all ${plan === 'pro' ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30' : 'bg-[#0B1120] border border-[#1F2840] hover:border-[#00E5FF]/20'}`}>
                      <input
                        id="plan-pro"
                        name="plan"
                        type="radio"
                        value="pro"
                        checked={plan === 'pro'}
                        className="h-4 w-4 border-[#1F2840] text-[#00E5FF] focus:ring-[#00E5FF] bg-[#0B1120] mt-0.5"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <span className="text-sm font-medium text-white">
                          Plan Pro - <span className="font-bold text-[#00E5FF]">$49.99/mes</span>
                        </span>
                        <p className="text-xs text-gray-500 mt-1">5,000 créditos • Monitoreo avanzado • Análisis IA • Reportes</p>
                      </div>
                    </label>

                    {/* Plan Enterprise */}
                    <label htmlFor="plan-enterprise" className={`flex items-start p-3 rounded-lg cursor-pointer transition-all ${plan === 'enterprise' ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30' : 'bg-[#0B1120] border border-[#1F2840] hover:border-[#00E5FF]/20'}`}>
                      <input
                        id="plan-enterprise"
                        name="plan"
                        type="radio"
                        value="enterprise"
                        checked={plan === 'enterprise'}
                        className="h-4 w-4 border-[#1F2840] text-[#00E5FF] focus:ring-[#00E5FF] bg-[#0B1120] mt-0.5"
                        onChange={(e) => setPlan(e.target.value)}
                      />
                      <div className="ml-3 block">
                        <span className="text-sm font-medium text-white">
                          Plan Enterprise - <span className="font-bold text-purple-400">$149.99/mes</span>
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Créditos ilimitados • API personalizada • Account manager</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="terminos"
                      name="terminos"
                      type="checkbox"
                      checked={aceptarTerminos}
                      onChange={(e) => setAceptarTerminos(e.target.checked)}
                      className="h-4 w-4 rounded border-[#1F2840] bg-[#0B1120] text-[#00E5FF] focus:ring-[#00E5FF]"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terminos" className="font-medium text-gray-300">
                      Acepto los <a href="#" className="text-[#00E5FF] hover:text-[#00B8D4]">Términos y Condiciones</a> y la <a href="#" className="text-[#00E5FF] hover:text-[#00B8D4]">Política de Privacidad</a> <span className="text-red-400">*</span>
                    </label>
                    <p className="text-gray-500 text-xs mt-1">
                      Al registrarme, acepto recibir comunicaciones sobre el servicio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPaso(1);
                  }}
                  className="flex w-full items-center justify-center rounded-xl bg-[#1F2840] px-5 py-3 text-center text-base font-medium text-gray-300 hover:bg-[#2D3A5E] focus:ring-4 focus:ring-[#1F2840] transition-all"
                >
                  Volver
                </button>

                <button
                  type="submit"
                  disabled={cargando}
                  className="flex w-full items-center justify-center rounded-xl bg-[#00E5FF] px-5 py-3 text-center text-base font-semibold text-[#0B1120] hover:bg-[#00B8D4] focus:ring-4 focus:ring-[#00E5FF]/30 transition-all shadow-[0_4px_20px_rgba(0,229,255,0.3)]"
                >
                  {cargando ? (
                    <span className="flex items-center">
                      <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                <div className="w-full border-t border-[#1F2840]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#0B1120] px-3 text-gray-500">O regístrate con</span>
              </div>
            </div>
          </div>

          {/* Botones de Redes Sociales */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#1F2840] bg-[#151C2E] hover:bg-[#1F2840] hover:border-[#00E5FF]/30 py-3 px-4 text-sm font-medium text-gray-300 transition-all"
              onClick={() => {
                alert('Registro con Google - Próximamente disponible');
              }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-xl border border-[#1F2840] bg-[#151C2E] hover:bg-[#1F2840] hover:border-[#00E5FF]/30 py-3 px-4 text-sm font-medium text-gray-300 transition-all"
              onClick={() => {
                alert('Registro con Facebook - Próximamente disponible');
              }}
            >
              <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="ml-2">Facebook</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/login" className="font-medium text-[#00E5FF] hover:text-[#00B8D4] transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
