import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, User, MapPin, Briefcase, Facebook, Instagram, Linkedin, Globe, ArrowUpRight } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';

type ResultadoBusqueda = {
  id: string;
  nombre: string;
  profesion: string;
  ubicacion: string;
  edad: number;
  foto: string;
  sentimiento: 'positivo' | 'negativo' | 'neutro' | 'mixto';
  puntuacion: number;
  presencia: {
    x: boolean;
    facebook: boolean;
    instagram: boolean;
    linkedin: boolean;
    web: boolean;
  };
  menciones: number;
};

interface PersonaCardProps {
  persona: ResultadoBusqueda;
  onClick: () => void;
}

export default function PersonaCard({ persona, onClick }: PersonaCardProps) {
  // Determinar el color y el icono según el sentimiento
  const getSentimientoInfo = (sentimiento: string) => {
    switch (sentimiento) {
      case 'positivo':
        return { color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 className="mr-1 h-4 w-4" /> };
      case 'negativo':
        return { color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlertTriangle className="mr-1 h-4 w-4" /> };
      case 'mixto':
        return { color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <AlertTriangle className="mr-1 h-4 w-4" /> };
      default:
        return { color: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: null };
    }
  };

  const { color, icon } = getSentimientoInfo(persona.sentimiento);

  // Obtener color de la puntuación
  const getPuntuacionColor = (puntuacion: number) => {
    if (puntuacion >= 70) return 'text-green-600 dark:text-green-400';
    if (puntuacion >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start">
          {/* Avatar o foto de perfil */}
          <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            {persona.foto ? (
              <img src={persona.foto} alt={persona.nombre} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          
          {/* Información principal */}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{persona.nombre}</h3>
            <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Briefcase className="mr-1 h-4 w-4" />
              {persona.profesion}
            </div>
            <div className="mt-1 flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="mr-1 h-4 w-4" />
              {persona.ubicacion}
            </div>
          </div>
          
          {/* Puntuación de reputación */}
          <div className="ml-4 text-center">
            <div className={`text-2xl font-bold ${getPuntuacionColor(persona.puntuacion)}`}>
              {persona.puntuacion}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Reputación</div>
          </div>
        </div>
        
        {/* Sentimiento y presencia online */}
        <div className="mt-4 flex items-center justify-between">
          <div className={`flex items-center rounded-full px-3 py-1 text-xs font-medium ${color}`}>
            {icon}
            {persona.sentimiento.charAt(0).toUpperCase() + persona.sentimiento.slice(1)}
          </div>
          
          <div className="flex space-x-1">
            {persona.presencia.x && <XLogo className="h-4 w-4" />}
            {persona.presencia.facebook && <Facebook className="h-4 w-4 text-[#1877F2]" />}
            {persona.presencia.instagram && <Instagram className="h-4 w-4 text-[#E4405F]" />}
            {persona.presencia.linkedin && <Linkedin className="h-4 w-4 text-[#0A66C2]" />}
            {persona.presencia.web && <Globe className="h-4 w-4 text-gray-500" />}
          </div>
        </div>
        
        {/* Menciones y botón de ver más */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {persona.menciones.toLocaleString()} menciones
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClick} className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Ver análisis
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
