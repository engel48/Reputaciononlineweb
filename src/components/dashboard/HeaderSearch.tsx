"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Crown, Building, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnalysisModal from './AnalysisModal';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  country: string;
  category: string;
}

export default function HeaderSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Solo agregar el listener cuando el dropdown está abierto
    if (isOpen) {
      // Usar capture para asegurar que se ejecute antes que otros handlers
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      // Limpiar timeout al desmontar
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen]);

  const searchPersonalities = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      setPreparing(false);
      return;
    }

    setPreparing(false);
    setLoading(true);
    // No cambiar isOpen aquí, ya debe estar en true
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Lógica simple: si hay texto, mostrar dropdown; si no, ocultarlo
    if (value.trim()) {
      setIsOpen(true);
      setPreparing(true);
      setLoading(false);
      setResults([]);
      
      // Debounce search
      debounceRef.current = setTimeout(() => {
        searchPersonalities(value);
      }, 300);
    } else {
      // No hay texto, cerrar todo
      setIsOpen(false);
      setResults([]);
      setLoading(false);
      setPreparing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'político': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'influencer': return <User className="w-4 h-4 text-blue-600" />;
      case 'empresa': return <Building className="w-4 h-4 text-green-600" />;
      default: return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const selectPersonality = (personality: SearchResult) => {
    setQuery(personality.name);
    setIsOpen(false);
    setSelectedPersonality(personality.name);
    setModalOpen(true);
  };

  const realizarAnalisisReal = async (name: string) => {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ personalityName: name }),
    });

    if (!response.ok) {
      throw new Error('Error en el análisis');
    }

    return await response.json();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setLoading(false);
    setPreparing(false);
    
    // Limpiar timeout pendiente
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  return (
    <div 
      ref={searchRef} 
      className="relative flex-1 max-w-md z-[100]"
      onMouseEnter={(e) => e.stopPropagation()}
      onMouseLeave={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          placeholder="Buscar personalidades..."
          className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm transition-all duration-200"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scaleY: 0.8 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -10, scaleY: 0.8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xl z-[999999] max-h-96 overflow-y-auto transform-gpu"
            style={{
              transformOrigin: 'top center',
              minHeight: '120px',
              width: '100%',
              position: 'absolute',
              zIndex: 999999
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-[#01257D] border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Buscando personalidades...</p>
                <p className="text-xs text-gray-400 mt-1">Analizando base de datos</p>
              </div>
            ) : preparing ? (
              <div className="p-4 text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="h-2 w-2 bg-[#01257D] rounded-full animate-pulse"></div>
                  <div className="h-2 w-2 bg-[#01257D] rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-2 w-2 bg-[#01257D] rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                </div>
                <p className="text-sm text-gray-500">Preparando búsqueda...</p>
                <p className="text-xs text-gray-400 mt-1">Escriba para buscar personalidades</p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.slice(0, 8).map((result) => (
                  <motion.button
                    key={result.id}
                    onClick={() => selectPersonality(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                    whileHover={{ backgroundColor: 'rgba(1, 37, 125, 0.05)' }}
                  >
                    <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {result.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {result.category} • {result.country}
                      </p>
                    </div>
                    <div className="text-xs text-[#01257D] font-medium">
                      Analizar →
                    </div>
                  </motion.button>
                ))}
                
                {results.length > 8 && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-600">
                    Mostrando 8 de {results.length} resultados
                  </div>
                )}
              </div>
            ) : query && !loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No se encontraron resultados para "{query}"
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Análisis */}
      <AnalysisModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        personalityName={selectedPersonality}
        onAnalyze={realizarAnalisisReal}
      />
    </div>
  );
}