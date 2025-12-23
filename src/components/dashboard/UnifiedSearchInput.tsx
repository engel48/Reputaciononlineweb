"use client";

import React, { useState, useCallback } from 'react';
import { Search, X, Hash, AtSign, Newspaper, Loader2 } from 'lucide-react';

interface UnifiedSearchInputProps {
  onSearch: (query: string, type: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export default function UnifiedSearchInput({
  onSearch,
  placeholder = "Buscar @cuenta, #hashtag o palabra clave...",
  loading = false,
  className = ""
}: UnifiedSearchInputProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  // Detectar tipo de búsqueda basado en el prefijo
  const detectSearchType = (searchQuery: string): string => {
    const trimmed = searchQuery.trim();
    if (trimmed.startsWith('@')) return 'social';
    if (trimmed.startsWith('#')) return 'hashtags';
    return 'all';
  };

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      const type = detectSearchType(query);
      onSearch(query.trim(), type);
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', 'all');
  };

  // Detectar tipo actual para mostrar indicador
  const currentType = detectSearchType(query);

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 bg-white dark:bg-gray-800
        ${focused
          ? 'border-[#00E5FF] shadow-[0_0_0_3px_rgba(0,229,255,0.1)]'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        {/* Icono de búsqueda o tipo */}
        <div className="flex items-center justify-center w-12 h-12">
          {loading ? (
            <Loader2 className="h-5 w-5 text-[#00E5FF] animate-spin" />
          ) : currentType === 'social' ? (
            <AtSign className="h-5 w-5 text-blue-500" />
          ) : currentType === 'hashtags' ? (
            <Hash className="h-5 w-5 text-purple-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 py-3 pr-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base"
        />

        {/* Botón de limpiar */}
        {query && (
          <button
            onClick={handleClear}
            className="p-2 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Botón de buscar */}
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={`flex items-center gap-2 px-4 py-2 mr-2 rounded-lg font-medium text-sm transition-colors
            ${query.trim() && !loading
              ? 'bg-[#00E5FF] text-white hover:bg-[#00B8D4]'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
        >
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </div>

      {/* Sugerencias de búsqueda */}
      {focused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-10">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Sugerencias de búsqueda:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuery('@')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30"
            >
              <AtSign className="h-3.5 w-3.5" />
              @cuenta
            </button>
            <button
              onClick={() => setQuery('#')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <Hash className="h-3.5 w-3.5" />
              #hashtag
            </button>
            <button
              onClick={() => setQuery('')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Newspaper className="h-3.5 w-3.5" />
              palabra clave
            </button>
          </div>
        </div>
      )}

      {/* Indicador de tipo de búsqueda */}
      {query && (
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500 dark:text-gray-400">
          {currentType === 'social' && (
            <span className="flex items-center gap-1">
              <AtSign className="h-3 w-3 text-blue-500" />
              Buscando cuentas en redes sociales
            </span>
          )}
          {currentType === 'hashtags' && (
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-purple-500" />
              Buscando hashtags
            </span>
          )}
          {currentType === 'all' && (
            <span className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Buscando en noticias y redes sociales
            </span>
          )}
        </div>
      )}
    </div>
  );
}
