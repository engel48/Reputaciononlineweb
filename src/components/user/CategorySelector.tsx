"use client";

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface CategoryData {
  category: string;
  brandName?: string;
  otherCategory?: string;
  additionalSources?: string[];
}

interface CategorySelectorProps {
  onCategoryChange?: (data: CategoryData) => void;
  initialCategory?: string;
}

const categories = [
  'Sector político y gubernamental (Gobernante, candidato, líder, partido político y similares)',
  'Entretenimiento (artista, influencer, coach, deportista y similares)',
  'Liderazgo (Líder gremial, CEO, líder de opinión, periodista y similares)',
  'Marca / empresa',
  'Sector turismo',
  'Sector educativo',
  'Sector bancario / financiero',
  'Sector salud',
  'Entidad sin ánimo de lucro / ONG',
  'Agencia / consultor',
  'Otro'
];

export default function CategorySelector({ onCategoryChange, initialCategory = 'personal' }: CategorySelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [brandName, setBrandName] = useState<string>('');
  const [otherCategory, setOtherCategory] = useState<string>('');
  const [additionalSources, setAdditionalSources] = useState<string[]>([]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    
    // Limpiar campos condicionales cuando cambia la categoría
    setBrandName('');
    setOtherCategory('');
    setAdditionalSources([]);
    
    // Si selecciona "Sector turismo", activar fuentes adicionales
    if (category === 'Sector turismo') {
      setAdditionalSources(['tripadvisor', 'booking', 'expedia', 'airbnb']);
    }
    
    if (onCategoryChange) {
      onCategoryChange({
        category,
        brandName: category === 'Marca / empresa' ? brandName : '',
        otherCategory: category === 'Otro' ? otherCategory : '',
        additionalSources: category === 'Sector turismo' ? ['tripadvisor', 'booking', 'expedia', 'airbnb'] : []
      });
    }
  };

  const handleBrandNameChange = (name: string) => {
    setBrandName(name);
    if (onCategoryChange) {
      onCategoryChange({
        category: selectedCategory,
        brandName: name,
        otherCategory,
        additionalSources
      });
    }
  };

  const handleOtherCategoryChange = (other: string) => {
    setOtherCategory(other);
    if (onCategoryChange) {
      onCategoryChange({
        category: selectedCategory,
        brandName,
        otherCategory: other,
        additionalSources
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Selecciona tu categoría</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Esto nos permitirá personalizar tu experiencia y las herramientas de monitoreo
      </p>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((category, index) => {
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleCategoryChange(category)}
              className={`flex flex-col items-center justify-center rounded-lg border p-4 transition-all ${
                selectedCategory === category
                  ? 'border-[#01257D] bg-[#01257D]/10 text-[#01257D]'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-[#01257D]/50 hover:bg-[#01257D]/5'
              } dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-[#01257D]/50 dark:hover:bg-[#01257D]/10 dark:hover:text-[#01257D]`}
            >
              <span className="text-sm font-medium">{category}</span>
            </button>
          );
        })}
      </div>

      {/* Campo condicional para Marca / empresa */}
      {selectedCategory === 'Marca / empresa' && (
        <div className="mt-4">
          <label htmlFor="brand-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nombre de la marca / empresa
          </label>
          <input
            type="text"
            id="brand-name"
            value={brandName}
            onChange={(e) => handleBrandNameChange(e.target.value)}
            placeholder="Ingresa el nombre de tu marca o empresa"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {/* Campo condicional para Otro */}
      {selectedCategory === 'Otro' && (
        <div className="mt-4">
          <label htmlFor="other-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ¿Cuál?
          </label>
          <input
            type="text"
            id="other-category"
            value={otherCategory}
            onChange={(e) => handleOtherCategoryChange(e.target.value)}
            placeholder="Especifica tu categoría"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01257D] focus:border-[#01257D] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {/* Información adicional para Sector turismo */}
      {selectedCategory === 'Sector turismo' && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center mb-2">
            <ExternalLink className="h-5 w-5 text-[#01257D] mr-2" />
            <h4 className="text-sm font-semibold text-[#01257D] dark:text-blue-400">
              Fuentes adicionales activadas
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Al seleccionar Sector turismo, se activarán automáticamente las siguientes fuentes de monitoreo:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
            <li>Tripadvisor</li>
            <li>Booking.com</li>
            <li>Expedia</li>
            <li>Airbnb</li>
          </ul>
        </div>
      )}
    </div>
  );
}
