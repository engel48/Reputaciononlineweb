"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Save, Sliders, Repeat, RotateCcw, Bot, Thermometer, Shuffle, ShieldAlert } from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin';

interface AiConfig {
  temperature: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
  maxOffContextAttempts: number;
  outOfScopeMessage: string;
  redirectMessage: string;
  crisisKeywords: string[];
  crisisMessage: string;
}

const DEFAULTS: AiConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
  maxOffContextAttempts: 3,
  outOfScopeMessage:
    'Soy Julia, tu asistente de reputación online. Ese tema está fuera de mi alcance. ¿Querés que te ayude con tus menciones, sentimiento, crisis o redes?',
  redirectMessage:
    'Parece que nos estamos desviando del tema. Te regreso al menú principal para ayudarte mejor con tu reputación online. 🧭',
  crisisKeywords: [],
  crisisMessage:
    'Detectamos un mensaje delicado. Julia no puede ayudarte con esto. Si estás en peligro o en crisis, comunicate con la línea de ayuda de tu país o con un profesional de inmediato.',
};

export default function AdminIaPage() {
  const [config, setConfig] = useState<AiConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai-config', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setConfig({ ...DEFAULTS, ...json.config });
    } catch (err: any) {
      setError(err.message || 'Error cargando configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ config }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setConfig({ ...DEFAULTS, ...json.config });
      setSavedAt(new Date().toLocaleTimeString('es-CO'));
    } catch (err: any) {
      setError(err.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof AiConfig>(k: K, v: AiConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  return (
    <AdminPageWrapper title="Calibración de la IA" subtitle="Ajustá el comportamiento de Julia (uso exclusivo de administradores)">
      <div className="max-w-3xl space-y-4">
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        {loading ? (
          <div className="p-12 text-center text-gray-500"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />Cargando...</div>
        ) : (
          <>
            {/* Comportamiento del modelo */}
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Sliders className="w-4 h-4 text-[#01257D]" /> Comportamiento del modelo</h3>

              <SliderRow
                icon={<Thermometer className="w-4 h-4 text-cyan-600" />}
                label="Adherencia al rol (Temperatura)"
                help="Bajo = respuestas estructuradas y predecibles. Alto = más fluido y creativo."
                min={0} max={1.5} step={0.05}
                value={config.temperature}
                onChange={(v) => set('temperature', v)}
                leftLabel="Estructurada" rightLabel="Fluida"
              />

              <SliderRow
                icon={<Repeat className="w-4 h-4 text-cyan-600" />}
                label="Penalización de frecuencia"
                help="Evita que repita las mismas palabras. Más alto = menos repeticiones literales."
                min={0} max={2} step={0.1}
                value={config.frequencyPenalty}
                onChange={(v) => set('frequencyPenalty', v)}
                leftLabel="Permite repetir" rightLabel="Evita repetir"
              />

              <SliderRow
                icon={<Shuffle className="w-4 h-4 text-cyan-600" />}
                label="Penalización de presencia"
                help="Evita que se quede en los mismos temas/bucles. Más alto = más variedad temática."
                min={0} max={2} step={0.1}
                value={config.presencePenalty}
                onChange={(v) => set('presencePenalty', v)}
                leftLabel="Mismo tema" rightLabel="Más variedad"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tope de tokens por respuesta</label>
                <input
                  type="number" min={256} max={4096} step={64}
                  value={config.maxTokens}
                  onChange={(e) => set('maxTokens', parseInt(e.target.value || '0', 10))}
                  className="w-40 px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Longitud máxima de cada respuesta (256–4096).</p>
              </div>
            </section>

            {/* Protocolo de reincidencia */}
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><RotateCcw className="w-4 h-4 text-[#01257D]" /> Umbral de reincidencia (fuera de contexto)</h3>
              <p className="text-sm text-gray-500">
                Si el usuario insiste en salirse del tema <b>N</b> veces seguidas, Julia lo redirige automáticamente al menú principal.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intentos consecutivos permitidos (0 = desactivado)</label>
                <input
                  type="number" min={0} max={10} step={1}
                  value={config.maxOffContextAttempts}
                  onChange={(e) => set('maxOffContextAttempts', parseInt(e.target.value || '0', 10))}
                  className="w-28 px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de salida de contexto</label>
                <textarea
                  rows={2}
                  value={config.outOfScopeMessage}
                  onChange={(e) => set('outOfScopeMessage', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm"
                  placeholder="Respuesta estandarizada cuando el usuario se sale del tema (antes de llegar al umbral)"
                />
                <p className="text-xs text-gray-500 mt-1">Se muestra en cada desvío del tema, reconduciendo a las funciones de la plataforma.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de redirección (al superar el umbral)</label>
                <textarea
                  rows={2}
                  value={config.redirectMessage}
                  onChange={(e) => set('redirectMessage', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm"
                  placeholder="Mensaje que verá el usuario al superar el umbral"
                />
              </div>
            </section>

            {/* Cortafuegos de seguridad / crisis */}
            <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-600" /> Cortafuegos de seguridad (crisis)</h3>
              <p className="text-sm text-gray-500">
                Diccionario de palabras/frases de alta prioridad. Si el mensaje del usuario coincide con
                alguna, <b>se suspende la IA</b> y se muestra el mensaje de crisis de inmediato (no llama al
                modelo ni descuenta créditos). Comparación sin acentos ni mayúsculas.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Palabras / frases clave (una por línea)</label>
                <textarea
                  rows={5}
                  value={config.crisisKeywords.join('\n')}
                  onChange={(e) => set('crisisKeywords', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
                  className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm font-mono"
                  placeholder={'me quiero morir\nhacerme daño\nemergencia médica'}
                />
                <p className="text-xs text-gray-500 mt-1">{config.crisisKeywords.length} término(s) configurado(s).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de crisis</label>
                <textarea
                  rows={3}
                  value={config.crisisMessage}
                  onChange={(e) => set('crisisMessage', e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-300 text-gray-900 text-sm"
                  placeholder="Mensaje prioritario que se muestra ante una palabra de crisis"
                />
              </div>
            </section>

            <div className="flex items-center gap-3">
              <button onClick={save} disabled={saving} className="px-4 py-2.5 rounded-md bg-gradient-to-r from-[#01257D] to-[#013AAA] text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar configuración'}
              </button>
              <button onClick={() => setConfig(DEFAULTS)} className="px-4 py-2.5 rounded-md bg-gray-100 text-gray-700 text-sm hover:bg-gray-200">
                Restaurar valores por defecto
              </button>
              {savedAt && <span className="text-sm text-green-600 flex items-center gap-1"><Bot className="w-4 h-4" /> Guardado {savedAt}</span>}
            </div>
            <p className="text-xs text-gray-400">Los cambios aplican a las próximas respuestas de Julia (chat). No requiere redeploy.</p>
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
}

function SliderRow({
  icon, label, help, min, max, step, value, onChange, leftLabel, rightLabel,
}: {
  icon: React.ReactNode; label: string; help: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; leftLabel: string; rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">{icon}{label}</label>
        <span className="text-sm font-mono px-2 py-0.5 rounded bg-gray-100 text-[#01257D]">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#00B8CC]"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>{leftLabel}</span><span>{rightLabel}</span></div>
      <p className="text-xs text-gray-500 mt-1">{help}</p>
    </div>
  );
}
