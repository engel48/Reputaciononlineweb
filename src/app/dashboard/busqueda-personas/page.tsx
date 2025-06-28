"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, User, MapPin, Briefcase, AlertTriangle, CheckCircle2, Clock, RefreshCcw, Facebook, Instagram, Linkedin, Globe } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';

// Definición de tipos
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

type PersonaDetalle = ResultadoBusqueda & {
  noticias: Array<{
    id: string;
    titulo: string;
    fuente: string;
    fecha: string;
    sentimiento: 'positivo' | 'negativo' | 'neutro';
    url: string;
  }>;
  redes: Array<{
    plataforma: string;
    usuario: string;
    url: string;
    seguidores: number;
    sentimiento: 'positivo' | 'negativo' | 'neutro' | 'mixto';
  }>;
  empresas: Array<{
    nombre: string;
    cargo: string;
    periodo: string;
  }>;
  educacion: Array<{
    institucion: string;
    titulo: string;
    periodo: string;
  }>;
};

// Componente para mostrar una tarjeta de persona
const PersonaCard = ({ persona, onClick }: { persona: ResultadoBusqueda; onClick: () => void }) => {
  return (
    <Card className="hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center">
            {persona.foto ? (
              <img src={persona.foto} alt={persona.nombre} className="rounded-full w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-gray-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{persona.nombre}</h3>
            <div className="flex items-center text-sm text-gray-600 gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{persona.profesion}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 gap-1">
              <MapPin className="w-4 h-4" />
              <span>{persona.ubicacion}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
              persona.sentimiento === 'positivo' ? 'bg-green-100 text-green-800' : 
              persona.sentimiento === 'negativo' ? 'bg-red-100 text-red-800' : 
              persona.sentimiento === 'neutro' ? 'bg-gray-100 text-gray-800' : 
              'bg-yellow-100 text-yellow-800'}`}>
              {persona.sentimiento === 'positivo' && <CheckCircle2 className="w-3 h-3" />}
              {persona.sentimiento === 'negativo' && <AlertTriangle className="w-3 h-3" />}
              {persona.sentimiento === 'neutro' && <Clock className="w-3 h-3" />}
              {persona.sentimiento === 'mixto' && <RefreshCcw className="w-3 h-3" />}
              <span className="capitalize">{persona.sentimiento}</span>
            </div>
            <div className="mt-2 font-bold text-lg">{persona.puntuacion}/100</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Datos simulados para resultados de búsqueda
const resultadosSimulados: ResultadoBusqueda[] = [
  {
    id: '1',
    nombre: 'Carlos Rodríguez',
    profesion: 'Abogado',
    ubicacion: 'Bogotá, Colombia',
    edad: 45,
    foto: '/img/profile1.jpg',
    sentimiento: 'positivo',
    puntuacion: 85,
    presencia: {
      x: true,
      facebook: true,
      instagram: true,
      linkedin: true,
      web: true
    },
    menciones: 320
  },
  {
    id: '2',
    nombre: 'María González',
    profesion: 'Periodista',
    ubicacion: 'Medellín, Colombia',
    edad: 38,
    foto: '/img/profile2.jpg',
    sentimiento: 'neutro',
    puntuacion: 65,
    presencia: {
      x: true,
      facebook: true,
      instagram: true,
      linkedin: false,
      web: false
    },
    menciones: 180
  },
  {
    id: '3',
    nombre: 'Andrés Martínez',
    profesion: 'Empresario',
    ubicacion: 'Cali, Colombia',
    edad: 52,
    foto: '/img/profile3.jpg',
    sentimiento: 'mixto',
    puntuacion: 60,
    presencia: {
      x: true,
      facebook: false,
      instagram: true,
      linkedin: true,
      web: true
    },
    menciones: 250
  },
  {
    id: '4',
    nombre: 'Laura Pérez',
    profesion: 'Política',
    ubicacion: 'Barranquilla, Colombia',
    edad: 41,
    foto: '/img/profile4.jpg',
    sentimiento: 'negativo',
    puntuacion: 40,
    presencia: {
      x: true,
      facebook: true,
      instagram: false,
      linkedin: true,
      web: true
    },
    menciones: 320
  }
];

// Datos detallados para una persona específica
const personaDetalleSimulada: PersonaDetalle = {
  ...resultadosSimulados[0],
  noticias: [
    {
      id: 'n1',
      titulo: 'Carlos Rodríguez presenta nuevo proyecto de ley sobre transparencia',
      fuente: 'El Tiempo',
      fecha: '15 mayo, 2023',
      sentimiento: 'positivo',
      url: '#'
    },
    {
      id: 'n2',
      titulo: 'Entrevista exclusiva con Carlos Rodríguez sobre reforma judicial',
      fuente: 'Caracol Radio',
      fecha: '2 mayo, 2023',
      sentimiento: 'neutro',
      url: '#'
    },
    {
      id: 'n3',
      titulo: 'Carlos Rodríguez participa en debate sobre derechos humanos',
      fuente: 'Semana',
      fecha: '28 abril, 2023',
      sentimiento: 'positivo',
      url: '#'
    },
    {
      id: 'n4',
      titulo: 'Controversia por comentarios de Carlos Rodríguez en caso judicial',
      fuente: 'El Espectador',
      fecha: '15 abril, 2023',
      sentimiento: 'negativo',
      url: '#'
    }
  ],
  redes: [
    {
      plataforma: 'X',
      usuario: '@carlosrodriguez',
      url: '#',
      seguidores: 58700,
      sentimiento: 'positivo'
    },
    {
      plataforma: 'Facebook',
      usuario: 'Carlos Rodríguez Oficial',
      url: '#',
      seguidores: 125000,
      sentimiento: 'mixto'
    },
    {
      plataforma: 'Instagram',
      usuario: '@carlosrodriguezoficial',
      url: '#',
      seguidores: 35200,
      sentimiento: 'positivo'
    },
    {
      plataforma: 'LinkedIn',
      usuario: 'Carlos Rodríguez',
      url: '#',
      seguidores: 8500,
      sentimiento: 'neutro'
    }
  ],
  empresas: [
    {
      nombre: 'Rodríguez & Asociados',
      cargo: 'Socio Fundador',
      periodo: '2010 - Presente'
    },
    {
      nombre: 'Ministerio de Justicia',
      cargo: 'Asesor Jurídico',
      periodo: '2008 - 2010'
    },
    {
      nombre: 'Universidad Nacional de Colombia',
      cargo: 'Profesor Asociado',
      periodo: '2005 - 2008'
    }
  ],
  educacion: [
    {
      institucion: 'Universidad de Los Andes',
      titulo: 'Maestría en Derecho Constitucional',
      periodo: '2002 - 2004'
    },
    {
      institucion: 'Universidad Javeriana',
      titulo: 'Pregrado en Derecho',
      periodo: '1997 - 2002'
    }
  ]
};

// Componente principal para la página de búsqueda de personas
export default function BusquedaPersonas() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<PersonaDetalle | null>(null);
  const [tabActiva, setTabActiva] = useState('general');

  // Simular búsqueda al presionar Enter
  const handleBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Simulación de búsqueda con datos estáticos
      setResultados(resultadosSimulados);
    }
  };

  // Mostrar detalles de persona
  const verDetalles = (id: string) => {
    const personaEncontrada = resultadosSimulados.find(p => p.id === id);
    if (personaEncontrada) {
      setPersonaSeleccionada(personaDetalleSimulada);
    }
  };

  // Cerrar vista de detalles
  const cerrarDetalles = () => {
    setPersonaSeleccionada(null);
    setTabActiva('general');
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">Búsqueda de Personas</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Encuentra información y analiza la reputación online de personas en Colombia
        </p>
      </motion.div>
      
      {/* Formulario de búsqueda */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            type="text" 
            placeholder="Busca por nombre, profesión o ubicación..." 
            className="pl-10 py-6 rounded-full shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleBusqueda}
          />
          <Button 
            className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full" 
            onClick={() => setResultados(resultadosSimulados)}
          >
            Buscar
          </Button>
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {resultados.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold mb-4">Resultados ({resultados.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {resultados.map((persona) => (
              <PersonaCard 
                key={persona.id} 
                persona={persona} 
                onClick={() => verDetalles(persona.id)} 
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal de detalles de persona */}
      <Dialog open={!!personaSeleccionada} onOpenChange={() => personaSeleccionada && cerrarDetalles()}>
        <DialogContent className="max-w-4xl">
          {personaSeleccionada && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{personaSeleccionada.nombre}</DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col md:flex-row gap-6 mt-4">
                {/* Sidebar con información básica */}
                <div className="md:w-1/3">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center">
                        {personaSeleccionada.foto ? (
                          <img src={personaSeleccionada.foto} alt={personaSeleccionada.nombre} className="rounded-full w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold">{personaSeleccionada.nombre}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{personaSeleccionada.profesion}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{personaSeleccionada.ubicacion}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
                          personaSeleccionada.sentimiento === 'positivo' ? 'bg-green-100 text-green-800' : 
                          personaSeleccionada.sentimiento === 'negativo' ? 'bg-red-100 text-red-800' : 
                          personaSeleccionada.sentimiento === 'neutro' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                          {personaSeleccionada.sentimiento === 'positivo' && <CheckCircle2 className="w-3 h-3" />}
                          {personaSeleccionada.sentimiento === 'negativo' && <AlertTriangle className="w-3 h-3" />}
                          {personaSeleccionada.sentimiento === 'neutro' && <Clock className="w-3 h-3" />}
                          {personaSeleccionada.sentimiento === 'mixto' && <RefreshCcw className="w-3 h-3" />}
                          <span className="capitalize">{personaSeleccionada.sentimiento}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-2">Redes sociales</h4>
                      <div className="flex flex-wrap gap-2">
                        {personaSeleccionada.presencia.x && (
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                            <XLogo className="w-3 h-3" />
                            <span>X</span>
                          </Button>
                        )}
                        {personaSeleccionada.presencia.facebook && (
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                            <Facebook className="w-3 h-3" />
                            <span>Facebook</span>
                          </Button>
                        )}
                        {personaSeleccionada.presencia.instagram && (
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                            <Instagram className="w-3 h-3" />
                            <span>Instagram</span>
                          </Button>
                        )}
                        {personaSeleccionada.presencia.linkedin && (
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                            <Linkedin className="w-3 h-3" />
                            <span>LinkedIn</span>
                          </Button>
                        )}
                        {personaSeleccionada.presencia.web && (
                          <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>Web</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contenido principal */}
                <div className="md:w-2/3">
                  <Tabs value={tabActiva} onValueChange={setTabActiva}>
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="noticias">Noticias</TabsTrigger>
                      <TabsTrigger value="perfil">Perfil</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="general" className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">Resumen</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {personaSeleccionada.nombre} es un {personaSeleccionada.profesion.toLowerCase()} con presencia online {personaSeleccionada.sentimiento}. 
                          Cuenta con {personaSeleccionada.menciones} menciones en medios digitales y una puntuación de reputación de {personaSeleccionada.puntuacion}/100.
                        </p>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">Últimas noticias</h3>
                        <div className="space-y-2">
                          {personaSeleccionada.noticias.slice(0, 2).map((noticia) => (
                            <div key={noticia.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                              <h4 className="font-medium">{noticia.titulo}</h4>
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>{noticia.fuente}</span>
                                <span>{noticia.fecha}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="noticias" className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Menciones en medios</h3>
                        <div className="space-y-4">
                          {personaSeleccionada.noticias.map((noticia) => (
                            <div key={noticia.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                              <h4 className="font-medium">{noticia.titulo}</h4>
                              <div className="flex justify-between text-sm text-gray-500 mt-1">
                                <span>{noticia.fuente}</span>
                                <span>{noticia.fecha}</span>
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
                                  noticia.sentimiento === 'positivo' ? 'bg-green-100 text-green-800' : 
                                  noticia.sentimiento === 'negativo' ? 'bg-red-100 text-red-800' : 
                                  'bg-gray-100 text-gray-800'}`}>
                                  {noticia.sentimiento === 'positivo' && <CheckCircle2 className="w-3 h-3" />}
                                  {noticia.sentimiento === 'negativo' && <AlertTriangle className="w-3 h-3" />}
                                  {noticia.sentimiento === 'neutro' && <Clock className="w-3 h-3" />}
                                  <span className="capitalize">{noticia.sentimiento}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-xs" asChild>
                                  <a href={noticia.url} target="_blank" rel="noopener noreferrer">Ver noticia</a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="perfil" className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">Experiencia profesional</h3>
                        <div className="space-y-3 mt-3">
                          {personaSeleccionada.empresas.map((empresa, index) => (
                            <div key={index} className="border-l-2 border-primary-200 pl-4 pb-3">
                              <h4 className="font-medium">{empresa.cargo}</h4>
                              <p className="text-sm">{empresa.nombre}</p>
                              <p className="text-xs text-gray-500">{empresa.periodo}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">Educación</h3>
                        <div className="space-y-3 mt-3">
                          {personaSeleccionada.educacion.map((edu, index) => (
                            <div key={index} className="border-l-2 border-primary-200 pl-4 pb-3">
                              <h4 className="font-medium">{edu.titulo}</h4>
                              <p className="text-sm">{edu.institucion}</p>
                              <p className="text-xs text-gray-500">{edu.periodo}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">Redes sociales</h3>
                        <div className="space-y-3 mt-3">
                          {personaSeleccionada.redes.map((red, index) => (
                            <div key={index} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 last:border-0">
                              <div className="flex items-center gap-2">
                                {red.plataforma === 'X' && <XLogo className="w-4 h-4" />}
                                {red.plataforma === 'Facebook' && <Facebook className="w-4 h-4" />}
                                {red.plataforma === 'Instagram' && <Instagram className="w-4 h-4" />}
                                {red.plataforma === 'LinkedIn' && <Linkedin className="w-4 h-4" />}
                                <div>
                                  <div className="font-medium">{red.plataforma}</div>
                                  <div className="text-xs text-gray-500">{red.usuario}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{red.seguidores.toLocaleString()} seguidores</div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
                                  red.sentimiento === 'positivo' ? 'bg-green-100 text-green-800' : 
                                  red.sentimiento === 'negativo' ? 'bg-red-100 text-red-800' : 
                                  red.sentimiento === 'neutro' ? 'bg-gray-100 text-gray-800' : 
                                  'bg-yellow-100 text-yellow-800'}`}>
                                  <span className="capitalize">{red.sentimiento}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
