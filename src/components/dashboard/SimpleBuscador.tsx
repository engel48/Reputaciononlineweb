"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Crown, Building, Globe } from 'lucide-react';
import AnalysisModal from './AnalysisModal';

interface Resultado {
  id: string;
  name: string;
  type: string;
  country: string;
  category: string;
}

export default function SimpleBuscador() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string>('');

  const buscar = async () => {
    if (!query.trim()) return;
    
    setBuscando(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setResultados(data.results || []);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const buscarRapida = (termino: string) => {
    setQuery(termino);
    setTimeout(() => {
      buscar();
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'político': return <Crown className="w-4 h-4" />;
      case 'influencer': return <User className="w-4 h-4" />;
      case 'empresa': return <Building className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const analizarPersonalidad = (name: string) => {
    setSelectedPersonality(name);
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

  return (
    <div className="space-y-4">
      {/* Input de búsqueda - RESPONSIVE */}
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe aquí: Petro, Luisa Fernanda W, Bancolombia..."
            className="w-full pl-10 pr-4 py-2 sm:py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white text-base sm:text-lg"
            style={{ fontSize: '16px', minHeight: '44px' }}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <motion.button
          onClick={buscar}
          disabled={buscando}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#01257D] to-blue-600 text-white rounded-xl hover:from-[#013AAA] hover:to-blue-700 font-semibold text-base sm:text-lg disabled:opacity-50 w-full sm:w-auto"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {buscando ? '🔄' : '🔍'} {buscando ? 'Buscando...' : 'Buscar'}
        </motion.button>
      </div>
      
      {/* Sugerencias rápidas */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Prueba buscar:</span>
        <button 
          onClick={() => buscarRapida('Gustavo Petro')}
          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200"
        >
          Gustavo Petro
        </button>
        <button 
          onClick={() => buscarRapida('Luisa Fernanda W')}
          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm hover:bg-purple-200"
        >
          Luisa Fernanda W
        </button>
        <button 
          onClick={() => buscarRapida('Bancolombia')}
          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm hover:bg-green-200"
        >
          Bancolombia
        </button>
      </div>
      
      {/* Área de resultados */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-600">
        {buscando ? (
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400">Buscando...</p>
          </div>
        ) : resultados.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Encontrados {resultados.length} resultados:
            </p>
            {resultados.map((resultado) => (
              <motion.div
                key={resultado.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      {getIcon(resultado.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {resultado.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {resultado.category} • {resultado.country}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => analizarPersonalidad(resultado.name)}
                    className="px-3 py-1 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] text-sm flex items-center space-x-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Globe className="w-3 h-3" />
                    <span>Analizar</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : query && !buscando ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No se encontraron resultados para "{query}"</p>
            <p className="text-sm mt-1">Intenta con: Petro, Luisa Fernanda, Bancolombia</p>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Los resultados de búsqueda aparecerán aquí
          </p>
        )}
      </div>

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