"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Bot, User, Sparkles, RefreshCw, X, Minimize2, Maximize2, Volume2, VolumeX, Coins, Brain, AlertTriangle, FileText } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'julia';
  timestamp: Date;
  typing?: boolean;
}

export default function JuliaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '¡Hola! Soy Julia, tu asistente de IA especializada en análisis de reputación online. ¿En qué puedo ayudarte hoy?',
      sender: 'julia',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addTypingMessage = () => {
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      content: '',
      sender: 'julia',
      timestamp: new Date(),
      typing: true
    };
    setMessages(prev => [...prev, typingMessage]);
    return typingMessage.id;
  };

  const removeTypingMessage = (typingId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== typingId));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    const typingId = addTypingMessage();

    try {
      const response = await fetch('/api/julia', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: 'Dashboard de reputación online'
        }),
      });

      const data = await response.json();
      
      // Remover mensaje de typing
      removeTypingMessage(typingId);

      // Actualizar saldo de creditos
      if (data.credits?.newBalance !== undefined) {
        setCreditBalance(data.credits.newBalance);
      }

      if (data.success) {
        const juliaMessage: Message = {
          id: `julia-${Date.now()}`,
          content: data.response,
          sender: 'julia',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, juliaMessage]);

        // Opcion de texto a voz
        if ('speechSynthesis' in window && isSpeaking) {
          const utterance = new SpeechSynthesisUtterance(data.response);
          utterance.lang = 'es-ES';
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }
      } else {
        const errorContent = response.status === 402
          ? `No tienes suficientes creditos. ${data.response || 'Recarga creditos para continuar.'}`
          : 'Lo siento, estoy experimentando dificultades tecnicas. ¿Podrias intentarlo de nuevo?';
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          content: errorContent,
          sender: 'julia',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      removeTypingMessage(typingId);
      console.error('Error al enviar mensaje:', error);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'No pude conectarme con el servidor. Por favor, verifica tu conexión e inténtalo de nuevo.',
        sender: 'julia',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "¿Como analizar mi reputacion online?",
    "¿Que metricas son mas importantes?",
    "¿Como mejorar mi presencia digital?",
    "¿Que hacer con comentarios negativos?"
  ];

  const quickActions = [
    { label: 'Analizar Sentimiento', icon: Brain, cost: 3, action: 'analyze' },
    { label: 'Respuesta a Crisis', icon: AlertTriangle, cost: 5, action: 'crisis-response' },
    { label: 'Resumir Noticias', icon: FileText, cost: 3, action: 'summarize' },
  ];

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#01257D] to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <Bot className="w-8 h-8" />
        </motion.div>
        
        {/* Indicator de disponibilidad */}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-[#01257D] to-blue-600 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(255, 255, 255, 0.4)",
                "0 0 0 10px rgba(255, 255, 255, 0)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="w-6 h-6 text-[#01257D]" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-white">Julia</h3>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-blue-100">Asistente de IA</p>
              {creditBalance !== null && (
                <span className="flex items-center text-xs text-blue-100 bg-white/20 px-1.5 py-0.5 rounded">
                  <Coins className="w-3 h-3 mr-0.5" />{creditBalance}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={toggleSpeech}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 text-white" />
            ) : (
              <VolumeX className="w-4 h-4 text-white" />
            )}
          </motion.button>
          
          <motion.button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </motion.button>
          
          <motion.button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-[#01257D] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.typing ? (
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions + Quick Actions */}
          {messages.length <= 2 && (
            <motion.div
              className="px-4 pb-2 space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Quick Actions */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Acciones rapidas:</p>
                <div className="flex flex-wrap gap-1">
                  {quickActions.map((qa, index) => (
                    <motion.button
                      key={index}
                      onClick={() => {
                        const promptMap: Record<string, string> = {
                          'analyze': 'Analiza el sentimiento del texto que te voy a compartir',
                          'crisis-response': 'Necesito una estrategia de respuesta a una crisis de reputacion',
                          'summarize': 'Resume las noticias mas recientes sobre mi marca',
                        };
                        setInputMessage(promptMap[qa.action] || qa.label);
                      }}
                      className="flex items-center space-x-1 text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <qa.icon className="w-3 h-3" />
                      <span>{qa.label}</span>
                      <span className="flex items-center text-amber-600 dark:text-amber-400">
                        <Coins className="w-2.5 h-2.5 mr-0.5" />{qa.cost}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
              {/* Quick Questions */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preguntas frecuentes:</p>
                <div className="flex flex-wrap gap-1">
                  {quickQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 mb-1 flex items-center">
              <Coins className="w-3 h-3 mr-1 text-amber-500" />1 credito por mensaje
            </p>
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white text-sm"
                disabled={isTyping}
              />
              <motion.button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="p-2 bg-[#01257D] text-white rounded-xl hover:bg-[#013AAA] disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isTyping ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}