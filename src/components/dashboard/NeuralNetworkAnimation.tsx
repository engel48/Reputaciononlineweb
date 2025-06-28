"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Neuron {
  x: number;
  y: number;
  connections: number[];
  active: boolean;
  activationTime: number;
}

interface NeuralNetworkAnimationProps {
  className?: string;
  height?: number;
  width?: number;
  neuronCount?: number;
  connectionCount?: number;
  animationSpeed?: number;
  neuronColor?: string;
  activeNeuronColor?: string;
  connectionColor?: string;
  activeConnectionColor?: string;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
  showStats?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  mode?: 'sentiment' | 'platform' | 'engagement';
  isAnalyzing?: boolean;
}

const NeuralNetworkAnimation: React.FC<NeuralNetworkAnimationProps> = ({
  className = "",
  height = 300,
  width = 500,
  neuronCount = 60,
  connectionCount = 120,
  animationSpeed = 1.2,
  neuronColor = "rgba(180, 180, 180, 0.4)",
  activeNeuronColor = "#3b82f6",
  connectionColor = "rgba(180, 180, 180, 0.15)",
  activeConnectionColor = "rgba(59, 130, 246, 0.5)",
  backgroundColor = "transparent",
  title = "Análisis de Redes Sociales",
  subtitle = "Procesando datos en tiempo real",
  showStats = true,
  theme = 'auto',
  mode = 'sentiment',
  isAnalyzing = true
}) => {
  // Estado para controlar la apariencia de la animación
  const [animationMode, setAnimationMode] = useState(mode);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<Neuron[]>([]);
  const animationFrameRef = useRef<number>(0);
  const statsRef = useRef({
    processed: 0,
    connections: 0,
    platforms: {
      x: 0,
      facebook: 0,
      instagram: 0,
      linkedin: 0,
      other: 0
    }
  });

  // Inicializar la red neuronal
  // Detectar tema oscuro
  useEffect(() => {
    if (theme === 'auto') {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      darkModeMediaQuery.addEventListener('change', handleChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  // Actualizar modo de animación cuando cambie la prop
  useEffect(() => {
    setAnimationMode(mode);
  }, [mode]);

  // Configurar y animar la red neuronal
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar el tamaño del canvas
    canvas.width = width;
    canvas.height = height;

    // Crear neuronas con distribución más estética
    const neurons: Neuron[] = [];
    
    // Crear una distribución más uniforme para las neuronas
    const gridSize = Math.sqrt(neuronCount);
    const cellWidth = width / gridSize;
    const cellHeight = height / gridSize;
    
    for (let i = 0; i < neuronCount; i++) {
      // Posición base en la cuadrícula
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);
      
      // Añadir variación aleatoria dentro de cada celda
      const x = (gridX * cellWidth) + (Math.random() * 0.8 * cellWidth);
      const y = (gridY * cellHeight) + (Math.random() * 0.8 * cellHeight);
      
      neurons.push({
        x,
        y,
        connections: [],
        active: false,
        activationTime: 0
      });
    }

    // Crear conexiones más inteligentes entre neuronas
    // Preferir conexiones a neuronas cercanas para un aspecto más natural
    for (let i = 0; i < neurons.length; i++) {
      const sourceNeuron = neurons[i];
      
      // Calcular distancias a todas las demás neuronas
      const distances = neurons.map((targetNeuron, index) => {
        if (index === i) return {
          index,
          distance: Infinity // Evitar autoconexiones
        };
        const dx = targetNeuron.x - sourceNeuron.x;
        const dy = targetNeuron.y - sourceNeuron.y;
        return {
          index,
          distance: Math.sqrt(dx * dx + dy * dy)
        };
      }).filter(item => item.distance !== Infinity);
      
      // Ordenar por distancia
      distances.sort((a, b) => a.distance - b.distance);
      
      // Conectar con neuronas cercanas y algunas aleatorias
      const maxConnections = Math.floor(Math.random() * 3) + 2; // 2-4 conexiones por neurona
      const nearConnections = distances.slice(0, Math.ceil(maxConnections * 0.7)); // 70% conexiones cercanas
      
      // Añadir conexiones cercanas
      for (const conn of nearConnections) {
        sourceNeuron.connections.push(conn.index);
      }
      
      // Añadir algunas conexiones aleatorias para tener patrones interesantes
      if (Math.random() > 0.7) {
        const randomIndex = Math.floor(Math.random() * neurons.length);
        if (randomIndex !== i && !sourceNeuron.connections.includes(randomIndex)) {
          sourceNeuron.connections.push(randomIndex);
        }
      }
    }

    neuronsRef.current = neurons;

    // Activar algunas neuronas inicialmente en un patrón más interesante
    // Activar neuronas en diferentes áreas del canvas
    const areas = [
      { x: width * 0.2, y: height * 0.2 },
      { x: width * 0.8, y: height * 0.2 },
      { x: width * 0.5, y: height * 0.5 },
      { x: width * 0.2, y: height * 0.8 },
      { x: width * 0.8, y: height * 0.8 },
    ];
    
    areas.forEach(area => {
      // Encontrar la neurona más cercana a este área
      let closestIndex = 0;
      let minDistance = Infinity;
      
      neurons.forEach((neuron, index) => {
        const dx = neuron.x - area.x;
        const dy = neuron.y - area.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      neurons[closestIndex].active = true;
      neurons[closestIndex].activationTime = Date.now();
    });

    // Iniciar la animación
    animate();

    // Actualizar estadísticas periódicamente con un patrón más realista
    const statsInterval = setInterval(() => {
      if (showStats && isAnalyzing) {
        // Incremento base
        const baseIncrement = animationMode === 'sentiment' ? 8 : 
                             animationMode === 'platform' ? 6 : 4;
        
        // Añadir variación aleatoria
        const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
        
        statsRef.current.processed += Math.floor(baseIncrement * randomFactor);
        statsRef.current.connections += Math.floor((baseIncrement / 2) * randomFactor);
        
        // Actualizar contadores de plataformas con distribución ponderada
        const platformWeights = {
          x: 0.4,          // 40% probabilidad
          facebook: 0.25, // 25% probabilidad
          instagram: 0.2, // 20% probabilidad
          linkedin: 0.1,  // 10% probabilidad
          other: 0.05     // 5% probabilidad
        };
        
        const random = Math.random();
        let cumulativeWeight = 0;
        let selectedPlatform = 'other';
        
        for (const [platform, weight] of Object.entries(platformWeights)) {
          cumulativeWeight += weight;
          if (random <= cumulativeWeight) {
            selectedPlatform = platform;
            break;
          }
        }
        
        statsRef.current.platforms[selectedPlatform as keyof typeof statsRef.current.platforms] += 1;
      }
    }, 800); // Actualización más rápida

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      clearInterval(statsInterval);
    };
  }, [width, height, neuronCount, connectionCount, showStats, isAnalyzing, animationMode, isDarkMode]);

  // Función de animación
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const neurons = neuronsRef.current;
    const currentTime = Date.now();

    // Dibujar conexiones
    for (let i = 0; i < neurons.length; i++) {
      const neuron = neurons[i];
      
      for (const targetIndex of neuron.connections) {
        const targetNeuron = neurons[targetIndex];
        
        // Determinar si la conexión está activa
        const isActive = neuron.active && Math.random() > 0.7;
        
        // Dibujar la línea de conexión
        ctx.beginPath();
        ctx.moveTo(neuron.x, neuron.y);
        ctx.lineTo(targetNeuron.x, targetNeuron.y);
        ctx.strokeStyle = isActive ? activeConnectionColor : connectionColor;
        ctx.lineWidth = isActive ? 1.5 : 0.5;
        ctx.stroke();
        
        // Activar la neurona objetivo si la conexión está activa
        if (isActive && !targetNeuron.active && Math.random() > 0.7) {
          targetNeuron.active = true;
          targetNeuron.activationTime = currentTime;
        }
      }
    }

    // Dibujar neuronas
    for (let i = 0; i < neurons.length; i++) {
      const neuron = neurons[i];
      
      // Desactivar neuronas después de un tiempo
      if (neuron.active && currentTime - neuron.activationTime > 2000 * (1/animationSpeed)) {
        neuron.active = false;
      }
      
      // Activar aleatoriamente algunas neuronas
      if (!neuron.active && Math.random() > 0.995) {
        neuron.active = true;
        neuron.activationTime = currentTime;
      }
      
      // Dibujar la neurona
      ctx.beginPath();
      ctx.arc(neuron.x, neuron.y, neuron.active ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = neuron.active ? activeNeuronColor : neuronColor;
      ctx.fill();
    }

    // Continuar la animación
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px`, width: `${width}px` }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        
        {showStats && (
          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Menciones procesadas:</span>
              <span className="ml-2 font-semibold">{statsRef.current.processed}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Conexiones:</span>
              <span className="ml-2 font-semibold">{statsRef.current.connections}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-black dark:bg-white mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">X:</span>
              <span className="ml-2 font-semibold">{statsRef.current.platforms.x}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-600 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Facebook:</span>
              <span className="ml-2 font-semibold">{statsRef.current.platforms.facebook}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-pink-600 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">Instagram:</span>
              <span className="ml-2 font-semibold">{statsRef.current.platforms.instagram}</span>
            </div>
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-800 mr-2"></div>
              <span className="text-gray-700 dark:text-gray-300">LinkedIn:</span>
              <span className="ml-2 font-semibold">{statsRef.current.platforms.linkedin}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NeuralNetworkAnimation;
