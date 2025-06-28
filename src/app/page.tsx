"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronLeft, ChevronRight, Play, Shield, TrendingUp, Users, Zap, CheckCircle, Star, ArrowRight, Activity, BarChart3 } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Slides del hero
const heroSlides = [
  {
    id: 1,
    title: "Monitorea tu presencia digital",
    subtitle: "Análisis en tiempo real de tu reputación online",
    description: "Controla lo que dicen de ti en redes sociales, noticias y blogs con tecnología de inteligencia artificial avanzada.",
    gradient: "from-[#01257D] via-[#013AAA] to-blue-700",
    stats: ["500K+ menciones analizadas", "95% precisión en sentimientos", "24/7 monitoreo"],
    icon: Shield
  },
  {
    id: 2,
    title: "Inteligencia artificial para políticos",
    subtitle: "Dashboard especializado para figuras públicas",
    description: "Herramientas específicas para candidatos, funcionarios y líderes políticos con análisis de tendencias y sentimiento público.",
    gradient: "from-purple-600 via-indigo-600 to-blue-600",
    stats: ["Análisis de campañas", "Tendencias políticas", "Métricas de aprobación"],
    icon: TrendingUp
  },
  {
    id: 3,
    title: "Gestión empresarial de reputación",
    subtitle: "Protege y mejora la imagen de tu marca",
    description: "Soluciones integrales para empresas que buscan mantener una excelente reputación digital y gestionar crisis.",
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    stats: ["Crisis management", "Brand monitoring", "Competitive analysis"],
    icon: Users
  }
];

// Testimonios
const testimonials = [
  {
    name: "María González",
    role: "CEO, TechCorp",
    content: "Reputación Online nos ha ayudado a mantener una imagen impecable. Su IA detecta problemas antes de que se vuelvan crisis.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b977?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
  },
  {
    name: "Carlos Mendoza",
    role: "Candidato al Senado",
    content: "El dashboard político es increíble. Puedo ver en tiempo real cómo reacciona la gente a mis propuestas.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
  },
  {
    name: "Ana Ruiz",
    role: "Directora de Marketing",
    content: "Los reportes automatizados nos ahorran horas de trabajo manual. La precisión del análisis de sentimientos es impresionante.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80"
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  // Auto-play del slider
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000); // Aumentado a 8 segundos para mejor visualización
    
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Animaciones GSAP
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ctx = gsap.context(() => {
      // Animación de stats con contador
      if (statsRef.current) {
        gsap.fromTo(".stat-number", 
          { textContent: 0 },
          {
            textContent: (i: number, el: Element) => el.getAttribute('data-target'),
            duration: 2,
            ease: "power2.out",
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // Animación de features
      if (featuresRef.current) {
        gsap.fromTo(".feature-card",
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
      }

      // Animación de testimonials
      if (testimonialsRef.current) {
        gsap.fromTo(".testimonial-card",
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1,
            stagger: 0.3,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: testimonialsRef.current,
              start: "top 80%",
              toggleActions: "play none none none"
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 15000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/reputacion-online-logo.png" 
              alt="ROL - Reputación Online" 
              className="h-10 w-auto"
            />
            <h1 className="ml-3 text-2xl font-bold text-gray-900 dark:text-white">Reputación Online</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="inline-flex items-center justify-center rounded-md border border-[#01257D] bg-transparent px-4 py-2 text-sm font-medium text-[#01257D] hover:bg-[#01257D] hover:text-white transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#01257D] px-4 py-2 text-sm font-medium text-white hover:bg-[#013AAA] transition-colors">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Slider Section */}
      <section ref={heroRef} className="relative h-[60vh] md:h-[65vh] flex items-center overflow-hidden rounded-b-lg shadow-lg">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].gradient}`}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-white lg:col-span-7"
                >
                  <motion.h1 
                    className="text-4xl md:text-6xl xl:text-7xl font-bold mb-6 leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {heroSlides[currentSlide].title}
                  </motion.h1>
                  
                  <motion.h2 
                    className="text-lg md:text-xl xl:text-2xl mb-6 text-blue-100 font-medium"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    {heroSlides[currentSlide].subtitle}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-base md:text-lg xl:text-xl mb-8 text-gray-100 max-w-2xl leading-relaxed"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    {heroSlides[currentSlide].description}
                  </motion.p>
                  
                  <motion.div 
                    className="flex flex-wrap gap-3 mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                  >
                    {heroSlides[currentSlide].stats.map((stat, index) => (
                      <div key={index} className="flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                        <CheckCircle className="w-4 h-4 text-green-300" />
                        <span className="text-sm font-medium">{stat}</span>
                      </div>
                    ))}
                  </motion.div>
                  
                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                  >
                    <Link 
                      href="/register" 
                      className="group inline-flex items-center justify-center bg-white text-[#01257D] px-8 py-3 rounded-lg font-semibold text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Comenzar Gratis
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link 
                      href="/demo" 
                      className="group inline-flex items-center justify-center border-2 border-white text-white px-8 py-3 rounded-lg font-semibold text-base hover:bg-white hover:text-[#01257D] transition-all duration-300"
                    >
                      <Play className="mr-2 w-5 h-5" />
                      Ver Demo
                    </Link>
                  </motion.div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="relative lg:block hidden lg:col-span-5"
                >
                  <div className="relative bg-white/10 backdrop-blur-lg rounded-lg p-5 border border-white/15 shadow-xl">
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-lg font-bold text-xs animate-pulse shadow-lg">
                      🔥 En Vivo
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-200 font-medium">Dashboard en Tiempo Real</div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-300 font-semibold">ONLINE</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="bg-gradient-to-r from-green-500/15 to-emerald-500/15 rounded-lg p-3 border border-green-400/20">
                          <div className="text-xs text-green-100 mb-1 font-medium">Sentimiento Positivo</div>
                          <div className="text-2xl font-bold text-green-300">87%</div>
                          <div className="text-xs text-green-200 mt-1">↑ +5% hoy</div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-lg p-3 border border-blue-400/20">
                          <div className="text-xs text-blue-100 mb-1 font-medium">Menciones Hoy</div>
                          <div className="text-2xl font-bold text-blue-300">1,247</div>
                          <div className="text-xs text-blue-200 mt-1">↑ +12% vs ayer</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-lg p-3 border border-purple-400/20">
                          <div className="text-xs text-purple-100 mb-1 font-medium">Alcance Total</div>
                          <div className="text-2xl font-bold text-purple-300">2.5M</div>
                          <div className="text-xs text-purple-200 mt-1">↑ +8% esta semana</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Controles del slider */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 z-20">
          <button
            onClick={prevSlide}
            className="p-2 bg-black/25 backdrop-blur-sm rounded-md text-white hover:bg-black/40 transition-all duration-200 border border-white/15"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex gap-2">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-200 rounded-full ${
                  index === currentSlide 
                    ? 'w-6 h-2 bg-white' 
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            className="p-2 bg-black/25 backdrop-blur-sm rounded-md text-white hover:bg-black/40 transition-all duration-200 border border-white/15"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
      
      {/* Engagement y Métricas Interactivas */}
      <section ref={statsRef} className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Engagement que <span className="text-[#01257D]">Impulsa Resultados</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Métricas en tiempo real que transforman datos en decisiones estratégicas
            </motion.p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl md:text-5xl font-bold text-[#01257D] mb-2">
                <span className="stat-number" data-target="500">0</span>K+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Menciones Analizadas</div>
              <div className="text-green-500 text-sm mt-2">↑ +25% este mes</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl md:text-5xl font-bold text-[#01257D] mb-2">
                <span className="stat-number" data-target="95">0</span>%
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Precisión IA</div>
              <div className="text-green-500 text-sm mt-2">Certificado ISO</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl md:text-5xl font-bold text-[#01257D] mb-2">
                <span className="stat-number" data-target="24">0</span>/7
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Monitoreo Continuo</div>
              <div className="text-blue-500 text-sm mt-2">Sin interrupciones</div>
            </div>
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-4xl md:text-5xl font-bold text-[#01257D] mb-2">
                <span className="stat-number" data-target="1200">0</span>+
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Clientes Satisfechos</div>
              <div className="text-green-500 text-sm mt-2">⭐ 4.9/5 rating</div>
            </div>
          </div>

          {/* Métricas de Engagement */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Engagement Rate por Plataforma
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{background: `conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 ${87 * 3.6}deg, #e5e7eb ${87 * 3.6}deg, #e5e7eb 360deg)`}}></div>
                  <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">87%</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">X (Twitter)</h4>
                <p className="text-gray-600 dark:text-gray-400">Engagement promedio</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-purple-600" style={{background: `conic-gradient(from 0deg, #ec4899 0deg, #ec4899 ${92 * 3.6}deg, #e5e7eb ${92 * 3.6}deg, #e5e7eb 360deg)`}}></div>
                  <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-pink-600">92%</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Instagram</h4>
                <p className="text-gray-600 dark:text-gray-400">Engagement promedio</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-blue-700" style={{background: `conic-gradient(from 0deg, #2563eb 0deg, #2563eb ${78 * 3.6}deg, #e5e7eb ${78 * 3.6}deg, #e5e7eb 360deg)`}}></div>
                  <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-700">78%</span>
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Facebook</h4>
                <p className="text-gray-600 dark:text-gray-400">Engagement promedio</p>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center bg-gradient-to-r from-[#01257D] to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
              >
                Ver Mis Métricas
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Características <span className="text-[#01257D]">Innovadoras</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Potencia tu reputación digital con herramientas de inteligencia artificial de última generación
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enhancedFeatures.map((feature, index) => (
              <div
                key={index}
                className="feature-card group bg-white dark:bg-gray-700 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-600 hover:border-[#01257D]/20"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-[#01257D] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Interactivo */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#01257D] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Explora el <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Dashboard en Vivo</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto"
            >
              Interactúa con una versión real de nuestro dashboard y descubre cómo transformamos datos en insights accionables
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-1 border border-white/10 shadow-2xl">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6">
                {/* Header del Dashboard */}
                <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Dashboard Demo</h3>
                      <p className="text-gray-400 text-sm">Datos en tiempo real</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm font-semibold">EN VIVO</span>
                  </div>
                </div>

                {/* Grid de Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                      </div>
                      <span className="text-green-400 text-sm font-semibold">+12%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">2,847</div>
                    <div className="text-gray-400 text-sm">Menciones Hoy</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-green-400" />
                      </div>
                      <span className="text-green-400 text-sm font-semibold">89%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">Positivo</div>
                    <div className="text-gray-400 text-sm">Sentimiento</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <span className="text-green-400 text-sm font-semibold">+8%</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">1.2M</div>
                    <div className="text-gray-400 text-sm">Alcance Total</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="text-green-400 text-sm font-semibold">Real-time</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">94.2%</div>
                    <div className="text-gray-400 text-sm">Engagement</div>
                  </div>
                </div>

                {/* Simulación de Gráfico */}
                <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Análisis de Sentimientos - Últimas 24h</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Comentarios Positivos</span>
                      <div className="flex items-center gap-3">
                        <div className="w-40 bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '87%'}}></div>
                        </div>
                        <span className="text-green-400 font-semibold">87%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Comentarios Neutrales</span>
                      <div className="flex items-center gap-3">
                        <div className="w-40 bg-gray-700 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '8%'}}></div>
                        </div>
                        <span className="text-yellow-400 font-semibold">8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Comentarios Negativos</span>
                      <div className="flex items-center gap-3">
                        <div className="w-40 bg-gray-700 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{width: '5%'}}></div>
                        </div>
                        <span className="text-red-400 font-semibold">5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menciones Recientes */}
                <div className="bg-gray-800/50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Menciones Recientes</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">X</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">@usuario_ejemplo</span>
                          <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">Positivo</span>
                          <span className="text-gray-400 text-xs">hace 2 min</span>
                        </div>
                        <p className="text-gray-300 text-sm">¡Excelente servicio! La plataforma de monitoreo es increíble 🚀</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">IG</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">@influencer_digital</span>
                          <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">Positivo</span>
                          <span className="text-gray-400 text-xs">hace 5 min</span>
                        </div>
                        <p className="text-gray-300 text-sm">Recomiendo totalmente esta herramienta para gestionar reputación ⭐</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="text-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link 
                href="/register" 
                className="group bg-gradient-to-r from-[#01257D] to-blue-600 text-white px-10 py-4 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                🎯 Crear Mi Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/demo" 
                className="group border-2 border-white/30 text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center"
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Demo Completa
              </Link>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-6 text-gray-400"
            >
              ✨ Dashboard completamente funcional en menos de 5 minutos
            </motion.p>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-20 bg-gradient-to-br from-[#01257D] to-[#013AAA]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Lo que dicen nuestros <span className="text-yellow-300">clientes</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-blue-100 max-w-3xl mx-auto"
            >
              Casos de éxito reales de empresas y figuras públicas que confían en nosotros
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="testimonial-card bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-300 fill-current" />
                  ))}
                </div>
                <p className="text-white mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-blue-200 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes y Precios */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Planes que se <span className="text-[#01257D]">Adaptan a Ti</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Desde startups hasta grandes corporaciones, tenemos el plan perfecto para tu reputación digital
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Básico */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 border border-gray-200 dark:border-gray-600"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Básico</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Ideal para personas y pequeños negocios</p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  $29<span className="text-lg text-gray-500">/mes</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">Facturación mensual</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Hasta 1,000 menciones/mes
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  3 plataformas sociales
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Análisis de sentimientos básico
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Reportes semanales
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Soporte por email
                </li>
              </ul>
              <Link 
                href="/register?plan=basic" 
                className="w-full bg-gray-900 dark:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors text-center block"
              >
                Comenzar Gratis
              </Link>
            </motion.div>

            {/* Plan Profesional - Destacado */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-gradient-to-br from-[#01257D] to-blue-600 rounded-2xl p-8 transform scale-105 relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                  🔥 Más Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Profesional</h3>
                <p className="text-blue-100 mb-6">Para empresas en crecimiento</p>
                <div className="text-4xl font-bold text-white mb-2">
                  $99<span className="text-lg text-blue-200">/mes</span>
                </div>
                <p className="text-blue-200">Facturación mensual</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  Hasta 10,000 menciones/mes
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  Todas las plataformas
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  IA avanzada + análisis competitivo
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  Reportes diarios + alertas en tiempo real
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  Soporte prioritario 24/7
                </li>
                <li className="flex items-center text-white">
                  <CheckCircle className="w-5 h-5 text-yellow-300 mr-3 flex-shrink-0" />
                  Dashboard político incluido
                </li>
              </ul>
              <Link 
                href="/register?plan=pro" 
                className="w-full bg-white text-[#01257D] py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center block"
              >
                Comenzar Prueba Gratis
              </Link>
            </motion.div>

            {/* Plan Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 border border-gray-200 dark:border-gray-600"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Para grandes organizaciones</p>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Personalizado
                </div>
                <p className="text-gray-500 dark:text-gray-400">Contactar para precio</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Menciones ilimitadas
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Integración API completa
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  IA personalizada + modelos custom
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Reportes en tiempo real + white label
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Account manager dedicado
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  SLA garantizado 99.9%
                </li>
              </ul>
              <Link 
                href="/contacto" 
                className="w-full bg-gray-900 dark:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors text-center block"
              >
                Contactar Ventas
              </Link>
            </motion.div>
          </div>

          <div className="text-center mt-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-8"
            >
              <Link 
                href="/planes" 
                className="inline-flex items-center justify-center bg-[#01257D] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#013AAA] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Ver Todos los Planes
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              🔒 Todos los planes incluyen encriptación de datos y cumplimiento GDPR
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Cancelación en cualquier momento • Sin compromisos a largo plazo • Prueba gratis de 14 días
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Mejorado */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#01257D] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              ¿Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#01257D] to-purple-400">transformar</span> tu reputación?
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-12"
            >
              Únete a más de 1,200 empresas y figuras públicas que ya confían en nuestra tecnología de IA para proteger y mejorar su imagen digital.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link 
                href="/register" 
                className="group bg-gradient-to-r from-[#01257D] to-purple-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center"
              >
                🚀 Comenzar Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/demo" 
                className="group border-2 border-white text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300 flex items-center"
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Demo en Vivo
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 flex flex-wrap justify-center gap-8 text-gray-400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Sin tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Setup en 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Soporte 24/7</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-lg font-semibold">Reputación Online</h3>
              <p className="mt-4 text-sm text-gray-300">
                La plataforma más completa para el monitoreo y análisis de tu presencia en redes sociales.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Producto</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li><Link href="/features" className="hover:text-[#01257D]">Características</Link></li>
                <li><Link href="/planes" className="hover:text-[#01257D]">Planes y Precios</Link></li>
                <li><Link href="/demo" className="hover:text-[#01257D]">Solicitar Demo</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Recursos</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li><Link href="/blog" className="hover:text-[#01257D]">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-[#01257D]">Guías</Link></li>
                <li><Link href="/support" className="hover:text-[#01257D]">Soporte</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Empresa</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                <li><Link href="/about" className="hover:text-[#01257D]">Sobre Nosotros</Link></li>
                <li><Link href="/contact" className="hover:text-[#01257D]">Contacto</Link></li>
                <li><Link href="/privacy" className="hover:text-[#01257D]">Política de Privacidad</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-gray-400 mb-4 md:mb-0">
                <p>© {new Date().getFullYear()} Reputación Online. Todos los derechos reservados.</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Sistema operativo</span>
                </div>
                <div className="text-sm text-gray-400">
                  <span>Powered by IA avanzada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Features mejoradas con más detalles
const enhancedFeatures = [
  {
    title: 'IA Avanzada de Análisis',
    description: 'Algoritmos de machine learning que analizan sentimientos, tendencias y patrones en tiempo real.',
    icon: Shield,
    gradient: 'from-blue-500 to-purple-600',
    benefits: ['Precisión del 95%', 'Análisis multiidioma', 'Detección de sarcasmo']
  },
  {
    title: 'Dashboard Político',
    description: 'Herramientas especializadas para candidatos, funcionarios y líderes políticos.',
    icon: TrendingUp,
    gradient: 'from-purple-500 to-pink-600',
    benefits: ['Métricas de aprobación', 'Análisis de campañas', 'Tendencias electorales']
  },
  {
    title: 'Monitoreo 24/7',
    description: 'Vigilancia continua de todas las plataformas digitales sin interrupciones.',
    icon: Zap,
    gradient: 'from-green-500 to-teal-600',
    benefits: ['Alertas instantáneas', 'Cobertura global', 'API en tiempo real']
  },
  {
    title: 'Gestión de Crisis',
    description: 'Detecta y responde a crisis de reputación antes de que se propaguen.',
    icon: Shield,
    gradient: 'from-red-500 to-orange-600',
    benefits: ['Detección temprana', 'Planes de respuesta', 'Escalado automático']
  },
  {
    title: 'Análisis Competitivo',
    description: 'Compara tu rendimiento con competidores y líderes de la industria.',
    icon: Users,
    gradient: 'from-indigo-500 to-blue-600',
    benefits: ['Benchmarking', 'Oportunidades', 'Insights estratégicos']
  },
  {
    title: 'Reportes Inteligentes',
    description: 'Informes automatizados con insights accionables y recomendaciones personalizadas.',
    icon: TrendingUp,
    gradient: 'from-yellow-500 to-orange-600',
    benefits: ['Automatización', 'Insights accionables', 'Exportación múltiple']
  }
];
