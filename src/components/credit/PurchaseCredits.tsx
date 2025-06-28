"use client";

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { CreditCard, Lock, Check, ArrowRight, AlertCircle } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

interface PurchaseCreditsProps {
  packages: CreditPackage[];
}

const PurchaseCredits: React.FC<PurchaseCreditsProps> = ({ packages }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const packageRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  
  // Seleccionar automáticamente el paquete popular si existe
  useEffect(() => {
    const popularPackage = packages.find(pkg => pkg.popular);
    if (popularPackage) {
      setSelectedPackage(popularPackage.id);
    } else if (packages.length > 0) {
      setSelectedPackage(packages[0].id);
    }
  }, [packages]);

  useEffect(() => {
    if (containerRef.current) {
      // Animación de entrada del componente
      gsap.from(containerRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      });

      // Animar los paquetes
      if (Object.values(packageRefs.current).length > 0) {
        gsap.from(Object.values(packageRefs.current), {
          scale: 0.95,
          opacity: 0,
          y: 20,
          stagger: 0.15,
          duration: 0.6,
          ease: 'power2.out',
          delay: 0.2
        });
      }
    }
  }, []);

  // Gestionar selección de paquete con animación
  const handlePackageSelect = (packageId: string) => {
    // Si ya está seleccionado el mismo paquete, no hacemos nada
    if (selectedPackage === packageId) return;
    
    // Animar deselección del paquete anterior
    if (selectedPackage && packageRefs.current[selectedPackage]) {
      gsap.to(packageRefs.current[selectedPackage], {
        borderColor: 'rgba(229, 231, 235, 1)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power1.out'
      });
    }
    
    // Animar selección del nuevo paquete
    if (packageRefs.current[packageId]) {
      gsap.to(packageRefs.current[packageId], {
        borderColor: '#00B3B0',
        boxShadow: '0 0 0 2px rgba(0, 179, 176, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        duration: 0.3,
        ease: 'power2.out'
      });
      
      // Efecto de pulse en el paquete seleccionado
      gsap.fromTo(packageRefs.current[packageId],
        { scale: 1 },
        { 
          scale: 1.03, 
          duration: 0.2, 
          ease: 'power1.inOut',
          yoyo: true,
          repeat: 1
        }
      );
    }
    
    setSelectedPackage(packageId);
  };

  // Mostrar formulario de pago con animación
  const showPaymentFormWithAnimation = () => {
    setShowPaymentForm(true);
    
    // Esperar a que el formulario se renderice antes de animar
    setTimeout(() => {
      if (formRef.current) {
        // Ocultar paquetes
        gsap.to(Object.values(packageRefs.current), {
          opacity: 0,
          y: -20,
          stagger: 0.05,
          duration: 0.3,
          ease: 'power1.out'
        });
        
        // Mostrar formulario
        gsap.fromTo(formRef.current,
          { opacity: 0, y: 30 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6, 
            ease: 'power2.out',
            delay: 0.2
          }
        );
        
        // Animar elementos internos del formulario
        const formElements = formRef.current.querySelectorAll('.form-element');
        gsap.from(formElements, {
          opacity: 0,
          y: 15,
          stagger: 0.1,
          duration: 0.4,
          ease: 'power1.out',
          delay: 0.4
        });
      }
    }, 50);
  };

  // Simular compra exitosa
  const simulatePurchase = () => {
    if (formRef.current && successRef.current) {
      // Ocultar formulario
      gsap.to(formRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: 'power2.out'
      });
      
      // Mostrar mensaje de éxito
      gsap.fromTo(successRef.current,
        { display: 'flex', opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: 'backOut',
          delay: 0.3
        }
      );
      
      // Animar icono de éxito
      const successIcon = successRef.current.querySelector('.success-icon');
      if (successIcon) {
        gsap.fromTo(successIcon,
          { rotation: -30, scale: 0 },
          { 
            rotation: 0, 
            scale: 1, 
            duration: 0.6, 
            ease: 'elastic.out(1, 0.5)', 
            delay: 0.5 
          }
        );
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        Comprar Créditos
      </h3>
      
      {!showPaymentForm && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              ref={(el) => packageRefs.current[pkg.id] = el}
              className={`relative cursor-pointer rounded-lg border p-5 shadow-sm transition-all ${
                selectedPackage === pkg.id
                  ? 'border-primary bg-white shadow-md dark:border-primary-500 dark:bg-gray-800'
                  : 'border-gray-200 bg-white hover:shadow dark:border-gray-700 dark:bg-gray-800/90'
              }`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              {pkg.popular && (
                <span className="absolute -top-3 right-3 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Popular
                </span>
              )}
              
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                <CreditCard className="h-6 w-6" />
              </div>
              
              <h4 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">
                {pkg.name}
              </h4>
              
              <div className="mb-3 flex items-baseline">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">${pkg.price}</span>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pkg.credits.toLocaleString()} créditos
              </p>
              
              {selectedPackage === pkg.id && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={showPaymentFormWithAnimation}
                    className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-600"
                  >
                    Comprar Ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Formulario de pago */}
      {showPaymentForm && (
        <div ref={formRef} className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              Información de Pago
            </h4>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Lock className="mr-1 h-4 w-4" />
              Conexión segura
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="form-element">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre en la tarjeta
              </label>
              <input
                type="text"
                className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Juan Pérez"
              />
            </div>
            
            <div className="form-element">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Número de tarjeta
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="1234 5678 9012 3456"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="form-element grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de expiración
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="MM/AA"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  CVC
                </label>
                <input
                  type="text"
                  className="block w-full rounded-md border border-gray-300 p-2.5 text-gray-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="CVC"
                />
              </div>
            </div>
            
            <div className="form-element rounded-md bg-primary-50 p-3 text-sm text-primary-800 dark:bg-primary-900/10 dark:text-primary-300">
              <AlertCircle className="mb-1 h-4 w-4" />
              <span>
                Serás redirigido a nuestra pasarela segura de pago para completar la transacción.
              </span>
            </div>
            
            <div className="form-element mt-6 flex gap-3">
              <button
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={simulatePurchase}
                className="flex-1 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-600"
              >
                Procesar Pago
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensaje de éxito */}
      <div 
        ref={successRef}
        className="hidden w-full flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800"
        style={{ display: 'none' }}
      >
        <div className="success-icon mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
          ¡Compra Exitosa!
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          Tus créditos han sido añadidos a tu cuenta y ya están disponibles para usar.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-600"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default PurchaseCredits;
