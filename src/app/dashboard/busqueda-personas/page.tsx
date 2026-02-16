"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, User, MapPin, Briefcase, AlertTriangle, CheckCircle2, Clock, RefreshCcw, Facebook, Instagram, Youtube, Globe, Target, Loader2 } from 'lucide-react';
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
    youtube: boolean;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const PersonaCard = ({ persona, onClick }: { persona: ResultadoBusqueda; onClick: () => void }) => {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="hover:shadow-md transition-all cursor-pointer border-gray-100 dark:border-gray-700" onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#01257D] to-indigo-500 rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{persona.nombre}</h3>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-1">
                <Briefcase className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{persona.profesion}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{persona.ubicacion}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs gap-1 ${
                persona.sentimiento === 'positivo' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                persona.sentimiento === 'negativo' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                persona.sentimiento === 'neutro' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                {persona.sentimiento === 'positivo' && <CheckCircle2 className="w-3 h-3" />}
                {persona.sentimiento === 'negativo' && <AlertTriangle className="w-3 h-3" />}
                {persona.sentimiento === 'neutro' && <Clock className="w-3 h-3" />}
                {persona.sentimiento === 'mixto' && <RefreshCcw className="w-3 h-3" />}
                <span className="capitalize">{persona.sentimiento}</span>
              </div>
              <div className="mt-2 font-bold text-lg text-gray-900 dark:text-white">{persona.puntuacion}/100</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function BusquedaPersonas() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState<PersonaDetalle | null>(null);
  const [tabActiva, setTabActiva] = useState('general');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [haBuscado, setHaBuscado] = useState(false);

  const realizarBusqueda = async () => {
    if (!busqueda.trim()) return;

    setBuscando(true);
    setError(null);
    setHaBuscado(true);

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(busqueda.trim())}&type=person`);
      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        const mapped: ResultadoBusqueda[] = data.results.slice(0, 10).map((r: any, i: number) => ({
          id: r.id || String(i + 1),
          nombre: r.name || r.title || busqueda,
          profesion: r.profession || r.category || 'Sin informacion',
          ubicacion: r.location || 'Colombia',
          edad: r.age || 0,
          foto: '',
          sentimiento: r.sentiment === 'positive' ? 'positivo' : r.sentiment === 'negative' ? 'negativo' : r.sentiment === 'mixed' ? 'mixto' : 'neutro',
          puntuacion: r.score || r.reputationScore || 50,
          presencia: {
            x: r.platforms?.twitter || false,
            facebook: r.platforms?.facebook || false,
            instagram: r.platforms?.instagram || false,
            youtube: r.platforms?.youtube || false,
            web: r.platforms?.web || r.url ? true : false
          },
          menciones: r.mentions || r.totalMentions || 0
        }));
        setResultados(mapped);
      } else {
        setResultados([]);
      }
    } catch (err) {
      console.error('Error en busqueda:', err);
      setError('Error al realizar la busqueda. Intenta de nuevo.');
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  };

  const handleBusqueda = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      realizarBusqueda();
    }
  };

  const verDetalles = async (id: string) => {
    const persona = resultados.find(p => p.id === id);
    if (!persona) return;

    // Construir detalle desde los datos del resultado
    const detalle: PersonaDetalle = {
      ...persona,
      noticias: [],
      redes: [],
      empresas: [],
      educacion: []
    };

    // Intentar cargar mas informacion de la API
    try {
      const response = await fetch(`/api/analyze?name=${encodeURIComponent(persona.nombre)}`);
      const data = await response.json();

      if (data.news && Array.isArray(data.news)) {
        detalle.noticias = data.news.slice(0, 5).map((n: any, i: number) => ({
          id: `n${i}`,
          titulo: n.title || n.headline || '',
          fuente: n.source || n.publisher || '',
          fecha: n.date || n.publishedAt || '',
          sentimiento: n.sentiment === 'positive' ? 'positivo' : n.sentiment === 'negative' ? 'negativo' : 'neutro',
          url: n.url || '#'
        }));
      }
    } catch (err) {
      console.error('Error cargando detalles:', err);
    }

    setPersonaSeleccionada(detalle);
  };

  const cerrarDetalles = () => {
    setPersonaSeleccionada(null);
    setTabActiva('general');
  };

  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container mx-auto p-4 sm:p-6">
        {/* Header con gradiente */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="p-3 bg-white/20 rounded-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}>
                <Target className="h-7 w-7 text-white" />
              </motion.div>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Busqueda de Personas</h1>
              <p className="text-white/70 text-sm">
                Encuentra informacion y analiza la reputacion online de personas en Colombia
              </p>
            </div>
          </div>
        </motion.div>

        {/* Formulario de busqueda */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Busca por nombre, profesion o ubicacion..."
              className="pl-12 py-6 rounded-xl shadow-sm border-gray-200 dark:border-gray-700 text-base"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleBusqueda}
            />
            <Button
              className="absolute right-1.5 top-1/2 transform -translate-y-1/2 rounded-lg bg-[#01257D] hover:bg-[#013AAA]"
              onClick={realizarBusqueda}
              disabled={buscando || !busqueda.trim()}
            >
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </Button>
          </div>
        </motion.div>

        {/* Estado de carga */}
        {buscando && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="h-10 w-10 text-[#01257D] animate-spin mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Buscando resultados...</p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-center"
          >
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Empty state inicial */}
        {!buscando && !haBuscado && resultados.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-1">
              Busca una persona para analizar su reputacion
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Ingresa un nombre en el buscador para ver resultados
            </p>
          </motion.div>
        )}

        {/* Sin resultados despues de buscar */}
        {!buscando && haBuscado && resultados.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <User className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron resultados</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Intenta con otro nombre o termino de busqueda</p>
          </motion.div>
        )}

        {/* Resultados de busqueda */}
        {!buscando && resultados.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Resultados ({resultados.length})
            </h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {resultados.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onClick={() => verDetalles(persona.id)}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Modal de detalles */}
        <Dialog open={!!personaSeleccionada} onOpenChange={() => personaSeleccionada && cerrarDetalles()}>
          <DialogContent className="max-w-4xl">
            {personaSeleccionada && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{personaSeleccionada.nombre}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-6 mt-4">
                  {/* Sidebar */}
                  <div className="md:w-1/3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gradient-to-br from-[#01257D] to-indigo-500 rounded-full w-14 h-14 flex items-center justify-center">
                          <User className="w-7 h-7 text-white" />
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
                          {personaSeleccionada.presencia.youtube && (
                            <Button variant="outline" size="sm" className="inline-flex items-center gap-1">
                              <Youtube className="w-3 h-3" />
                              <span>YouTube</span>
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
                      <TabsList className="grid grid-cols-2 mb-4">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="noticias">Noticias</TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <h3 className="font-bold text-lg mb-2">Resumen</h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {personaSeleccionada.nombre} es un/a {personaSeleccionada.profesion.toLowerCase()} con presencia online {personaSeleccionada.sentimiento}.
                            Cuenta con {personaSeleccionada.menciones} menciones en medios digitales y una puntuacion de reputacion de {personaSeleccionada.puntuacion}/100.
                          </p>
                        </div>

                        {personaSeleccionada.noticias.length > 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                            <h3 className="font-bold text-lg mb-2">Ultimas noticias</h3>
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
                        )}

                        {personaSeleccionada.noticias.length === 0 && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm text-center">
                            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron noticias recientes</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="noticias" className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <h3 className="font-bold text-lg mb-4">Menciones en medios</h3>
                          {personaSeleccionada.noticias.length > 0 ? (
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
                                    {noticia.url && noticia.url !== '#' && (
                                      <Button variant="ghost" size="sm" className="text-xs" asChild>
                                        <a href={noticia.url} target="_blank" rel="noopener noreferrer">Ver noticia</a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No se encontraron noticias para esta persona</p>
                            </div>
                          )}
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
    </motion.div>
  );
}
