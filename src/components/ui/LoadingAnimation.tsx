"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingAnimation({ message = "Cargando...", size = 'md' }: LoadingAnimationProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const containerSizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Contenedor del logo con animaciones */}
      <div className={`relative ${containerSizeClasses[size]} flex items-center justify-center`}>
        {/* Círculo exterior giratorio */}
        <motion.div
          className="absolute inset-0 border-4 border-transparent border-t-[#01257D] border-r-[#01257D] rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Círculo medio pulsante */}
        <motion.div
          className="absolute inset-2 border-2 border-transparent border-b-blue-500 border-l-blue-500 rounded-full"
          animate={{ 
            rotate: -360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            },
            scale: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        />

        {/* Logo central */}
        <motion.div 
          className={`${sizeClasses[size]} relative flex items-center justify-center`}
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Corazón como logo principal */}
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 0px #01257D)",
                "drop-shadow(0 0 10px #01257D)",
                "drop-shadow(0 0 0px #01257D)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              className={`${sizeClasses[size]} text-[#01257D]`}
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </motion.div>

          {/* Partículas decorativas */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-[#01257D] rounded-full"
              style={{
                top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 30}px`,
                left: `${20 + Math.cos(i * 60 * Math.PI / 180) * 30}px`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Texto de carga */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.p 
          className="text-lg font-semibold text-[#01257D] dark:text-blue-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {message}
        </motion.p>
        
        {/* Puntos de carga */}
        <div className="flex justify-center space-x-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-[#01257D] rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Texto de la marca */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          Reputación Online
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Reputación Online
        </p>
      </motion.div>
    </div>
  );
}