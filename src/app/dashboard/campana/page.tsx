"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, MessageCircle, PieChart, Plus, Edit, Trash2, Megaphone } from 'lucide-react';
import Link from 'next/link';

interface CampanaStats {
  seguidores: number;
  interacciones: number;
  menciones: number;
  sentimientoPositivo: number;
}

interface Evento {
  id: string;
  titulo: string;
  fecha: string;
  ubicacion: string;
  asistentes: number;
}

interface PropuestaPolitica {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  aprobacion: number;
}

export default function CampanaPage() {
  const [stats, setStats] = useState<CampanaStats>({
    seguidores: 0,
    interacciones: 0,
    menciones: 0,
    sentimientoPositivo: 0
  });
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [propuestas, setPropuestas] = useState<PropuestaPolitica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<'personal' | 'politico'>('politico');

  useEffect(() => {
    // Asegurarse de que estamos en el cliente antes de acceder a localStorage
    if (typeof window !== 'undefined') {
      // Verificar que el usuario sea político
      const storedType = localStorage.getItem('tipoPerfil');
      if (storedType !== 'politico') {
        // Redirigir si no es un perfil político
        window.location.href = '/dashboard';
        return;
      }
      
      setUserType('politico');
      
      // Simular carga de datos de campaña
      const loadData = async () => {
        setIsLoading(true);
        try {
          // Simulación de API
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Datos de estadísticas
          setStats({
            seguidores: 5240,
            interacciones: 12350,
            menciones: 432,
            sentimientoPositivo: 68
          });
          
          // Datos de eventos
          setEventos([
            {
              id: '1',
              titulo: 'Encuentro vecinal en Plaza Mayor',
              fecha: '2025-06-15T18:00:00',
              ubicacion: 'Plaza Mayor, Centro',
              asistentes: 120
            },
            {
              id: '2',
              titulo: 'Debate sobre sostenibilidad',
              fecha: '2025-06-20T19:30:00',
              ubicacion: 'Centro Cultural del Este',
              asistentes: 85
            },
            {
              id: '3',
              titulo: 'Diálogo con jóvenes',
              fecha: '2025-06-25T17:00:00',
              ubicacion: 'Universidad Central, Auditorio A',
              asistentes: 200
            }
          ]);
          
          // Datos de propuestas
          setPropuestas([
            {
              id: '1',
              titulo: 'Plan de Movilidad Sostenible',
              categoria: 'Medio Ambiente',
              descripcion: 'Implementación de un plan integral de movilidad sostenible con ampliación de carriles bici y mejora del transporte público.',
              aprobacion: 76
            },
            {
              id: '2',
              titulo: 'Digitalización de Trámites Municipales',
              categoria: 'Administración',
              descripcion: 'Modernización de todos los trámites municipales para que puedan realizarse online de manera sencilla y rápida.',
              aprobacion: 82
            },
            {
              id: '3',
              titulo: 'Programa de Apoyo a Emprendedores',
              categoria: 'Economía',
              descripcion: 'Creación de un programa de apoyo a emprendedores locales con asesoramiento, formación y ayudas económicas.',
              aprobacion: 71
            }
          ]);
        } catch (error) {
          console.error('Error al cargar datos de campaña:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }
  }, []);

  // Formatear fecha para mostrar
  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Campaña</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Administra todos los aspectos de tu campaña política
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/campana/reporte" 
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            <PieChart className="mr-2 h-4 w-4" />
            Generar Reporte
          </Link>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stats.seguidores.toLocaleString()}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Seguidores
          </p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stats.interacciones.toLocaleString()}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Interacciones
          </p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Megaphone className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stats.menciones.toLocaleString()}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Menciones
          </p>
        </div>
        
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{stats.sentimientoPositivo}%</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Sentimiento Positivo
          </p>
        </div>
      </div>

      {/* Eventos políticos */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Próximos Eventos</h2>
          <button className="inline-flex items-center rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30">
            <Plus className="mr-1 h-4 w-4" />
            Nuevo evento
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Evento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ubicación
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Asistentes
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
              {eventos.map(evento => (
                <tr key={evento.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{evento.titulo}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatFecha(evento.fecha)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {evento.ubicacion}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {evento.asistentes}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button className="mr-2 text-primary hover:text-primary-700 dark:hover:text-primary-400">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-500 hover:text-red-700 dark:hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <Link 
            href="/dashboard/eventos" 
            className="text-sm font-medium text-primary hover:text-primary-700 dark:hover:text-primary-400"
          >
            Ver todos los eventos →
          </Link>
        </div>
      </div>

      {/* Propuestas políticas */}
      <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Propuestas Políticas</h2>
          <button className="inline-flex items-center rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30">
            <Plus className="mr-1 h-4 w-4" />
            Nueva propuesta
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {propuestas.map(propuesta => (
            <div key={propuesta.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {propuesta.categoria}
                </span>
                <div className="flex space-x-1">
                  <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="mb-2 text-base font-medium text-gray-900 dark:text-white">
                {propuesta.titulo}
              </h3>
              
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {propuesta.descripcion}
              </p>
              
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Aprobación</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{propuesta.aprobacion}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div 
                    className="h-2 rounded-full bg-primary" 
                    style={{ width: `${propuesta.aprobacion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
