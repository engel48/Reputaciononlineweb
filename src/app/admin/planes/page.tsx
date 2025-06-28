"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle, Users, CreditCard, Calendar, DollarSign } from 'lucide-react';
import axios from 'axios';

interface Plan {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  creditos: number;
  duracion: number;
  activo: boolean;
  usuarios?: number;
  ingresos?: number;
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planEditando, setPlanEditando] = useState<Plan | null>(null);
  
  // Datos iniciales para la demostración
  const planesIniciales: Plan[] = [
    {
      id: 1,
      nombre: "Plan Básico",
      descripcion: "Ideal para pequeñas empresas o profesionales independientes",
      precio: 99000,
      creditos: 1000,
      duracion: 30,
      activo: true,
      usuarios: 45,
      ingresos: 4455000
    },
    {
      id: 2,
      nombre: "Plan Profesional",
      descripcion: "Perfecto para empresas medianas que necesitan mayor análisis",
      precio: 249000,
      creditos: 3000,
      duracion: 30,
      activo: true,
      usuarios: 38,
      ingresos: 9462000
    },
    {
      id: 3,
      nombre: "Plan Empresarial",
      descripcion: "Solución completa para grandes empresas y figuras públicas",
      precio: 499000,
      creditos: 10000,
      duracion: 30,
      activo: true,
      usuarios: 16,
      ingresos: 7984000
    },
    {
      id: 4,
      nombre: "Plan Anual Premium",
      descripcion: "Máxima cobertura con un importante descuento anual",
      precio: 4790000,
      creditos: 120000,
      duracion: 365,
      activo: true,
      usuarios: 7,
      ingresos: 33530000
    },
    {
      id: 5,
      nombre: "Plan Prueba",
      descripcion: "Plan para conocer la plataforma por 7 días",
      precio: 29000,
      creditos: 200,
      duracion: 7,
      activo: false,
      usuarios: 0,
      ingresos: 0
    }
  ];

  // Estado para formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    creditos: 0,
    duracion: 30,
    activo: true
  });

  // Cargar datos iniciales (simulando API)
  useEffect(() => {
    // En una implementación real, aquí se haría una petición al backend
    // const fetchPlanes = async () => {
    //   try {
    //     const response = await axios.get('http://localhost:4000/api/planes');
    //     setPlanes(response.data);
    //     setCargando(false);
    //   } catch (err) {
    //     setError('Error al cargar los planes');
    //     setCargando(false);
    //   }
    // };
    // fetchPlanes();
    
    // Por ahora usamos datos de ejemplo
    setTimeout(() => {
      setPlanes(planesIniciales);
      setCargando(false);
    }, 500);
  }, []);

  // Animaciones
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

  // Funciones para gestionar planes
  const abrirModalCrear = () => {
    setPlanEditando(null);
    setFormulario({
      nombre: '',
      descripcion: '',
      precio: 0,
      creditos: 0,
      duracion: 30,
      activo: true
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (plan: Plan) => {
    setPlanEditando(plan);
    setFormulario({
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio,
      creditos: plan.creditos,
      duracion: plan.duracion,
      activo: plan.activo
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    (type === 'number' ? parseFloat(value) : value);
    
    setFormulario(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formulario.nombre || !formulario.descripcion || formulario.precio <= 0 || formulario.creditos <= 0) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }
    
    try {
      setCargando(true);
      
      if (planEditando) {
        // Actualizar plan existente
        // En una implementación real, aquí se haría una petición al backend
        // await axios.put(`http://localhost:4000/api/planes/${planEditando.id}`, formulario);
        
        // Simulación de actualización
        setPlanes(prev => prev.map(p => p.id === planEditando.id ? { ...p, ...formulario } : p));
      } else {
        // Crear nuevo plan
        // En una implementación real, aquí se haría una petición al backend
        // const response = await axios.post('http://localhost:4000/api/planes', formulario);
        
        // Simulación de creación
        const nuevoId = Math.max(...planes.map(p => p.id)) + 1;
        const nuevoPlan = { id: nuevoId, ...formulario, usuarios: 0, ingresos: 0 };
        setPlanes(prev => [...prev, nuevoPlan]);
      }
      
      setCargando(false);
      setModalAbierto(false);
      setError(null);
    } catch (err) {
      setError('Error al guardar el plan');
      setCargando(false);
    }
  };

  const eliminarPlan = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este plan?')) return;
    
    try {
      setCargando(true);
      
      // En una implementación real, aquí se haría una petición al backend
      // await axios.delete(`http://localhost:4000/api/planes/${id}`);
      
      // Simulación de eliminación
      setPlanes(prev => prev.filter(p => p.id !== id));
      
      setCargando(false);
    } catch (err) {
      setError('Error al eliminar el plan');
      setCargando(false);
    }
  };

  const toggleEstadoPlan = async (id: number, nuevoEstado: boolean) => {
    try {
      setCargando(true);
      
      // En una implementación real, aquí se haría una petición al backend
      // await axios.patch(`http://localhost:4000/api/planes/${id}`, { activo: nuevoEstado });
      
      // Simulación de actualización de estado
      setPlanes(prev => prev.map(p => p.id === id ? { ...p, activo: nuevoEstado } : p));
      
      setCargando(false);
    } catch (err) {
      setError('Error al cambiar el estado del plan');
      setCargando(false);
    }
  };

  // Formatear valores monetarios
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado de la página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Planes</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administre los planes disponibles en la plataforma Reputación Online.
          </p>
        </div>
        <button
          onClick={abrirModalCrear}
          className="flex items-center rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-600"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nuevo Plan
        </button>
      </div>

      {/* Alerta de error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <p>{error}</p>
        </div>
      )}

      {/* Tabla de planes */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Créditos</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Duración</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Usuarios</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {cargando ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Cargando planes...
                </td>
              </tr>
            ) : planes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay planes registrados
                </td>
              </tr>
            ) : (
              planes.map((plan) => (
                <motion.tr 
                  key={plan.id} 
                  variants={itemVariants}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    <div>{plan.nombre}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{plan.descripcion}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatearMoneda(plan.precio)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <CreditCard className="mr-2 h-4 w-4 text-primary-500" />
                      {plan.creditos.toLocaleString('es-CO')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                      {plan.duracion} días
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {plan.activo ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle className="mr-1 h-3 w-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle className="mr-1 h-3 w-3" /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4 text-primary-500" />
                      {plan.usuarios}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => abrirModalEditar(plan)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {plan.usuarios === 0 && (
                        <button
                          onClick={() => eliminarPlan(plan.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Eliminar"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleEstadoPlan(plan.id, !plan.activo)}
                        className={`rounded p-1 ${plan.activo 
                          ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30' 
                          : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30'}`}
                        title={plan.activo ? 'Desactivar' : 'Activar'}
                      >
                        {plan.activo ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Estadísticas de planes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total de planes */}
        <motion.div
          className="card flex items-center overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
          variants={itemVariants}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Planes</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{planes.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {planes.filter(p => p.activo).length} activos, {planes.filter(p => !p.activo).length} inactivos
            </p>
          </div>
        </motion.div>

        {/* Total de usuarios */}
        <motion.div
          className="card flex items-center overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
          variants={itemVariants}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuarios con Planes</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {planes.reduce((total, plan) => total + (plan.usuarios || 0), 0)}
            </p>
          </div>
        </motion.div>

        {/* Plan más popular */}
        <motion.div
          className="card flex items-center overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
          variants={itemVariants}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Plan Más Popular</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {planes.length > 0 
                ? planes.reduce((max, plan) => (plan.usuarios || 0) > (max.usuarios || 0) ? plan : max, planes[0]).nombre
                : 'N/A'}
            </p>
          </div>
        </motion.div>

        {/* Ingresos totales */}
        <motion.div
          className="card flex items-center overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-gray-800"
          variants={itemVariants}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos Totales</h2>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatearMoneda(planes.reduce((total, plan) => total + (plan.ingresos || 0), 0))}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Modal para crear/editar plan */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              {planEditando ? 'Editar Plan' : 'Crear Nuevo Plan'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre del Plan*
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción*
                </label>
                <textarea
                  name="descripcion"
                  value={formulario.descripcion}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  required
                ></textarea>
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio (COP)*
                  </label>
                  <input
                    type="number"
                    name="precio"
                    value={formulario.precio}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min="0"
                    required
                  />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Créditos*
                  </label>
                  <input
                    type="number"
                    name="creditos"
                    value={formulario.creditos}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duración (días)*
                </label>
                <input
                  type="number"
                  name="duracion"
                  value={formulario.duracion}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="1"
                  required
                />
              </div>
              
              <div className="mb-6 flex items-center">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formulario.activo}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plan activo
                </label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-600"
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : planEditando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
