"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PlusCircle, Edit, Trash2, CheckCircle, XCircle, Users, CreditCard,
  DollarSign, Star, Crown,
} from 'lucide-react';
import { AdminPageWrapper } from '@/components/admin';
import { planFeaturesByGroup } from '@/lib/plan-features-catalog';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceCop: number;
  monthlyCredits: number;
  maxSocialAccounts: number;
  multiAccountPerPlatform: boolean;
  maxAccountsPerPlatform: number;
  features: Record<string, boolean>;
  isActive: boolean;
  isPopular: boolean;
  billingCycle: string;
  displayOrder: number;
  stats?: { userCount: number; monthlyRevenue: number };
}

interface PlanForm {
  code: string;
  name: string;
  description: string;
  priceCop: number;
  monthlyCredits: number;
  maxSocialAccounts: number;
  multiAccountPerPlatform: boolean;
  maxAccountsPerPlatform: number;
  isActive: boolean;
  isPopular: boolean;
  displayOrder: number;
  features: Record<string, boolean>;
}

const EMPTY_FORM: PlanForm = {
  code: '',
  name: '',
  description: '',
  priceCop: 0,
  monthlyCredits: 0,
  maxSocialAccounts: 1,
  multiAccountPerPlatform: false,
  maxAccountsPerPlatform: 1,
  isActive: true,
  isPopular: false,
  displayOrder: 0,
  features: {},
};

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [planEditando, setPlanEditando] = useState<Plan | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);

  const cargarPlanes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/plans', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error consultando planes');
      }
      setPlanes(data.plans);
    } catch (err: any) {
      setError(err.message || 'Error cargando planes');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPlanes();
  }, [cargarPlanes]);

  const abrirModalCrear = () => {
    setPlanEditando(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (plan: Plan) => {
    setPlanEditando(plan);
    setForm({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceCop: plan.priceCop,
      monthlyCredits: plan.monthlyCredits,
      maxSocialAccounts: plan.maxSocialAccounts,
      multiAccountPerPlatform: plan.multiAccountPerPlatform,
      maxAccountsPerPlatform: plan.maxAccountsPerPlatform ?? 1,
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      displayOrder: plan.displayOrder,
      features: plan.features || {},
    });
    setError(null);
    setModalAbierto(true);
  };

  const toggleFeature = (key: string, checked: boolean) => {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [key]: checked } }));
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean =
      type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? parseInt(value, 10) || 0
        : value;
    // Total hasta 12 (3 por red x 4 redes); el tope real es 3 cuentas POR red social.
    if (name === 'maxSocialAccounts' && typeof newValue === 'number') {
      newValue = Math.min(12, Math.max(0, newValue));
    }
    if (name === 'maxAccountsPerPlatform' && typeof newValue === 'number') {
      newValue = Math.min(3, Math.max(1, newValue));
    }
    setForm((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.code.trim() || !form.name.trim()) {
      setError('Codigo y nombre son obligatorios');
      return;
    }
    if (form.priceCop < 0 || form.monthlyCredits < 0 || form.maxSocialAccounts < 0) {
      setError('Los valores numericos no pueden ser negativos');
      return;
    }

    setGuardando(true);
    try {
      const isUpdate = !!planEditando;
      const url = isUpdate ? `/api/admin/plans/${planEditando!.id}` : '/api/admin/plans';
      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error guardando plan');
      }

      await cargarPlanes();
      setModalAbierto(false);
    } catch (err: any) {
      setError(err.message || 'Error guardando plan');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPlan = async (plan: Plan) => {
    if (!window.confirm(`Eliminar el plan "${plan.name}"? Esta accion no se puede deshacer.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error eliminando plan');
      }
      await cargarPlanes();
    } catch (err: any) {
      setError(err.message || 'Error eliminando plan');
    }
  };

  const toggleEstado = async (plan: Plan) => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error actualizando estado');
      }
      await cargarPlanes();
    } catch (err: any) {
      setError(err.message || 'Error actualizando estado');
    }
  };

  const totalUsers = planes.reduce((acc, p) => acc + (p.stats?.userCount || 0), 0);
  const totalRevenue = planes.reduce((acc, p) => acc + (p.stats?.monthlyRevenue || 0), 0);
  const popularPlan = planes.length > 0
    ? planes.reduce((max, p) => (p.stats?.userCount || 0) > (max.stats?.userCount || 0) ? p : max, planes[0])
    : null;

  return (
    <AdminPageWrapper title="Gestion de Planes" subtitle="Administra precios, creditos y limites de los planes de la plataforma">
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={abrirModalCrear}
            className="flex items-center rounded-xl bg-[#00E5FF] px-4 py-2.5 text-[#0B1120] font-semibold hover:bg-[#00D4ED] transition-colors"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Nuevo Plan
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-100 dark:bg-red-100 p-4 text-sm text-red-800 dark:text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Creditos / mes</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Cuentas sociales</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Usuarios</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
                    Cargando planes...
                  </td>
                </tr>
              ) : planes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
                    No hay planes registrados
                  </td>
                </tr>
              ) : (
                planes.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-100">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-900">{plan.name}</span>
                        {plan.isPopular && (
                          <span title="Plan popular" className="inline-flex items-center text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                          </span>
                        )}
                        {plan.multiAccountPerPlatform && (
                          <span title="Permite multi-cuenta por red" className="inline-flex items-center text-purple-500">
                            <Crown className="h-4 w-4" />
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        <span className="font-mono">{plan.code}</span> &middot; {plan.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-900">
                      {plan.priceCop === 0 ? 'Gratis' : formatCOP(plan.priceCop)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-900">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                        {plan.monthlyCredits.toLocaleString('es-CO')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-900">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-blue-500" />
                        {plan.maxSocialAccounts}
                        {plan.multiAccountPerPlatform && <span className="ml-1 text-xs text-purple-500">(multi)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {plan.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-100 dark:text-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-100 dark:text-red-600">
                          <XCircle className="mr-1 h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-900">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-blue-500" />
                        {plan.stats?.userCount ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirModalEditar(plan)}
                          className="rounded p-1.5 text-blue-600 hover:bg-blue-100 dark:text-blue-600 dark:hover:bg-blue-100"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleEstado(plan)}
                          className={`rounded p-1.5 ${plan.isActive
                            ? 'text-red-600 hover:bg-red-100 dark:text-red-600 dark:hover:bg-red-100'
                            : 'text-green-600 hover:bg-green-100 dark:text-green-600 dark:hover:bg-green-100'}`}
                          title={plan.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {plan.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        {(plan.stats?.userCount ?? 0) === 0 && (
                          <button
                            onClick={() => eliminarPlan(plan)}
                            className="rounded p-1.5 text-red-600 hover:bg-red-100 dark:text-red-600 dark:hover:bg-red-100"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-100 text-blue-600 dark:text-blue-700">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Planes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{planes.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {planes.filter((p) => p.isActive).length} activos
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Usuarios totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-100 text-amber-600 dark:text-amber-700">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">Plan mas adoptado</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-900">
                  {popularPlan ? popularPlan.name : '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {popularPlan?.stats?.userCount ?? 0} usuarios
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-200 bg-white dark:bg-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-100 text-green-600 dark:text-green-700">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">MRR estimado</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-900">{formatCOP(totalRevenue)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">precio &times; usuarios activos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-lg bg-white dark:bg-gray-100 p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-900">
              {planEditando ? `Editar plan: ${planEditando.name}` : 'Nuevo plan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">
                    Codigo* <span className="text-gray-500">(no se puede cambiar despues)</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleInputChange}
                    disabled={!!planEditando}
                    placeholder="ej: pro"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm font-mono disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Nombre*</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="ej: Plan Profesional"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Descripcion</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Precio (COP)*</label>
                  <input
                    type="number"
                    name="priceCop"
                    value={form.priceCop}
                    onChange={handleInputChange}
                    min={0}
                    step={1000}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Creditos/mes*</label>
                  <input
                    type="number"
                    name="monthlyCredits"
                    value={form.monthlyCredits}
                    onChange={handleInputChange}
                    min={0}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Max cuentas sociales* (total, máx 12)</label>
                  <input
                    type="number"
                    name="maxSocialAccounts"
                    value={form.maxSocialAccounts}
                    onChange={handleInputChange}
                    min={0}
                    max={12}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Orden de visualizacion</label>
                <input
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleInputChange}
                  min={0}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-600">Máx. cuentas por red social (máx 3)</label>
                <input
                  type="number"
                  name="maxAccountsPerPlatform"
                  value={form.maxAccountsPerPlatform}
                  onChange={handleInputChange}
                  min={1}
                  max={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-100 dark:text-gray-900 p-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">1 = una sola cuenta por cada red (sin 2 Facebook, etc.). Tope: 3.</p>
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-gray-200 dark:border-gray-200 p-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-600">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Plan activo (los usuarios lo pueden adquirir)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-600">
                  <input
                    type="checkbox"
                    name="isPopular"
                    checked={form.isPopular}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Marcar como popular (destacado en pricing)
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-600">
                  <input
                    type="checkbox"
                    name="multiAccountPerPlatform"
                    checked={form.multiAccountPerPlatform}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Permite multiples cuentas de la misma red social
                </label>
              </div>

              {/* Módulos / funciones incluidas en el plan (se guardan en plans.features) */}
              <div className="rounded-md border border-gray-200 dark:border-gray-200 p-3">
                <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-700">
                  Módulos / funciones incluidas
                </p>
                <div className="space-y-3">
                  {planFeaturesByGroup().map(({ group, items }) => (
                    <div key={group}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-500">
                        {group}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {items.map((item) => (
                          <label
                            key={item.key}
                            title={item.hint || ''}
                            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-600"
                          >
                            <input
                              type="checkbox"
                              checked={!!form.features[item.key]}
                              onChange={(e) => toggleFeature(item.key, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-100 dark:bg-red-100 p-3 text-sm text-red-800 dark:text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="rounded-md bg-[#00E5FF] px-4 py-2 text-sm font-semibold text-[#0B1120] hover:bg-[#00D4ED] disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : planEditando ? 'Actualizar' : 'Crear plan'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
