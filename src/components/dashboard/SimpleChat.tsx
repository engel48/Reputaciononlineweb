"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, User } from 'lucide-react';
import { emitCreditsChanged } from '@/lib/credit-events';
import { useUser } from '@/context/UserContext';
import { cleanJuliaText } from '@/lib/format-julia';

interface Mensaje {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: Date;
}

const GREETING_KEY = 'julia_last_greeting_day';

export default function SimpleChat() {
  const { user } = useUser();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Carga historial del backend al montar + saludo 1/día
  useEffect(() => {
    let cancelled = false;

    const cargar = async () => {
      try {
        const res = await fetch('/api/julia?history=1', {
          method: 'GET',
          credentials: 'include',
        });

        let historico: Mensaje[] = [];
        if (res.ok) {
          const data = await res.json();
          const conversaciones = (data?.data || []) as Array<{
            messages?: Array<{ role: string; content: string; created_at: string }>;
          }>;
          // Toma la conversación más reciente (primera del array) — es nuestro hilo continuo
          const msgs = conversaciones[0]?.messages || [];
          historico = msgs.map((m, idx) => ({
            id: `hist-${idx}`,
            texto: m.content,
            esUsuario: m.role === 'user',
            timestamp: new Date(m.created_at),
          }));
        }

        if (cancelled) return;

        // Decidir si mostrar saludo de bienvenida hoy
        const today = new Date().toDateString();
        let lastGreeting: string | null = null;
        try {
          lastGreeting = localStorage.getItem(GREETING_KEY);
        } catch {
          // localStorage no disponible (SSR o navegador privado) — mostrar saludo
        }

        const firstName = (user?.name || '').trim().split(' ')[0] || '';
        const debeSaludar = lastGreeting !== today;

        if (debeSaludar) {
          const saludoTexto = historico.length > 0
            ? `¡Hola de nuevo${firstName ? `, ${firstName}` : ''}! ¿En qué te ayudo hoy?`
            : `¡Hola${firstName ? `, ${firstName}` : ''}! Soy Julia, tu asistente de IA especializada en reputación online. ¿En qué puedo ayudarte?`;

          const saludo: Mensaje = {
            id: `saludo-${Date.now()}`,
            texto: saludoTexto,
            esUsuario: false,
            timestamp: new Date(),
          };

          setMensajes([...historico, saludo]);
          try {
            localStorage.setItem(GREETING_KEY, today);
          } catch { /* ignore */ }
        } else {
          setMensajes(historico);
        }
      } catch (err) {
        console.warn('No se pudo cargar el historial de Julia:', err);
      } finally {
        if (!cancelled) setCargandoHistorial(false);
      }
    };

    cargar();
    return () => {
      cancelled = true;
    };
  }, [user?.name]);

  const enviarMensaje = async () => {
    if (!inputMessage.trim() || enviando) return;

    const mensajeUsuario: Mensaje = {
      id: `user-${Date.now()}`,
      texto: inputMessage,
      esUsuario: true,
      timestamp: new Date()
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputMessage('');
    setEnviando(true);

    try {
      const response = await fetch('/api/julia', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          context: 'Dashboard de reputación online'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const mensajeJulia: Mensaje = {
          id: `julia-${Date.now()}`,
          texto: data.response,
          esUsuario: false,
          timestamp: new Date()
        };
        setMensajes(prev => [...prev, mensajeJulia]);
        emitCreditsChanged(data.credits?.newBalance);
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Mensaje = {
        id: `error-${Date.now()}`,
        texto: 'Lo siento, no pude procesar tu mensaje. ¿Podrías intentarlo de nuevo?',
        esUsuario: false,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, errorMessage]);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  };

  const preguntaRapida = (pregunta: string) => {
    setInputMessage(pregunta);
    setTimeout(() => enviarMensaje(), 100);
  };

  return (
    <div className="space-y-4">
      {/* Chat container */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto border-2 border-gray-200 dark:border-gray-600">
        {cargandoHistorial && mensajes.length === 0 && (
          <div className="flex items-center justify-center h-[280px] text-sm text-gray-500 dark:text-gray-400">
            <Brain className="w-4 h-4 mr-2 animate-pulse" />
            Cargando tu conversación con Julia...
          </div>
        )}
        {mensajes.map((mensaje) => (
          <motion.div
            key={mensaje.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 flex ${mensaje.esUsuario ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${mensaje.esUsuario ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                mensaje.esUsuario 
                  ? 'bg-[#01257D] text-white' 
                  : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
              }`}>
                {mensaje.esUsuario ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-lg ${
                mensaje.esUsuario
                  ? 'bg-[#01257D] text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-500'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{mensaje.esUsuario ? mensaje.texto : cleanJuliaText(mensaje.texto)}</p>
                <p className={`text-xs mt-1 ${
                  mensaje.esUsuario ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {mensaje.timestamp.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {enviando && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-600 p-3 rounded-lg rounded-bl-none border border-gray-200 dark:border-gray-500">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe aquí tu pregunta para Julia..."
          disabled={enviando}
          className="flex-1 px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white text-lg disabled:opacity-50"
          style={{ fontSize: '16px', minHeight: '50px' }}
        />
        <motion.button
          onClick={enviarMensaje}
          disabled={!inputMessage.trim() || enviando}
          className="px-6 py-3 bg-gradient-to-r from-[#01257D] to-blue-600 text-white rounded-xl hover:from-[#013AAA] hover:to-blue-700 font-semibold disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {enviando ? '⏳' : <Send className="w-5 h-5" />}
        </motion.button>
      </div>
      
      {/* Quick questions */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Preguntas rápidas:</span>
        <button 
          onClick={() => preguntaRapida('¿Cómo mejorar mi reputación online?')}
          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm hover:bg-green-200"
        >
          ¿Cómo mejorar mi reputación?
        </button>
        <button 
          onClick={() => preguntaRapida('¿Qué métricas son más importantes?')}
          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200"
        >
          ¿Qué métricas son importantes?
        </button>
        <button 
          onClick={() => preguntaRapida('¿Cómo analizar sentimientos en redes sociales?')}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200"
        >
          ¿Cómo analizar sentimientos?
        </button>
      </div>
    </div>
  );
}