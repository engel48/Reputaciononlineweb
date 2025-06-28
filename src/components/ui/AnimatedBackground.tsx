"use client";

import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

interface AnimatedBackgroundProps {
  className?: string;
  particleColor?: string;
  particleCount?: number;
  particleSpeed?: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = '',
  particleColor = 'rgba(255, 255, 255, 0.5)',
  particleCount = 50,
  particleSpeed = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    contextRef.current = context;
    
    const updateCanvasSize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const { width, height } = containerRef.current.getBoundingClientRect();
      
      // Set canvas dimensions
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      // Re-create particles when canvas size changes
      initParticles();
    };
    
    // Initialize ResizeObserver
    resizeObserverRef.current = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }
    
    // Initial update
    updateCanvasSize();
    
    // Start animation with GSAP ticker
    const animate = () => {
      drawParticles();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    
    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      window.removeEventListener('mousemove', handleMouseMove);
      
      if (resizeObserverRef.current && containerRef.current) {
        resizeObserverRef.current.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // Initialize particles
  const initParticles = () => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * particleSpeed,
        speedY: (Math.random() - 0.5) * particleSpeed,
        color: particleColor,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }
    
    particlesRef.current = particles;
  };
  
  // Draw particles and connections
  const drawParticles = () => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const ctx = contextRef.current;
    const { width, height } = canvasRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update and draw each particle
    particlesRef.current.forEach((particle, i) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > width) {
        particle.speedX = -particle.speedX;
      }
      
      if (particle.y < 0 || particle.y > height) {
        particle.speedY = -particle.speedY;
      }
      
      // Mouse interaction - create gentle pull toward mouse
      const mouseDistance = Math.hypot(
        mouseRef.current.x - particle.x, 
        mouseRef.current.y - particle.y
      );
      
      if (mouseDistance < 100) {
        const angle = Math.atan2(
          mouseRef.current.y - particle.y, 
          mouseRef.current.x - particle.x
        );
        
        particle.x += Math.cos(angle) * 0.2;
        particle.y += Math.sin(angle) * 0.2;
      }
      
      // Draw particle
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
      ctx.fill();
      
      // Draw connections between particles that are close to each other
      for (let j = i + 1; j < particlesRef.current.length; j++) {
        const otherParticle = particlesRef.current[j];
        const distance = Math.hypot(
          particle.x - otherParticle.x,
          particle.y - otherParticle.y
        );
        
        if (distance < 100) {
          // The closer they are, the more opaque the line
          const opacity = 1 - distance / 100;
          
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(otherParticle.x, otherParticle.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
    </div>
  );
};

export default AnimatedBackground;
