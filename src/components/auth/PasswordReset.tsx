"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface PasswordResetProps {
  token?: string; // Si se proporciona, estamos en la vista de reseteo con token
}

export default function PasswordReset({ token }: PasswordResetProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const isResetView = !!token;

  // Solicitar recuperación de contraseña (envío de correo)
  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulación de llamada a API
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        setSuccess('Te hemos enviado un correo con instrucciones para recuperar tu contraseña.');
      } else {
        const data = await response.json();
        setError(data.message || 'No pudimos procesar tu solicitud. Verifica tu correo e intenta nuevamente.');
      }
    } catch (err) {
      setError('Ocurrió un error al procesar tu solicitud. Intenta nuevamente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Restablecer contraseña con token
  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Por favor ingresa una nueva contraseña.');
      return;
    }
    
    if (password.length < 8) {
      setError('Tu contraseña debe tener al menos 8 caracteres.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulación de llamada a API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      if (response.ok) {
        setSuccess('Tu contraseña ha sido restablecida exitosamente.');
        // Redirigir al login después de unos segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'No pudimos restablecer tu contraseña. El enlace puede haber expirado.');
      }
    } catch (err) {
      setError('Ocurrió un error al restablecer tu contraseña. Intenta nuevamente más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <Link href="/login" className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-6 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Regresar al inicio de sesión
      </Link>
      
      <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
        {isResetView ? 'Restablece tu contraseña' : 'Recupera tu cuenta'}
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
        {isResetView 
          ? 'Ingresa una nueva contraseña para tu cuenta'
          : 'Te enviaremos un correo con instrucciones para recuperar tu contraseña'}
      </p>
      
      {/* Mensajes de error/éxito */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      <form onSubmit={isResetView ? resetPassword : requestReset}>
        {!isResetView && (
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:ring-2 focus:ring-primary dark:focus:ring-primary-700 focus:border-primary dark:focus:border-primary-700
                  bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}
        
        {isResetView && (
          <>
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                    focus:ring-2 focus:ring-primary dark:focus:ring-primary-700 focus:border-primary dark:focus:border-primary-700
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu contraseña"
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 
                    focus:ring-2 focus:ring-primary dark:focus:ring-primary-700 focus:border-primary dark:focus:border-primary-700
                    bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white py-2.5 rounded-lg 
            font-medium flex items-center justify-center transition-colors"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {isResetView ? 'Restableciendo...' : 'Enviando...'}
            </>
          ) : (
            isResetView ? 'Restablecer Contraseña' : 'Enviar Instrucciones'
          )}
        </button>
      </form>
    </div>
  );
}
