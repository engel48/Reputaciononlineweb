"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MessageSquare } from 'lucide-react';
import JuliaLogo from '@/components/icons/JuliaLogo';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  opacity: number;
  direction: number;
}

interface SocialMention {
  id: string;
  platform: 'x' | 'facebook' | 'instagram' | 'linkedin' | 'other';
  text: string;
  timestamp: Date;
  processed: boolean;
}

interface JuliaThinkingAnimationProps {
  className?: string;
  height?: number | string;
  width?: number | string;
  particleCount?: number;
  showMentions?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  title?: string;
  subtitle?: string;
  responsive?: boolean;
}

const JuliaThinkingAnimation: React.FC<JuliaThinkingAnimationProps> = ({
  className = "",
  height = 300,
  width = 500,
  particleCount = 80,
  showMentions = true,
  theme = 'auto',
  title = "Julia está analizando tus redes sociales",
  subtitle = "Procesando menciones y sentimientos en tiempo real",
  responsive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mentions, setMentions] = useState<SocialMention[]>([]);
  const [activeMention, setActiveMention] = useState<SocialMention | null>(null);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ 
    width: typeof width === 'number' ? width : 500, 
    height: typeof height === 'number' ? height : 300 
  });

  // Función para manejar el redimensionamiento responsive
  const handleResize = useCallback(() => {
    if (!responsive || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight || Math.floor(containerWidth * 0.6); // Proporción de aspecto 5:3
    
    setCanvasSize({
      width: containerWidth,
      height: containerHeight
    });
    
    // Reiniciar partículas con nuevas dimensiones
    if (particlesRef.current.length > 0) {
      const particles = particlesRef.current.map(p => ({
        ...p,
        x: (p.x / canvasSize.width) * containerWidth,
        y: (p.y / canvasSize.height) * containerHeight
      }));
      particlesRef.current = particles;
    }
  }, [responsive, canvasSize.width, canvasSize.height]);

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
  
  // Configurar el observador de redimensionamiento
  useEffect(() => {
    if (!responsive) return;
    
    handleResize();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [responsive, handleResize]);

  // Generar partículas iniciales con colores degradados
  useEffect(() => {
    const particles: Particle[] = [];
    const gradientColors = [
      '#4285F4', // Azul Google
      '#6C5CE7', // Púrpura
      '#00CEFF', // Azul claro
      '#3498DB', // Azul medio
      '#9B59B6', // Púrpura medio
      '#8E44AD', // Púrpura oscuro
      '#2980B9', // Azul oscuro
      '#5352ED'  // Azul brillante
    ];
    
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 4 + 1,
        color: gradientColors[Math.floor(Math.random() * gradientColors.length)],
        speed: Math.random() * 1 + 0.2,
        opacity: Math.random() * 0.7 + 0.3,
        direction: Math.random() * Math.PI * 2
      });
    }
    
    particlesRef.current = particles;
    
    // Iniciar la animación
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [canvasSize.width, canvasSize.height, particleCount]);

  // Simular menciones entrantes
  useEffect(() => {
    if (!showMentions) return;
    
    const platforms: Array<'x' | 'facebook' | 'instagram' | 'linkedin' | 'other'> = 
      ['x', 'facebook', 'instagram', 'linkedin', 'other'];
    
    const mentionTexts = [
      "Me encanta este producto, muy recomendable",
      "Excelente servicio al cliente",
      "Necesito ayuda con mi pedido",
      "¿Cuándo estará disponible nuevamente?",
      "Gracias por la rápida respuesta",
      "No estoy satisfecho con mi compra",
      "¿Tienen envíos internacionales?",
      "Increíble experiencia de usuario",
      "¿Ofrecen descuentos para estudiantes?",
      "El producto llegó dañado"
    ];
    
    // Generar menciones periódicamente
    const mentionInterval = setInterval(() => {
      const newMention: SocialMention = {
        id: `mention-${Date.now()}`,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        text: mentionTexts[Math.floor(Math.random() * mentionTexts.length)],
        timestamp: new Date(),
        processed: false
      };
      
      setMentions(prev => {
        // Mantener solo las últimas 5 menciones
        const updated = [...prev, newMention].slice(-5);
        return updated;
      });
      
      // Activar efecto de pulso
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 1000);
      
      // Procesar la mención después de un tiempo
      setTimeout(() => {
        setActiveMention(newMention);
        
        setTimeout(() => {
          setMentions(prev => 
            prev.map(m => m.id === newMention.id ? {...m, processed: true} : m)
          );
          setActiveMention(null);
        }, 3000);
      }, 1500);
      
    }, 7000); // Nueva mención cada 7 segundos
    
    return () => clearInterval(mentionInterval);
  }, [showMentions]);

  // Función de animación
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas con un fondo semi-transparente para crear efecto de estela
    ctx.fillStyle = isDarkMode 
      ? 'rgba(17, 24, 39, 0.2)' // Fondo oscuro semi-transparente
      : 'rgba(255, 255, 255, 0.2)'; // Fondo claro semi-transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    const radius = Math.min(canvasSize.width, canvasSize.height) * 0.3;
    
    // Dibujar conexiones entre partículas cercanas
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      
      // Actualizar posición con movimiento orbital alrededor del centro
      const distanceFromCenter = Math.sqrt(
        Math.pow(particle.x - centerX, 2) + 
        Math.pow(particle.y - centerY, 2)
      );
      
      // Si está cerca del centro, hacer que orbite
      if (distanceFromCenter < radius * 1.5) {
        // Movimiento orbital
        const angle = Math.atan2(particle.y - centerY, particle.x - centerX);
        const newAngle = angle + (0.002 * particle.speed);
        
        // Mantener cierta distancia orbital
        const orbitRadius = Math.max(distanceFromCenter, radius * 0.5);
        
        particle.x = centerX + Math.cos(newAngle) * orbitRadius;
        particle.y = centerY + Math.sin(newAngle) * orbitRadius;
      } else {
        // Movimiento hacia el centro si está lejos
        particle.x += (centerX - particle.x) * 0.01 * particle.speed;
        particle.y += (centerY - particle.y) * 0.01 * particle.speed;
      }
      
      // Dibujar partícula con brillo
      const glow = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      
      glow.addColorStop(0, particle.color);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Dibujar la partícula principal
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Conectar con partículas cercanas
      for (let j = i + 1; j < particles.length; j++) {
        const otherParticle = particles[j];
        const dx = particle.x - otherParticle.x;
        const dy = particle.y - otherParticle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
          ctx.strokeStyle = `rgba(100, 150, 255, ${0.8 - distance / 50})`;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.stroke();
        }
      }
    }
    
    // Efecto de pulso cuando hay una nueva mención
    if (pulseEffect) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Continuar la animación
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Actualizar el canvas cuando cambia el tamaño
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }, [canvasSize]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`} 
      style={{
        height: responsive ? '100%' : (typeof height === 'number' ? `${height}px` : height),
        width: responsive ? '100%' : (typeof width === 'number' ? `${width}px` : width),
        minHeight: '250px'
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={canvasSize.width} 
        height={canvasSize.height}
        className="absolute inset-0 rounded-lg"
      />
      
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-4">
        <div className="flex items-center mb-2">
          <JuliaLogo className="mr-2 h-6 w-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{subtitle}</p>
        
        {showMentions && (
          <div className="mt-2 w-full max-w-md">
            {activeMention && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 p-3 rounded-lg shadow-lg mb-3 border-l-4 border-blue-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <Sparkles className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Procesando mención de {activeMention.platform}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  "{activeMention.text}"
                </p>
              </motion.div>
            )}
            
            <div className="space-y-2">
              {mentions.filter(m => m.processed).map((mention) => (
                <div 
                  key={mention.id}
                  className="bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 p-2 rounded-md text-xs flex items-center"
                >
                  <MessageSquare className="h-3 w-3 mr-2 text-green-500" />
                  <span className="truncate flex-1 text-gray-700 dark:text-gray-300">
                    {mention.text.length > 40 ? `${mention.text.substring(0, 40)}...` : mention.text}
                  </span>
                  <span className="text-gray-500 text-xs ml-2">
                    {mention.platform}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuliaThinkingAnimation;
