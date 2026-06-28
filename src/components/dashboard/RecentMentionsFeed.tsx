"use client";

import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Youtube, Globe, MessageSquare, RefreshCw } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';

interface Mention {
  id: string;
  author: string;
  platform: string;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: string;
}

function PlatformIcon({ platform }: { platform: string }) {
  switch ((platform || '').toLowerCase()) {
    case 'x':
    case 'twitter':
      return <XLogo className="h-4 w-4" />;
    case 'facebook':
      return <Facebook className="h-4 w-4 text-[#1877F2]" />;
    case 'instagram':
      return <Instagram className="h-4 w-4 text-[#E4405F]" />;
    case 'youtube':
      return <Youtube className="h-4 w-4 text-[#FF0000]" />;
    default:
      return <Globe className="h-4 w-4 text-gray-500" />;
  }
}

const sentimentChip: Record<string, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};
const sentimentLabel: Record<string, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
};

/**
 * Feed de menciones recientes del usuario. Reemplaza al mapa geográfico (que
 * exigía lat/lng que las menciones casi nunca traen). Usa /api/mentions/recent
 * (consulta a la BD, sin IA ni tokens). Carga bajo demanda + botón de refrescar.
 */
export default function RecentMentionsFeed() {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentions/recent?limit=15&hours=720', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json?.success) setMentions(json.data?.mentions || []);
      }
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/50 dark:from-gray-800 dark:to-blue-900/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#01257D] rounded-lg">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Menciones recientes</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimas menciones detectadas en tus redes y medios</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        {loading && mentions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">Cargando menciones…</div>
        ) : mentions.length === 0 ? (
          <div className="p-10 text-center">
            <MessageSquare className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aún no hay menciones</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Conecta tus redes y activa el monitoreo; las menciones aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          mentions.map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                <PlatformIcon platform={m.platform} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-white truncate">{m.author}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {m.timestamp ? new Date(m.timestamp).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">{m.content}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${sentimentChip[m.sentiment] || sentimentChip.neutral}`}>
                  {sentimentLabel[m.sentiment] || 'Neutral'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
