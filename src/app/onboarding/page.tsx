"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { ChevronLeft, ChevronRight, Check, User, Briefcase, Camera, Users, Sparkles, ArrowRight, Star, Zap, Globe, Shield } from 'lucide-react';
import CategorySelector from '@/components/user/CategorySelector';
import SocialNetworkConnector from '@/components/user/SocialNetworkConnectorFixed';
import ProfilePhotoUploader from '@/components/user/ProfilePhotoUploader';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

// Tipos para SocialConnectionsState
interface SocialConnection {
  connected: boolean;
  username: string;
  displayName: string;
  followers: number;
  profileImage: string;
  lastSync: string | null;
  metrics: {
    posts: number;
    engagement: number;
    reach: number;
  };
}

interface SocialConnectionsState {
  facebook: SocialConnection;
  instagram: SocialConnection;
  x: SocialConnection;
  linkedin: SocialConnection;
  tiktok: SocialConnection;
}

interface CategoryData {
  category: string;
  brandName: string;
  otherCategory: string;
  additionalSources: string[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser, isLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Referencias para animaciones GSAP
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  
  // Estados para los datos del onboarding
  const [basicData, setBasicData] = useState({
    name: user?.name || '',
    company: user?.company || '',
    phone: '',
    bio: ''
  });
  
  const [categoryData, setCategoryData] = useState<CategoryData>({
    category: '',
    brandName: '',
    otherCategory: '',
    additionalSources: []
  });
  
  const [connectedNetworks, setConnectedNetworks] = useState<SocialConnectionsState | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.avatarUrl || null);
  const [erroresValidacion, setErroresValidacion] = useState<{[key: string]: string}>({});
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [error, setError] = useState('');

  // Redirigir si el usuario ya completó el onboarding
  useEffect(() => {
    if (!isLoading && user && user.onboardingCompleted) {
      // Redireccionar según el tipo de perfil
      if (user.profileType === 'political') {
        router.push('/dashboard-politico');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Redirigir al login si no hay usuario
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Animaciones GSAP de entrada
  useEffect(() => {
    if (containerRef.current && headerRef.current && progressRef.current && contentRef.current && buttonsRef.current) {
      const tl = gsap.timeline();
      
      // Animación de entrada
      tl.set([containerRef.current, headerRef.current, progressRef.current, contentRef.current, buttonsRef.current], { opacity: 0, y: 50 })
        .to(containerRef.current, { duration: 0.8, opacity: 1, ease: "easeOut" })
        .to(headerRef.current, { duration: 0.6, opacity: 1, y: 0, ease: "back.out" }, "-=0.4")
        .to(progressRef.current, { duration: 0.6, opacity: 1, y: 0, ease: "easeOut" }, "-=0.3")
        .to(contentRef.current, { duration: 0.7, opacity: 1, y: 0, ease: "easeOut" }, "-=0.2")
        .to(buttonsRef.current, { duration: 0.5, opacity: 1, y: 0, ease: "easeOut" }, "-=0.1");
      
      // Animación de partículas flotantes
      const particles = document.querySelectorAll('.floating-particle');
      particles.forEach((particle, index) => {
        gsap.to(particle, {
          duration: 3 + index * 0.5,
          y: -20,
          rotation: 360,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2
        });
      });
    }
  }, []);

  // Animaciones al cambiar de paso
  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current.children, 
        { opacity: 0, x: 50, scale: 0.95 },
        { duration: 0.6, opacity: 1, x: 0, scale: 1, stagger: 0.1, ease: "easeOut" }
      );
    }
  }, [currentStep]);

  const steps = [
    {
      id: 1,
      title: 'Datos Básicos',
      description: 'Completa tu información personal',
      icon: User,
      component: 'basic'
    },
    {
      id: 2,
      title: 'Categoría de Perfil',
      description: 'Selecciona tu tipo de perfil',
      icon: Briefcase,
      component: 'category'
    },
    {
      id: 3,
      title: 'Redes Sociales',
      description: 'Conecta tus redes sociales',
      icon: Users,
      component: 'social'
    },
    {
      id: 4,
      title: 'Foto de Perfil',
      description: 'Sube tu foto de perfil',
      icon: Camera,
      component: 'photo'
    }
  ];

  // Validación mejorada con mensajes de error específicos
  const validarPaso = (stepId: number) => {
    const errores: {[key: string]: string} = {};
    
    switch (stepId) {
      case 1:
        if (!basicData.name.trim()) {
          errores.name = 'El nombre es obligatorio';
        } else if (basicData.name.trim().length < 2) {
          errores.name = 'El nombre debe tener al menos 2 caracteres';
        }
        
        if (basicData.phone && !/^[+]?[0-9\s-()]+$/.test(basicData.phone)) {
          errores.phone = 'El teléfono no tiene un formato válido';
        }
        
        if (basicData.bio && basicData.bio.length > 500) {
          errores.bio = 'La biografía no puede superar los 500 caracteres';
        }
        break;
        
      case 2:
        if (!categoryData.category) {
          errores.category = 'Selecciona una categoría';
        }
        
        if (categoryData.category === 'Marca / empresa' && !categoryData.brandName.trim()) {
          errores.brandName = 'El nombre de la marca es obligatorio';
        }
        
        if (categoryData.category === 'Otro' && !categoryData.otherCategory.trim()) {
          errores.otherCategory = 'Especifica tu categoría';
        }
        break;
        
      case 3:
        // Las redes sociales son opcionales
        break;
        
      case 4:
        if (!profilePhoto) {
          errores.photo = 'La foto de perfil es obligatoria';
        }
        break;
    }
    
    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };
  
  const isStepValid = (stepId: number) => {
    // Validación sin efectos secundarios para evitar re-renderizados
    switch (stepId) {
      case 1:
        return basicData.name.trim() !== '';
      case 2:
        return categoryData.category !== '' && 
               (categoryData.category !== 'Marca / empresa' || categoryData.brandName.trim() !== '') &&
               (categoryData.category !== 'Otro' || categoryData.otherCategory.trim() !== '');
      case 3:
        return true; // Las redes sociales son opcionales
      case 4:
        return profilePhoto !== null;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length && validarPaso(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep(currentStep + 1);
      // Limpiar errores al avanzar
      setErroresValidacion({});
      setError('');
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBasicDataChange = (field: string, value: string) => {
    setBasicData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinishOnboarding = async () => {
    if (!user) return;
    
    // Validar paso final
    if (!validarPaso(currentStep)) {
      return;
    }

    try {
      setGuardandoDatos(true);
      setError('');
      
      // Mantener el profileType original del registro, no sobreescribirlo
      // Solo mapear si el usuario no tiene un profileType definido
      let finalProfileType = user.profileType;
      if (!finalProfileType || finalProfileType === 'personal') {
        if (categoryData.category === 'Político / gubernamental') {
          finalProfileType = 'political';
        } else if (categoryData.category === 'Marca / empresa') {
          finalProfileType = 'business';
        } else {
          finalProfileType = 'personal';
        }
      }
      
      console.log('🔍 ONBOARDING: ProfileType original:', user.profileType);
      console.log('🔍 ONBOARDING: Categoría seleccionada:', categoryData.category);
      console.log('🔍 ONBOARDING: ProfileType final:', finalProfileType);
      
      // Validar que los datos estén completos
      if (!basicData.name.trim()) {
        throw new Error('El nombre es obligatorio');
      }
      
      if (!categoryData.category) {
        throw new Error('La categoría es obligatoria');
      }

      // Actualizar los datos del usuario con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      await Promise.race([
        updateUser({
          name: basicData.name.trim(),
          company: basicData.company?.trim() || undefined,
          phone: basicData.phone?.trim() || undefined,
          bio: basicData.bio?.trim() || undefined,
          avatarUrl: profilePhoto || user.avatarUrl,
          onboardingCompleted: true,
          profileType: finalProfileType,
          category: categoryData.category,
          brandName: categoryData.brandName?.trim() || undefined,
          otherCategory: categoryData.otherCategory?.trim() || undefined,
          additionalSources: categoryData.additionalSources,
        }),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Tiempo de espera agotado'));
          });
        })
      ]);
      
      clearTimeout(timeoutId);

      // Mostrar mensaje de éxito brevemente antes de redirigir según el tipo de perfil
      setTimeout(() => {
        if (finalProfileType === 'political') {
          router.push('/dashboard-politico');
        } else {
          router.push('/dashboard');
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Error al completar el onboarding. Inténtalo de nuevo.');
    } finally {
      setGuardandoDatos(false);
    }
  };

  // Función wrapper para manejar el callback del CategorySelector
  const handleCategoryChange = (data: any) => {
    setCategoryData({
      category: data.category || '',
      brandName: data.brandName || '',
      otherCategory: data.otherCategory || '',
      additionalSources: data.additionalSources || []
    });
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

  if (!user) {
    return null; // El useEffect redirigirá al login
  }

  const currentStepData = steps.find(step => step.id === currentStep);
  const isLastStep = currentStep === steps.length;
  const canProceed = isStepValid(currentStep);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#01257D]/5 via-white to-[#01257D]/10 dark:from-gray-900 dark:via-gray-800 dark:to-[#01257D]/20">
      {/* Partículas flotantes de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-particle absolute top-20 left-10 w-3 h-3 bg-[#01257D]/20 rounded-full blur-sm"></div>
        <div className="floating-particle absolute top-40 right-20 w-2 h-2 bg-blue-400/30 rounded-full blur-sm"></div>
        <div className="floating-particle absolute top-60 left-1/3 w-4 h-4 bg-[#01257D]/15 rounded-full blur-sm"></div>
        <div className="floating-particle absolute bottom-40 right-10 w-3 h-3 bg-blue-300/25 rounded-full blur-sm"></div>
        <div className="floating-particle absolute bottom-20 left-20 w-2 h-2 bg-[#01257D]/20 rounded-full blur-sm"></div>
      </div>
      
      {/* Gradiente decorativo */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#01257D]/5 to-transparent pointer-events-none"></div>
      
      <div ref={containerRef} className="mx-auto max-w-4xl px-4 py-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-full w-20 h-20 mx-auto opacity-20 animate-pulse"></div>
            <img 
              src="/rol-logo.png" 
              alt="Reputación Online Logo" 
              className="h-16 mx-auto relative z-10 drop-shadow-lg"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#01257D] to-blue-600 bg-clip-text text-transparent mb-4">
              ¡Bienvenido a Reputación Online!
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Configura tu perfil en unos simples pasos para comenzar a monitorear tu reputación digital
            </p>
            
            {/* Indicadores de beneficios */}
            <div className="flex justify-center items-center space-x-8 mt-6">
              <motion.div 
                className="flex items-center text-sm text-gray-500"
                whileHover={{ scale: 1.05 }}
              >
                <Shield className="w-4 h-4 mr-2 text-[#01257D]" />
                Seguro
              </motion.div>
              <motion.div 
                className="flex items-center text-sm text-gray-500"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-4 h-4 mr-2 text-[#01257D]" />
                Rápido
              </motion.div>
              <motion.div 
                className="flex items-center text-sm text-gray-500"
                whileHover={{ scale: 1.05 }}
              >
                <Star className="w-4 h-4 mr-2 text-[#01257D]" />
                Profesional
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Progress Indicator */}
        <div ref={progressRef} className="mb-12">
          <div className="relative">
            {/* Barra de progreso de fondo */}
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-200 rounded-full"></div>
            
            {/* Barra de progreso activa */}
            <motion.div 
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-[#01257D] to-blue-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            ></motion.div>
            
            <div className="flex items-center justify-between relative">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                const isAccessible = step.id <= currentStep || isCompleted;

                return (
                  <motion.div 
                    key={step.id} 
                    className="flex flex-col items-center flex-1"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <motion.div 
                      className={`relative flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-500 shadow-lg ${
                        isCompleted
                          ? 'bg-gradient-to-r from-[#01257D] to-blue-600 border-[#01257D] text-white shadow-[#01257D]/30'
                          : isCurrent
                          ? 'border-[#01257D] text-[#01257D] bg-white shadow-[#01257D]/20 ring-4 ring-[#01257D]/10'
                          : isAccessible
                          ? 'border-gray-300 text-gray-400 bg-white shadow-gray-200'
                          : 'border-gray-200 text-gray-300 bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      animate={isCurrent ? { 
                        boxShadow: [
                          "0 0 0 0 rgba(1, 37, 125, 0.4)",
                          "0 0 0 10px rgba(1, 37, 125, 0)",
                        ] 
                      } : {}}
                      transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0 }}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.5, type: "spring" }}
                        >
                          <Check className="h-7 w-7" />
                        </motion.div>
                      ) : (
                        <StepIcon className="h-7 w-7" />
                      )}
                      
                      {/* Brillos animados para el paso actual */}
                      {isCurrent && (
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#01257D] to-blue-500 opacity-20"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.2, 0.4, 0.2]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="mt-3 text-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                    >
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isCurrent ? 'text-[#01257D]' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <motion.div 
          ref={contentRef}
          className="relative bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl shadow-2xl border border-white/20 p-8 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Gradiente decorativo */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#01257D] via-blue-500 to-[#01257D]"></div>
          
          {/* Icono del paso actual */}
          <motion.div 
            className="flex items-center mb-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="w-16 h-16 rounded-xl bg-gradient-to-r from-[#01257D] to-blue-600 flex items-center justify-center mr-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {currentStepData?.icon && <currentStepData.icon className="w-8 h-8 text-white" />}
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#01257D] to-blue-600 bg-clip-text text-transparent">
                {currentStepData?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {currentStepData?.description}
              </p>
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentStep}
              className="min-h-[400px]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              {currentStep === 1 && (
                <motion.div 
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <User className="inline w-4 h-4 mr-2 text-[#01257D]" />
                      Nombre completo *
                    </label>
                    <motion.input
                      type="text"
                      value={basicData.name}
                      onChange={(e) => handleBasicDataChange('name', e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#01257D]/20 focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg shadow-sm hover:shadow-md"
                      placeholder="Tu nombre completo"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Briefcase className="inline w-4 h-4 mr-2 text-[#01257D]" />
                      Empresa u organización (opcional)
                    </label>
                    <motion.input
                      type="text"
                      value={basicData.company}
                      onChange={(e) => handleBasicDataChange('company', e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#01257D]/20 focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg shadow-sm hover:shadow-md"
                      placeholder="Nombre de tu empresa u organización"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Globe className="inline w-4 h-4 mr-2 text-[#01257D]" />
                      Teléfono (opcional)
                    </label>
                    <motion.input
                      type="tel"
                      value={basicData.phone}
                      onChange={(e) => handleBasicDataChange('phone', e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#01257D]/20 focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg shadow-sm hover:shadow-md"
                      placeholder="Tu número de teléfono"
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      <Sparkles className="inline w-4 h-4 mr-2 text-[#01257D]" />
                      Biografía corta (opcional)
                    </label>
                    <motion.textarea
                      value={basicData.bio}
                      onChange={(e) => handleBasicDataChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#01257D]/20 focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-all duration-300 text-lg shadow-sm hover:shadow-md resize-none"
                      placeholder="Cuéntanos brevemente sobre ti y tus objetivos..."
                      whileFocus={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                  </motion.div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <CategorySelector
                    onCategoryChange={handleCategoryChange}
                    initialCategory={categoryData.category}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <SocialNetworkConnector
                    onComplete={(networks) => setConnectedNetworks(networks)}
                    allowSkip={true}
                    isOnboarding={true}
                  />
                </motion.div>
              )}

              {currentStep === 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                  >
                    <ProfilePhotoUploader
                      onPhotoChange={setProfilePhoto}
                      initialPhoto={profilePhoto}
                    />
                  </motion.div>
                  
                  <motion.div
                    className="mt-8 p-6 bg-gradient-to-r from-[#01257D]/5 to-blue-500/5 rounded-xl border border-[#01257D]/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                      ¡Casi listo!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Tu foto de perfil ayudará a otros usuarios a identificarte y dará una imagen más profesional a tu cuenta.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Errores de validación */}
          <AnimatePresence>
            {Object.keys(erroresValidacion).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Por favor, corrige los siguientes errores:
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <ul className="list-disc list-inside space-y-1">
                        {Object.values(erroresValidacion).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Mensaje de error general */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div 
          ref={buttonsRef}
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-[#01257D] hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 shadow-md hover:shadow-lg'
            }`}
            whileHover={currentStep !== 1 ? { scale: 1.05, x: -5 } : {}}
            whileTap={currentStep !== 1 ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Anterior
          </motion.button>

          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Paso {currentStep} de {steps.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round((currentStep / steps.length) * 100)}% completado
            </div>
          </motion.div>

          {isLastStep ? (
            <motion.button
              onClick={handleFinishOnboarding}
              disabled={!canProceed || guardandoDatos}
              className={`relative flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
                canProceed && !guardandoDatos
                  ? 'bg-gradient-to-r from-[#01257D] to-blue-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={canProceed && !guardandoDatos ? { 
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(1, 37, 125, 0.3)"
              } : {}}
              whileTap={canProceed && !guardandoDatos ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Efecto de brillo */}
              {canProceed && !guardandoDatos && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
              
              {guardandoDatos ? (
                <>
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Finalizar
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleNextStep}
              disabled={!canProceed}
              className={`relative flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden ${
                canProceed
                  ? 'bg-gradient-to-r from-[#01257D] to-blue-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={canProceed ? { 
                scale: 1.05, 
                x: 5,
                boxShadow: "0 10px 30px rgba(1, 37, 125, 0.3)"
              } : {}}
              whileTap={canProceed ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Efecto de brillo */}
              {canProceed && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              )}
              
              Siguiente
              <ArrowRight className="h-5 w-5 ml-2" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}