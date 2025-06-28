"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Brain, ArrowUp, X, Minimize2, Maximize2, Paperclip, Smile } from 'lucide-react';
import { gsap } from 'gsap';
import { useUser } from '@/context/UserContext';
import OpenAI from 'openai';

interface Message {
  id: string;
  sender: 'user' | 'sofia';
  text: string;
  timestamp: Date;
}

// Inicializar el cliente de OpenAI con el token proporcionado
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Permitir uso en el navegador (normalmente esto se haría desde el servidor)
});

const ChatSofia = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useUser();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mensajes iniciales basados en el usuario actual
  useEffect(() => {
    if (user && messages.length === 0) {
      const initialMessages: Message[] = [
        {
          id: '1',
          sender: 'sofia',
          text: `¡Hola ${user.name}! Soy Sofia, tu asistente virtual. ¿En qué puedo ayudarte hoy?`,
          timestamp: new Date()
        }
      ];
      setMessages(initialMessages);
    }
  }, [user, messages.length]);

  useEffect(() => {
    // Scroll al final de los mensajes
    scrollToBottom();
  }, [messages]);

  // Animaciones para abrir/cerrar el chat
  useEffect(() => {
    const chatWindow = chatContainerRef.current;
    if (!chatWindow) return;

    if (isOpen) {
      if (isMinimized) {
        // Animar a estado minimizado
        gsap.to(chatWindow, {
          height: '2.75rem',
          duration: 0.3,
          ease: 'power2.out',
        });
      } else {
        // Animar a estado abierto
        gsap.fromTo(chatWindow,
          { height: isMinimized ? '2.75rem' : 0, opacity: isMinimized ? 1 : 0, y: isMinimized ? 0 : 20 },
          { height: '28rem', opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        );
      }
    } else {
      // Animar a estado cerrado
      gsap.to(chatWindow, {
        height: 0,
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isOpen, isMinimized]);

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      
      // Focus en el input cuando se abre el chat
      setTimeout(() => {
        inputRef.current?.focus();
      }, 400);
    } else {
      setIsOpen(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  // Función para obtener respuesta de OpenAI
  const getOpenAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const userContext = user ? `El usuario es ${user.name}, tiene ${user.credits} créditos y usa un plan ${user.plan}.` : '';
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system", 
            content: `Eres Sofia, una asistente especializada en análisis de reputación online y marketing digital para Latinoamérica. 
            
            ${userContext}
            
            Tu especialidad:
            - Análisis de sentimientos en redes sociales
            - Monitoreo de reputación online
            - Estrategias de marketing digital
            - Influencers y políticos de Latinoamérica (especialmente Colombia)
            - Gestión de crisis de reputación
            - Métricas y KPIs de social media
            - Scraping y análisis de menciones en tiempo real
            
            Tu personalidad:
            - Profesional pero cálida y cercana
            - Experta en tendencias digitales de Latinoamérica
            - Proactiva en recomendaciones estratégicas
            - Usa el nombre del usuario cuando sea apropiado
            
            Responde de manera útil, personalizada y enfócate en proporcionar insights accionables sobre reputación digital.`
          },
          ...messages.map(msg => ({ 
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const, 
            content: msg.text 
          })),
          { role: "user", content: userMessage }
        ],
        max_tokens: 250
      });
      
      return response.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta. ¿Puedes intentar de nuevo?";
    } catch (error) {
      console.error("Error al obtener respuesta de OpenAI:", error);
      return "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente en unos momentos.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;

    // Añadir mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    
    const currentMessage = message;
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    simulateTyping();

    try {
      // Obtener respuesta de OpenAI
      const aiResponse = await getOpenAIResponse(currentMessage);
      
      const sofiaMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'sofia',
        text: aiResponse,
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages((prev) => [...prev, sofiaMessage]);
    } catch (error) {
      console.error('Error al procesar la consulta:', error);
      
      setIsTyping(false);
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'sofia',
        text: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, intenta nuevamente en unos momentos.',
        timestamp: new Date()
      }]);
    }
  };

  return (
    <>
      {/* Botón para abrir chat */}
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        <Brain className="h-6 w-6" />
      </button>
      
      {/* Ventana de chat */}
      <div
        ref={chatContainerRef}
        className="fixed bottom-20 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl sm:w-96 dark:border-gray-700 dark:bg-gray-800"
        style={{ height: 0, opacity: 0, transform: 'translateY(20px)' }}
      >
        {/* Cabecera del chat */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-primary-600 px-4 py-3 text-white dark:border-gray-700">
          <div className="flex items-center">
            <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary-600">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Sofia</h3>
              <p className="text-xs opacity-80">Asistente Virtual</p>
            </div>
          </div>
          <div className="flex">
            <button
              onClick={toggleMinimize}
              className="p-1 text-white hover:text-gray-200"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleChat}
              className="ml-1 p-1 text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Contenido del chat (visible solo cuando no está minimizado) */}
        {!isMinimized && (
          <>
            {/* Área de mensajes */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900/50" style={{ height: 'calc(28rem - 118px)' }}>
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        msg.sender === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200'
                      } shadow`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <div
                        className={`mt-1 text-xs ${
                          msg.sender === 'user'
                            ? 'text-primary-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] rounded-lg bg-white px-4 py-2 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center border-t border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                type="button"
                className="mr-2 rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="button"
                className="mx-1 rounded-full p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Smile className="h-5 w-5" />
              </button>
              <button
                type="submit"
                className={`ml-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  message.trim() ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                }`}
                disabled={!message.trim()}
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default ChatSofia;
