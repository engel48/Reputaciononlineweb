"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, Globe, Users, Database, AlertTriangle, Check, Info } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface ConfiguracionPrivacidad {
  perfilPublico: boolean;
  mostrarSeguidores: boolean;
  permitirMenciones: boolean;
  compartirAnalisis: boolean;
  notificacionesEmail: boolean;
  notificacionesPush: boolean;
  almacenarHistorial: boolean;
  compartirDatosTerceros: boolean;
  permitirCookies: boolean;
  analisisAvanzado: boolean;
}

export default function PrivacidadPage() {
  const { user } = useUser();
  const [guardando, setGuardando] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionPrivacidad>({
    perfilPublico: true,
    mostrarSeguidores: false,
    permitirMenciones: true,
    compartirAnalisis: false,
    notificacionesEmail: true,
    notificacionesPush: false,
    almacenarHistorial: true,
    compartirDatosTerceros: false,
    permitirCookies: true,
    analisisAvanzado: true
  });

  useEffect(() => {
    // Cargar configuración del usuario desde el backend
    // Por ahora usamos valores por defecto
    const cargarConfiguracion = async () => {
      try {
        // Simulamos carga desde API
        // const response = await fetch('/api/user/privacy-settings');
        // const data = await response.json();
        // setConfiguracion(data);
      } catch (error) {
        console.error('Error al cargar configuración de privacidad:', error);
      }
    };

    cargarConfiguracion();
  }, []);

  const actualizarConfiguracion = (campo: keyof ConfiguracionPrivacidad, valor: boolean) => {
    setConfiguracion(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const guardarConfiguracion = async () => {
    setGuardando(true);
    
    try {
      // Simular guardado en el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la llamada real al API
      // await fetch('/api/user/privacy-settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(configuracion)
      // });

      console.log('Configuración de privacidad guardada:', configuracion);
    } catch (error) {
      console.error('Error al guardar configuración:', error);
    } finally {
      setGuardando(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const configuraciones = [
    {
      titulo: "Visibilidad del Perfil",
      descripcion: "Controla quién puede ver tu información de perfil",
      icono: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      opciones: [
        {
          key: 'perfilPublico' as keyof ConfiguracionPrivacidad,
          titulo: "Perfil público",
          descripcion: "Permite que otros usuarios vean tu perfil básico",
          valor: configuracion.perfilPublico
        },
        {
          key: 'mostrarSeguidores' as keyof ConfiguracionPrivacidad,
          titulo: "Mostrar seguidores",
          descripcion: "Muestra el número de seguidores en tu perfil público",
          valor: configuracion.mostrarSeguidores
        }
      ]
    },
    {
      titulo: "Interacciones",
      descripcion: "Gestiona cómo otros pueden interactuar contigo",
      icono: Users,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      opciones: [
        {
          key: 'permitirMenciones' as keyof ConfiguracionPrivacidad,
          titulo: "Permitir menciones",
          descripcion: "Otros usuarios pueden mencionarte en comentarios y análisis",
          valor: configuracion.permitirMenciones
        },
        {
          key: 'compartirAnalisis' as keyof ConfiguracionPrivacidad,
          titulo: "Compartir análisis",
          descripcion: "Permite que otros vean tus análisis públicos",
          valor: configuracion.compartirAnalisis
        }
      ]
    },
    {
      titulo: "Notificaciones",
      descripcion: "Configura cómo y cuándo recibir notificaciones",
      icono: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      opciones: [
        {
          key: 'notificacionesEmail' as keyof ConfiguracionPrivacidad,
          titulo: "Notificaciones por email",
          descripcion: "Recibe actualizaciones importantes por correo electrónico",
          valor: configuracion.notificacionesEmail
        },
        {
          key: 'notificacionesPush' as keyof ConfiguracionPrivacidad,
          titulo: "Notificaciones push",
          descripcion: "Recibe notificaciones instantáneas en tu navegador",
          valor: configuracion.notificacionesPush
        }
      ]
    },
    {
      titulo: "Datos y Almacenamiento",
      descripcion: "Controla cómo se almacenan y procesan tus datos",
      icono: Database,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      opciones: [
        {
          key: 'almacenarHistorial' as keyof ConfiguracionPrivacidad,
          titulo: "Almacenar historial",
          descripcion: "Guarda el historial de análisis para mejorar recomendaciones",
          valor: configuracion.almacenarHistorial
        },
        {
          key: 'analisisAvanzado' as keyof ConfiguracionPrivacidad,
          titulo: "Análisis avanzado",
          descripcion: "Permite el uso de IA para análisis más profundos",
          valor: configuracion.analisisAvanzado
        }
      ]
    },
    {
      titulo: "Privacidad y Terceros",
      descripcion: "Gestiona el intercambio de datos con terceros",
      icono: Lock,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/30",
      opciones: [
        {
          key: 'compartirDatosTerceros' as keyof ConfiguracionPrivacidad,
          titulo: "Compartir con terceros",
          descripcion: "Permite compartir datos anonimizados para investigación",
          valor: configuracion.compartirDatosTerceros
        },
        {
          key: 'permitirCookies' as keyof ConfiguracionPrivacidad,
          titulo: "Cookies de análisis",
          descripcion: "Permite cookies para mejorar la experiencia del usuario",
          valor: configuracion.permitirCookies
        }
      ]
    }
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-[#01257D] rounded-full text-white mr-4">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configuración de Privacidad
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Controla tu privacidad y cómo se manejan tus datos
            </p>
          </div>
        </div>
      </motion.div>

      {/* Información importante */}
      <motion.div variants={itemVariants}>
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Tu privacidad es importante
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Estas configuraciones te permiten controlar cómo se recopilan, almacenan y utilizan tus datos. 
                  Puedes cambiar estas preferencias en cualquier momento. Para más información, consulta nuestra 
                  <span className="font-medium underline cursor-pointer"> política de privacidad</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Configuraciones */}
      <div className="space-y-6">
        {configuraciones.map((seccion, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${seccion.bgColor}`}>
                    <seccion.icono className={`h-5 w-5 ${seccion.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {seccion.titulo}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {seccion.descripcion}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {seccion.opciones.map((opcion, opcionIndex) => (
                    <div key={opcionIndex} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {opcion.titulo}
                          </h4>
                          {opcion.valor && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <Check className="h-3 w-3 mr-1" />
                              Activo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {opcion.descripcion}
                        </p>
                      </div>
                      <Switch
                        checked={opcion.valor}
                        onCheckedChange={(checked) => actualizarConfiguracion(opcion.key, checked)}
                        className="data-[state=checked]:bg-[#01257D]"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Botón de guardar */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <Button
          onClick={guardarConfiguracion}
          disabled={guardando}
          className="bg-[#01257D] hover:bg-[#013AAA] text-white px-8 py-3 text-lg"
        >
          {guardando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </motion.div>

      {/* Acciones adicionales */}
      <motion.div variants={itemVariants}>
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">
              Gestión de Datos
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Controla tus datos personales y exporta o elimina información
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                className="border-[#01257D] text-[#01257D] hover:bg-[#01257D]/10"
              >
                <Database className="h-4 w-4 mr-2" />
                Exportar mis datos
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Globe className="h-4 w-4 mr-2" />
                Ver política de privacidad
              </Button>
              <Button 
                variant="outline" 
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Eliminar cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
