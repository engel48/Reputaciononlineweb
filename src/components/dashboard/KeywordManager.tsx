'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, X, Loader2, AlertCircle, Check,
  Settings, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeywordManagerProps {
  onKeywordsChange?: (keywords: string[]) => void;
  compact?: boolean;
  className?: string;
}

export default function KeywordManager({
  onKeywordsChange,
  compact = false,
  className = ''
}: KeywordManagerProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  // Cargar keywords del usuario
  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/keywords');
      const data = await response.json();

      if (data.success) {
        setKeywords(data.data.keywords || []);
        setUserName(data.data.userName || '');
        onKeywordsChange?.(data.data.keywords || []);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Error al cargar palabras clave');
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/user/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setKeywords(data.data.keywords);
        setNewKeyword('');
        setSuccess('Palabra clave agregada');
        onKeywordsChange?.(data.data.keywords);
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Error al agregar palabra clave');
    } finally {
      setSaving(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/user/keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword })
      });

      const data = await response.json();

      if (data.success) {
        setKeywords(data.data.keywords);
        onKeywordsChange?.(data.data.keywords);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Error al eliminar palabra clave');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#00E5FF]" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Cargando palabras clave...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 ${compact ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
            <Tag className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              Palabras Clave de Monitoreo
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {keywords.length}/10 configuradas
            </p>
          </div>
        </div>

        {compact && (
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Default keyword (nombre del usuario) */}
          {userName && (
            <div className="flex items-center gap-2 p-2 bg-[#00E5FF]/5 rounded-lg border border-[#00E5FF]/20">
              <Search className="w-4 h-4 text-[#00E5FF]" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Búsqueda automática: <strong className="text-[#0B1120] dark:text-[#00E5FF]">{userName}</strong>
              </span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">(tu nombre)</span>
            </div>
          )}

          {/* Input para agregar keyword */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Agregar palabra clave..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF]"
                disabled={saving}
                maxLength={50}
              />
            </div>
            <Button
              onClick={addKeyword}
              disabled={saving || !newKeyword.trim() || keywords.length >= 10}
              className="bg-[#00E5FF] hover:bg-[#00B8D4] text-[#0B1120] font-medium px-4"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Lista de keywords */}
          {keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Tag className="w-3 h-3 text-gray-400" />
                  <span>{keyword}</span>
                  <button
                    onClick={() => removeKeyword(keyword)}
                    disabled={saving}
                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay palabras clave configuradas</p>
              <p className="text-xs mt-1">Agrega palabras clave para monitorear menciones específicas</p>
            </div>
          )}

          {/* Error/Success messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 text-sm">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Info */}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Las palabras clave se usarán para filtrar menciones en noticias y redes sociales.
          </p>
        </div>
      )}
    </div>
  );
}
