"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Globe, User, Save, Check, ExternalLink } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useTheme } from '@/hooks/useTheme';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]" />
    </label>
  );
}

export default function ConfiguracionPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: false,
    reportes: true,
    menciones: true
  });

  const [privacidad, setPrivacidad] = useState({
    perfilPublico: false,
    mostrarEmail: false,
    analiticasPublicas: false
  });

  const [idioma, setIdioma] = useState('es');

  // Cargar preferencias guardadas (localStorage).
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_prefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.notificaciones) setNotificaciones((prev) => ({ ...prev, ...p.notificaciones }));
        if (p.privacidad) setPrivacidad((prev) => ({ ...prev, ...p.privacidad }));
        if (p.idioma) setIdioma(p.idioma);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleGuardar = () => {
    try {
      localStorage.setItem('user_prefs', JSON.stringify({ notificaciones, privacidad, idioma }));
    } catch {
      /* ignore */
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Calcular datos reales del usuario
  const planLabel = user?.plan?.toUpperCase() || 'Sin plan';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : 'No disponible';

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header con gradiente */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Settings className="h-8 w-8 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuracion</h1>
            <p className="text-blue-200 text-sm">Personaliza tu experiencia en la plataforma</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            Notificaciones
          </h2>

          <div className="space-y-4">
            {[
              { key: 'email', label: 'Notificaciones por email', desc: 'Alertas y resumen por correo' },
              { key: 'push', label: 'Notificaciones push', desc: 'Alertas en tiempo real en el navegador' },
              { key: 'reportes', label: 'Reportes semanales', desc: 'Resumen semanal de actividad' },
              { key: 'menciones', label: 'Alertas de menciones', desc: 'Notificacion cuando te mencionan' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.desc}</p>
                </div>
                <Toggle
                  checked={notificaciones[item.key as keyof typeof notificaciones]}
                  onChange={(v) => setNotificaciones({ ...notificaciones, [item.key]: v })}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacidad */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Privacidad
          </h2>

          <div className="space-y-4">
            {[
              { key: 'perfilPublico', label: 'Perfil publico', desc: 'Permite que otros vean tu perfil' },
              { key: 'mostrarEmail', label: 'Mostrar email publicamente', desc: 'Tu email sera visible para otros' },
              { key: 'analiticasPublicas', label: 'Analiticas publicas', desc: 'Comparte tus metricas de reputacion' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{item.desc}</p>
                </div>
                <Toggle
                  checked={privacidad[item.key as keyof typeof privacidad]}
                  onChange={(v) => setPrivacidad({ ...privacidad, [item.key]: v })}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Preferencias generales */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            Preferencias
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idioma</label>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
                <option value="pt">Portugues</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tema</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'auto')}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
                <option value="auto">Automatico</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Informacion de cuenta - DATOS REALES */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 transition-shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            Informacion de cuenta
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tipo de cuenta</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white px-2.5 py-1 bg-[#01257D]/10 text-[#01257D] dark:text-[#00E5FF] rounded-lg">
                {planLabel}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Nombre</span>
              <span className="text-sm text-gray-900 dark:text-white">{user?.name || 'No disponible'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
              <span className="text-sm text-gray-900 dark:text-white">{user?.email || 'No disponible'}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Miembro desde</span>
              <span className="text-sm text-gray-900 dark:text-white capitalize">{memberSince}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Privacidad y datos */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          Privacidad y datos
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/politica-de-privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[#01257D] text-[#01257D] dark:text-[#00E5FF] dark:border-[#00E5FF] hover:bg-[#01257D]/5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Ver política de privacidad
          </a>
        </div>
      </motion.div>

      {/* Boton guardar */}
      <motion.div
        variants={itemVariants}
        className="flex justify-end pt-2"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGuardar}
          className={`inline-flex items-center px-6 py-3 font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            saved
              ? 'bg-green-500 text-white focus:ring-green-500'
              : 'bg-[#01257D] text-white hover:bg-[#013AAA] focus:ring-[#01257D]'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Guardado
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar configuracion
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
