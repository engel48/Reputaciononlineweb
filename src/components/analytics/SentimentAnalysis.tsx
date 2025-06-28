"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface SentimentAnalysisProps {
  data: SentimentData;
  title: string;
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({ data, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const positiveBarRef = useRef<HTMLDivElement>(null);
  const neutralBarRef = useRef<HTMLDivElement>(null);
  const negativeBarRef = useRef<HTMLDivElement>(null);

  const positivePercent = Math.round((data.positive / data.total) * 100);
  const neutralPercent = Math.round((data.neutral / data.total) * 100);
  const negativePercent = Math.round((data.negative / data.total) * 100);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Animación de entrada para el contenedor
    gsap.from(container, {
      duration: 0.7,
      y: 20,
      opacity: 0,
      ease: 'power3.out',
      onComplete: () => animateBars(container)
    });

    function animateBars(container: HTMLDivElement) {
      if (positiveBarRef.current) {
        gsap.fromTo(positiveBarRef.current, 
          { width: 0 }, 
          { width: `${positivePercent}%`, duration: 1.5, ease: 'power2.out' }
        );
      }
      
      if (neutralBarRef.current) {
        gsap.fromTo(neutralBarRef.current,
          { width: 0 },
          { width: `${neutralPercent}%`, duration: 1.5, ease: 'power2.out', delay: 0.2 }
        );
      }
      
      if (negativeBarRef.current) {
        gsap.fromTo(negativeBarRef.current,
          { width: 0 },
          { width: `${negativePercent}%`, duration: 1.5, ease: 'power2.out', delay: 0.4 }
        );
      }
      
      // Animar los porcentajes
      const percentageElements = container.querySelectorAll('.percentage-value');
      gsap.from(percentageElements, { 
        textContent: 0,
        duration: 1.5,
        ease: 'power2.out',
        snap: { textContent: 1 },
        stagger: 0.2,
        onUpdate: function() {
          for (let i = 0; i < percentageElements.length; i++) {
            const el = percentageElements[i] as HTMLElement;
            if (el.dataset.target) {
              el.textContent = Math.round(Number(this.targets()[i].textContent)).toString() + '%';
            }
          }
        }
      });
    }
  }, [positivePercent, neutralPercent, negativePercent]);

  return (
    <div 
      ref={containerRef} 
      className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
    >
      <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      
      <div className="mb-6 text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {data.total.toLocaleString()}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total de menciones</p>
      </div>
      
      <div className="space-y-5">
        {/* Sentimiento positivo */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positivo</span>
            <span 
              className="text-sm font-medium text-green-600 dark:text-green-400 percentage-value" 
              data-target={positivePercent}
            >
              0%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              ref={positiveBarRef} 
              className="h-2.5 rounded-full bg-green-500"
              style={{ width: '0%' }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.positive.toLocaleString()} menciones
          </div>
        </div>
        
        {/* Sentimiento neutral */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Neutral</span>
            <span 
              className="text-sm font-medium text-blue-600 dark:text-blue-400 percentage-value" 
              data-target={neutralPercent}
            >
              0%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              ref={neutralBarRef} 
              className="h-2.5 rounded-full bg-blue-500"
              style={{ width: '0%' }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.neutral.toLocaleString()} menciones
          </div>
        </div>
        
        {/* Sentimiento negativo */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Negativo</span>
            <span 
              className="text-sm font-medium text-red-600 dark:text-red-400 percentage-value" 
              data-target={negativePercent}
            >
              0%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div 
              ref={negativeBarRef} 
              className="h-2.5 rounded-full bg-red-500"
              style={{ width: '0%' }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {data.negative.toLocaleString()} menciones
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysis;
