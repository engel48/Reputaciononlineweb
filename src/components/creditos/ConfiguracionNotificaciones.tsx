import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Smartphone, AlertTriangle, Save, Check } from 'lucide-react';

export default function ConfiguracionNotificaciones() {
  // Estado para las preferencias de notificaciones
  const [notificaciones, setNotificaciones] = useState({
    alertasCreditosBajo: true,
    porcentajeAlertaCreditosBajo: 20,
    alertasVencimiento: true,
    diasAntesVencimiento: 7,
    alertasConsumoInusual: true,
    resumenSemanal: true,
    resumenMensual: true
  });

  // Estado para los canales de notificación
  const [canalesNotificacion, setCanalesNotificacion] = useState({
    email: true,
    plataforma: true,
    sms: false,
    whatsapp: false
  });

  // Estado para mostrar el mensaje de éxito
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Manejar cambios en las preferencias de notificaciones
  const handleNotificacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNotificaciones(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    }));
  };

  // Manejar cambios en los canales de notificación
  const handleCanalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCanalesNotificacion(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Guardar la configuración
  const guardarConfiguracion = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se enviaría la configuración al backend
    setGuardadoExitoso(true);
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setGuardadoExitoso(false);
    }, 3000);
  };

  return (
    <div className="card p-6">
      <div className="mb-6 flex items-center">
        <Bell className="mr-3 h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h2 className="heading-secondary">Configuración de Notificaciones</h2>
      </div>

      {/* Mensaje de éxito */}
      {guardadoExitoso && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400"
        >
          <Check className="mr-2 h-5 w-5" />
          <span>La configuración ha sido guardada exitosamente.</span>
        </motion.div>
      )}

      <form onSubmit={guardarConfiguracion} className="space-y-6">
        {/* Sección de Preferencias de Notificaciones */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Preferencias de Notificaciones</h3>
          
          <div className="space-y-4">
            {/* Alerta de créditos bajos */}
            <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <label htmlFor="alertasCreditosBajo" className="text-base font-medium text-gray-900 dark:text-white">
                    Alertas de créditos bajos
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="alertasCreditosBajo"
                    name="alertasCreditosBajo"
                    checked={notificaciones.alertasCreditosBajo}
                    onChange={handleNotificacionChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  />
                </div>
              </div>
              
              <div className="mt-2 pl-7">
                <label htmlFor="porcentajeAlertaCreditosBajo" className="block text-sm text-gray-700 dark:text-gray-300">
                  Notificarme cuando mis créditos estén por debajo del porcentaje:
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="number"
                    id="porcentajeAlertaCreditosBajo"
                    name="porcentajeAlertaCreditosBajo"
                    value={notificaciones.porcentajeAlertaCreditosBajo}
                    onChange={handleNotificacionChange}
                    min="1"
                    max="100"
                    disabled={!notificaciones.alertasCreditosBajo}
                    className="block w-20 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">%</span>
                </div>
              </div>
            </div>

            {/* Alerta de vencimiento de créditos */}
            <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <label htmlFor="alertasVencimiento" className="text-base font-medium text-gray-900 dark:text-white">
                    Alertas de vencimiento de créditos
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="alertasVencimiento"
                    name="alertasVencimiento"
                    checked={notificaciones.alertasVencimiento}
                    onChange={handleNotificacionChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  />
                </div>
              </div>
              
              <div className="mt-2 pl-7">
                <label htmlFor="diasAntesVencimiento" className="block text-sm text-gray-700 dark:text-gray-300">
                  Notificarme días antes del vencimiento:
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="number"
                    id="diasAntesVencimiento"
                    name="diasAntesVencimiento"
                    value={notificaciones.diasAntesVencimiento}
                    onChange={handleNotificacionChange}
                    min="1"
                    max="30"
                    disabled={!notificaciones.alertasVencimiento}
                    className="block w-20 rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">días</span>
                </div>
              </div>
            </div>

            {/* Otras notificaciones */}
            <div className="space-y-3 rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <label htmlFor="alertasConsumoInusual" className="text-base font-medium text-gray-900 dark:text-white">
                    Alertas de consumo inusual
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="alertasConsumoInusual"
                    name="alertasConsumoInusual"
                    checked={notificaciones.alertasConsumoInusual}
                    onChange={handleNotificacionChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <label htmlFor="resumenSemanal" className="text-base font-medium text-gray-900 dark:text-white">
                    Resumen semanal de consumo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="resumenSemanal"
                    name="resumenSemanal"
                    checked={notificaciones.resumenSemanal}
                    onChange={handleNotificacionChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <label htmlFor="resumenMensual" className="text-base font-medium text-gray-900 dark:text-white">
                    Resumen mensual de consumo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="resumenMensual"
                    name="resumenMensual"
                    checked={notificaciones.resumenMensual}
                    onChange={handleNotificacionChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Canales de Notificación */}
        <div>
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Canales de Notificación</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <label htmlFor="email" className="text-base font-medium text-gray-900 dark:text-white">
                  Email
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="email"
                  name="email"
                  checked={canalesNotificacion.email}
                  onChange={handleCanalChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                />
              </div>
            </div>

            {/* Plataforma */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <Bell className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <label htmlFor="plataforma" className="text-base font-medium text-gray-900 dark:text-white">
                  Notificaciones en plataforma
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="plataforma"
                  name="plataforma"
                  checked={canalesNotificacion.plataforma}
                  onChange={handleCanalChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                />
              </div>
            </div>

            {/* SMS */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <Smartphone className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <label htmlFor="sms" className="text-base font-medium text-gray-900 dark:text-white">
                  SMS
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sms"
                  name="sms"
                  checked={canalesNotificacion.sms}
                  onChange={handleCanalChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center justify-between rounded-md border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center">
                <MessageSquare className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <label htmlFor="whatsapp" className="text-base font-medium text-gray-900 dark:text-white">
                  WhatsApp
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whatsapp"
                  name="whatsapp"
                  checked={canalesNotificacion.whatsapp}
                  onChange={handleCanalChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-primary-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
          >
            <Save className="mr-2 h-4 w-4" />
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  );
}
