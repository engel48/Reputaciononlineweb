import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Users, Check } from 'lucide-react';

interface AsignarCreditosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (datos: DatosAsignacion) => void;
}

interface DatosAsignacion {
  usuarioId: string;
  cantidad: number;
  canal: string;
  descripcion: string;
}

export default function AsignarCreditosModal({ isOpen, onClose, onConfirm }: AsignarCreditosModalProps) {
  // Estado para los campos del formulario
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1000);
  const [canal, setCanal] = useState<string>('general');
  const [descripcion, setDescripcion] = useState<string>('');
  const [exito, setExito] = useState<boolean>(false);

  // Lista de usuarios de ejemplo
  const usuarios = [
    { id: 'u1', nombre: 'Carlos Rodru00edguez', email: 'carlos@ejemplo.com' },
    { id: 'u2', nombre: 'Maru00eda Lu00f3pez', email: 'maria@ejemplo.com' },
    { id: 'u3', nombre: 'Juan Martu00ednez', email: 'juan@ejemplo.com' },
    { id: 'u4', nombre: 'Ana Gu00f3mez', email: 'ana@ejemplo.com' },
    { id: 'u5', nombre: 'Pedro Su00e1nchez', email: 'pedro@ejemplo.com' },
    { id: 'u6', nombre: 'Laura Torres', email: 'laura@ejemplo.com' },
  ];

  // Lista de canales disponibles
  const canales = [
    { id: 'general', nombre: 'General' },
    { id: 'facebook', nombre: 'Facebook' },
    { id: 'x', nombre: 'X' },
    { id: 'instagram', nombre: 'Instagram' },
    { id: 'linkedin', nombre: 'LinkedIn' },
    { id: 'tiktok', nombre: 'TikTok' },
  ];

  // Opciones de planes predefinidos
  const planesPredefinidos = [
    { id: 'basico', nombre: 'Plan Bu00e1sico', creditos: 5000, precio: 149900 },
    { id: 'profesional', nombre: 'Plan Profesional', creditos: 15000, precio: 399900 },
    { id: 'empresarial', nombre: 'Plan Empresarial', creditos: 50000, precio: 999900 },
    { id: 'personalizado', nombre: 'Plan Personalizado', creditos: 0, precio: 0 }
  ];

  // Manejar envu00edo del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!usuarioSeleccionado || cantidad <= 0) {
      return;
    }

    // Mostrar mensaje de u00e9xito
    setExito(true);
    
    // Enviar datos a componente padre
    onConfirm({
      usuarioId: usuarioSeleccionado,
      cantidad,
      canal,
      descripcion: descripcion || 'Asignaciu00f3n manual de cru00e9ditos'
    });

    // Cerrar modal despuu00e9s de un tiempo
    setTimeout(() => {
      resetForm();
      onClose();
    }, 1500);
  };

  // Aplicar plan predefinido
  const aplicarPlan = (planId: string) => {
    const plan = planesPredefinidos.find(p => p.id === planId);
    if (plan) {
      setCantidad(plan.creditos);
      setDescripcion(plan.nombre);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setUsuarioSeleccionado('');
    setCantidad(1000);
    setCanal('general');
    setDescripcion('');
    setExito(false);
  };

  // Si el modal no estu00e1 abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden p-4">
          {/* Overlay oscuro */}
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Botu00f3n de cerrar */}
            <button 
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                <CreditCard className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Asignar Cru00e9ditos
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Asigna cru00e9ditos a los usuarios para que puedan utilizar las funcionalidades de la plataforma.
              </p>
            </div>
            
            {exito ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">u00a1Cru00e9ditos asignados!</h3>
                <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
                  Los cru00e9ditos han sido asignados exitosamente al usuario.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Selecciu00f3n de usuario */}
                <div className="mb-4">
                  <label htmlFor="usuario" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Usuario
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Users className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      id="usuario"
                      className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                      value={usuarioSeleccionado}
                      onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar usuario</option>
                      {usuarios.map(usuario => (
                        <option key={usuario.id} value={usuario.id}>
                          {usuario.nombre} ({usuario.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Planes predefinidos */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Planes predefinidos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {planesPredefinidos.map(plan => (
                      <button
                        key={plan.id}
                        type="button"
                        className="flex flex-col rounded-md border border-gray-300 p-2 text-left text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                        onClick={() => aplicarPlan(plan.id)}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{plan.nombre}</span>
                        {plan.id !== 'personalizado' && (
                          <>
                            <span className="text-gray-500 dark:text-gray-400">{plan.creditos.toLocaleString('es-CO')} cru00e9ditos</span>
                            <span className="text-primary-600 dark:text-primary-400">$ {plan.precio.toLocaleString('es-CO')} COP</span>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cantidad de cru00e9ditos */}
                <div className="mb-4">
                  <label htmlFor="cantidad" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cantidad de cru00e9ditos
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value) || 0))}
                    required
                    min="1"
                  />
                </div>

                {/* Canal */}
                <div className="mb-4">
                  <label htmlFor="canal" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Canal
                  </label>
                  <select
                    id="canal"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    value={canal}
                    onChange={(e) => setCanal(e.target.value)}
                  >
                    {canales.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Descripciu00f3n */}
                <div className="mb-4">
                  <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripciu00f3n
                  </label>
                  <input
                    type="text"
                    id="descripcion"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej. Plan mensual, promociu00f3n, etc."
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-500 dark:hover:bg-primary-400"
                  >
                    Asignar Cru00e9ditos
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
