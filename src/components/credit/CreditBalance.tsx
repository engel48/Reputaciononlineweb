"use client";

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Wallet, PlusCircle, Clock, CreditCard } from 'lucide-react';

interface CreditBalanceProps {
  currentBalance?: number;
  balanceHistory?: {
    date: string;
    amount: number;
    description: string;
    type: 'in' | 'out';
  }[];
}

const CreditBalance: React.FC<CreditBalanceProps> = ({ 
  currentBalance = 0,
  balanceHistory = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const balanceRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const historyItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (balanceRef.current) {
      // Animación de entrada del componente
      gsap.from(balanceRef.current, {
        x: -30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out'
      });

      // Animación del contador
      if (counterRef.current) {
        gsap.from(counterRef.current, {
          textContent: 0,
          duration: 1.5,
          delay: 0.3,
          ease: 'power1.out',
          snap: { textContent: 1 },
          onUpdate: function() {
            if (counterRef.current) {
              counterRef.current.innerHTML = Number(this.targets()[0].textContent).toLocaleString();
            }
          }
        });
      }
    }
  }, [currentBalance]);

  // Gestionar la expansión del historial
  const toggleHistory = () => {
    setIsExpanded(!isExpanded);
    
    if (historyRef.current) {
      if (!isExpanded) {
        // Mostrar el historial
        gsap.fromTo(historyRef.current, 
          { height: 0, opacity: 0 },
          { 
            height: 'auto', 
            opacity: 1, 
            duration: 0.5, 
            ease: 'power2.out',
            onComplete: animateHistoryItems
          }
        );
      } else {
        // Ocultar el historial
        gsap.to(historyRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  };

  // Animar las entradas del historial
  const animateHistoryItems = () => {
    if (historyItemsRef.current.length > 0) {
      gsap.from(historyItemsRef.current, {
        y: 15,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: 'power1.out'
      });
    }
  };

  return (
    <div 
      ref={balanceRef}
      className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Saldo de Créditos</h3>
            <p className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="mr-1 h-4 w-4" />
              Actualizado hace 2 horas
            </p>
          </div>
        </div>
        <div>
          <span 
            ref={counterRef}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            {currentBalance.toLocaleString()}
          </span>
          <span className="ml-1 text-lg text-gray-500 dark:text-gray-400">créditos</span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap gap-2">
        <button 
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-600"
          onClick={() => {
            // Animación al hacer clic en el botón de compra
            gsap.to('.credit-button-icon', {
              rotate: 360,
              duration: 0.5,
              ease: 'power2.out'
            });
          }}
        >
          <PlusCircle className="credit-button-icon mr-2 h-4 w-4" />
          Comprar Créditos
        </button>
        
        <button 
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          onClick={toggleHistory}
        >
          <Clock className="mr-2 h-4 w-4" />
          {isExpanded ? 'Ocultar Historial' : 'Ver Historial'}
        </button>
      </div>
      
      {/* Historial de transacciones */}
      <div 
        ref={historyRef}
        className="mt-4 overflow-hidden" 
        style={{ height: 0, opacity: 0 }}
      >
        <div className="space-y-3">
          {balanceHistory.map((item, index) => (
            <div 
              key={index}
              ref={el => historyItemsRef.current[index] = el}
              className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    item.type === 'in' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString('es-ES', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  item.type === 'in' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {item.type === 'in' ? '+' : '-'}{item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditBalance;
