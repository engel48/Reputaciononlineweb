"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Send, RefreshCw } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  userId: string;
  onVerified?: () => void;
}

export default function EmailVerification({ email, userId, onVerified }: EmailVerificationProps) {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Referencia para los inputs del código
  const inputRefs = Array(6).fill(0).map(() => React.createRef<HTMLInputElement>());
  
  // Manejar cambios en los campos del código
  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1); // Solo tomar el último caracter si pegan más de uno
    }
    
    // Validar que sea un número
    if (value && !/^\d+$/.test(value)) return;
    
    // Actualizar el código
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Mover al siguiente input si este tiene valor
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };
  
  // Manejar la tecla de retroceso
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };
  
  // Enviar código para verificación
  const verifyCode = async () => {
    const code = verificationCode.join('');
    
    if (code.length !== 6) {
      setError('Por favor ingrese el código completo de 6 dígitos.');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Aquí iría la llamada a la API para verificar el código
      // Este es un ejemplo simulado
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId })
      });
      
      if (response.ok) {
        setSuccess(true);
        if (onVerified) onVerified();
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || 'El código de verificación es incorrecto.');
      }
    } catch (err) {
      setError('Ocurrió un error al verificar el código. Intente nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Reenviar código de verificación
  const resendCode = async () => {
    if (resendCooldown > 0) return;
    
    try {
      // Aquí iría la llamada a la API para reenviar el código
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email })
      });
      
      // Iniciar el cooldown de reenvío
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((current) => {
          if (current <= 1) {
            clearInterval(interval);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
      
      // Mostrar mensaje de éxito
      setError(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('No se pudo reenviar el código. Intente nuevamente más tarde.');
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
        Verificación de Correo
      </h2>
      
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        Hemos enviado un código de verificación a <span className="font-medium text-gray-900 dark:text-gray-200">{email}</span>
      </p>
      
      {/* Código de verificación */}
      <div className="flex justify-center gap-2 mb-4">
        {verificationCode.map((digit, index) => (
          <input
            key={index}
            ref={inputRefs[index]}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-12 text-center text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 
              focus:ring-2 focus:ring-primary focus:border-primary dark:focus:ring-primary dark:focus:border-primary
              bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        ))}
      </div>
      
      {/* Mensajes de error/éxito */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Código verificado correctamente. Redirigiendo...</span>
        </div>
      )}
      
      {/* Botón para verificar */}
      <button
        onClick={verifyCode}
        disabled={isVerifying || verificationCode.some(v => !v)}
        className="w-full bg-primary hover:bg-primary-700 disabled:bg-primary-400 text-white py-2.5 rounded-lg 
          font-medium flex items-center justify-center transition-colors"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            Verificar Cuenta
          </>
        )}
      </button>
      
      {/* Opción para reenviar código */}
      <div className="mt-4 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          ¿No recibiste el código?
        </p>
        <button
          onClick={resendCode}
          disabled={resendCooldown > 0}
          className="text-primary hover:text-primary dark:text-primary-400 text-sm font-medium flex items-center mx-auto mt-1"
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          {resendCooldown > 0 ? `Reenviar código (${resendCooldown}s)` : 'Reenviar código'}
        </button>
      </div>
    </div>
  );
}
