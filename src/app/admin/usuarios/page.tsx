"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Edit, Trash2, Plus, Search, Filter, RefreshCw, X, Check, Eye, Crown,
  UserPlus, UserX, UserCheck, Key, Copy, CheckCircle, XCircle, Loader2, Mail
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  profileType?: 'personal' | 'political' | 'business';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  credits: number;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
  onboardingCompleted?: boolean;
  isActive?: boolean;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ plan: '', credits: '', profileType: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Estados para crear usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'basic',
    credits: '',
    phone: '',
    company: ''
  });
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null);

  // Estados para reset password
  const [showResetModal, setShowResetModal] = useState<User | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ success: boolean; password?: string; message: string } | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  // Resetear página cuando cambia la búsqueda o filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPlan, filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('📊 Cargando usuarios...');
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });

      const data = await response.json();
      console.log('📄 Datos recibidos:', data);

      if (response.ok && data.success) {
        setUsers(data.users || []);
        console.log('✅ Usuarios cargados:', data.users?.length || 0);
      } else {
        console.error('❌ Error loading users:', data.message);
        setUsers([]);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesType = filterType === 'all' || user.profileType === filterType;

    return matchesSearch && matchesPlan && matchesType;
  });

  // Paginación
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      router.push('/admin');
    }
  };

  const getTotalUsers = () => users.length;
  const getActiveUsers = () => users.filter(u => u.lastLogin).length;
  const getTotalCredits = () => users.reduce((sum, u) => sum + u.credits, 0);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      plan: user.plan,
      credits: user.credits.toString(),
      profileType: user.profileType || 'personal'
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      console.log('📝 Actualizando usuario:', {
        userId: editingUser.id,
        plan: editForm.plan,
        credits: parseInt(editForm.credits),
        profileType: editForm.profileType
      });

      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: editingUser.id,
          plan: editForm.plan,
          credits: parseInt(editForm.credits),
          profileType: editForm.profileType
        }),
      });

      const data = await response.json();
      console.log('📄 Respuesta del servidor:', data);

      if (response.ok && data.success) {
        alert('Usuario actualizado exitosamente');
        await loadUsers();
        setEditingUser(null);
        setEditForm({ plan: '', credits: '', profileType: '' });
      } else {
        alert(data.message || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error de conexión actualizando usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      console.log('🗑️ Eliminando usuario:', userId);

      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      console.log('📄 Respuesta del servidor:', data);

      if (response.ok && data.success) {
        alert('Usuario eliminado exitosamente');
        await loadUsers();
        setShowDeleteConfirm(null);
      } else {
        alert(data.message || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error de conexión eliminando usuario');
    }
  };

  const handleToggleUser = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      console.log(`🔄 ${newStatus ? 'Habilitando' : 'Deshabilitando'} usuario:`, userId);

      const response = await fetch('/api/admin/users/toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId, isActive: newStatus }),
      });

      const data = await response.json();
      console.log('📄 Respuesta del servidor:', data);

      if (response.ok && data.success) {
        alert(data.message);
        await loadUsers();
      } else {
        alert(data.message || 'Error actualizando usuario');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error de conexión actualizando usuario');
    }
  };

  // Crear usuario
  const handleCreateUser = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateResult({ success: false, message: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    try {
      setCreating(true);
      setCreateResult(null);

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          plan: createForm.plan,
          credits: createForm.credits ? parseInt(createForm.credits) : undefined,
          phone: createForm.phone || undefined,
          company: createForm.company || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setCreateResult({ success: true, message: 'Usuario creado exitosamente' });
        await loadUsers();

        // Limpiar formulario y cerrar modal después de 2 segundos
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateResult(null);
          setCreateForm({
            name: '',
            email: '',
            password: '',
            plan: 'basic',
            credits: '',
            phone: '',
            company: ''
          });
        }, 2000);
      } else {
        setCreateResult({ success: false, message: data.error || 'Error creando usuario' });
      }
    } catch (error: any) {
      setCreateResult({ success: false, message: error.message || 'Error de conexión' });
    } finally {
      setCreating(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!showResetModal) return;

    try {
      setResetting(true);
      setResetResult(null);

      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: showResetModal.id })
      });

      const data = await response.json();

      if (data.success) {
        setResetResult({
          success: true,
          password: data.data.temporaryPassword,
          message: 'Contraseña reseteada exitosamente'
        });
      } else {
        setResetResult({ success: false, message: data.error || 'Error reseteando contraseña' });
      }
    } catch (error: any) {
      setResetResult({ success: false, message: error.message || 'Error de conexión' });
    } finally {
      setResetting(false);
    }
  };

  // Copiar contraseña al portapapeles
  const copyPassword = async () => {
    if (resetResult?.password) {
      await navigator.clipboard.writeText(resetResult.password);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  };

  // Generar contraseña aleatoria para el formulario de crear
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm({ ...createForm, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-[#00E5FF] mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestión de Usuarios
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Administra todos los usuarios de la plataforma
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-[#00E5FF] text-white rounded-lg hover:bg-[#00B8D4] text-sm font-medium transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Crear Usuario
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#00E5FF] transition-colors"
              >
                ← Volver al Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#00E5FF]" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTotalUsers()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Usuarios Activos
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getActiveUsers()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-xl">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Créditos
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getTotalCredits().toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-xl mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] focus:border-[#00E5FF] text-gray-900 dark:text-white"
                />
              </div>

              {/* Plan Filter */}
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] focus:border-[#00E5FF]"
              >
                <option value="all">Todos los planes</option>
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00E5FF] focus:border-[#00E5FF]"
              >
                <option value="all">Todos los tipos</option>
                <option value="personal">Personal</option>
                <option value="political">Político</option>
                <option value="business">Empresarial</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-4 py-2 bg-[#00E5FF] text-white rounded-lg hover:bg-[#00B8D4] focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:ring-offset-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden rounded-xl">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Lista de Usuarios ({filteredUsers.length})
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Página {currentPage} de {totalPages || 1}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Créditos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Creado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'Usuario sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.company && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {user.company}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.profileType === 'political'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : user.profileType === 'business'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.profileType || 'Personal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : user.plan === 'pro'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : user.plan === 'basic'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          user.credits >= 500
                            ? 'text-green-600 dark:text-green-400'
                            : user.credits >= 100
                              ? 'text-[#00E5FF]'
                              : user.credits >= 10
                                ? 'text-orange-500'
                                : 'text-red-500'
                        }`}>
                          {user.credits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive !== false
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {user.isActive !== false ? 'Habilitado' : 'Deshabilitado'}
                          </span>
                          {user.lastLogin && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Conectado
                            </span>
                          )}
                          {user.onboardingCompleted === false && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              Onboarding
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          {user.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => setShowResetModal(user)}
                                className="text-orange-600 hover:text-orange-800 p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                title="Reset contraseña"
                              >
                                <Key className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleUser(user.id, user.isActive !== false)}
                                className={`p-1.5 rounded-lg ${
                                  user.isActive !== false
                                    ? 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20'
                                    : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                                title={user.isActive !== false ? 'Deshabilitar usuario' : 'Habilitar usuario'}
                              >
                                {user.isActive !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="text-[#00E5FF] hover:text-[#00B8D4] p-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                                title="Editar usuario"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(user.id)}
                                className="text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Admin protegido
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-b-xl">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando{' '}
                  <span className="font-medium">{indexOfFirstUser + 1}</span>
                  {' '}a{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, filteredUsers.length)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{filteredUsers.length}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-[#00E5FF] border-[#00E5FF] text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Crear Usuario */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-[#00E5FF]" />
                  Crear Nuevo Usuario
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nombre completo"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                      title="Generar contraseña"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plan
                    </label>
                    <select
                      value={createForm.plan}
                      onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                    >
                      <option value="basic">Basic</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="political">Political</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Créditos Iniciales
                    </label>
                    <input
                      type="number"
                      value={createForm.credits}
                      onChange={(e) => setCreateForm({ ...createForm, credits: e.target.value })}
                      placeholder="Auto según plan"
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    placeholder="Nombre de la empresa"
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>

                {createResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    createResult.success
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                  }`}>
                    {createResult.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    <span className="text-sm">{createResult.message}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateResult(null);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateUser}
                  disabled={creating || !createForm.name || !createForm.email || !createForm.password}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2
                    ${creating || !createForm.name || !createForm.email || !createForm.password
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-[#00E5FF] hover:bg-[#00B8D4]'
                    }`}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Crear Usuario
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Reset Password */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Key className="h-5 w-5 text-orange-500" />
                  Resetear Contraseña
                </h3>
                <button
                  onClick={() => {
                    setShowResetModal(null);
                    setResetResult(null);
                    setPasswordCopied(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Usuario:</span> {showResetModal.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Email:</span> {showResetModal.email}
                  </p>
                </div>

                {!resetResult?.password && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <p className="text-sm text-orange-800 dark:text-orange-400">
                      Se generará una contraseña temporal que deberás proporcionar al usuario.
                      El usuario podrá cambiarla después de iniciar sesión.
                    </p>
                  </div>
                )}

                {resetResult && (
                  <div className={`rounded-lg p-4 ${
                    resetResult.success
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}>
                    {resetResult.success && resetResult.password ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">{resetResult.message}</span>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contraseña temporal:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg font-mono text-sm border border-gray-200 dark:border-gray-600">
                              {resetResult.password}
                            </code>
                            <button
                              onClick={copyPassword}
                              className={`p-2 rounded-lg transition-colors ${
                                passwordCopied
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                              title={passwordCopied ? 'Copiado!' : 'Copiar contraseña'}
                            >
                              {passwordCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm">{resetResult.message}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => {
                    setShowResetModal(null);
                    setResetResult(null);
                    setPasswordCopied(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {resetResult?.password ? 'Cerrar' : 'Cancelar'}
                </button>
                {!resetResult?.password && (
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2
                      ${resetting
                        ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                  >
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reseteando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Resetear Contraseña
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edición */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                  Editar: {editingUser.name}
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Plan
                  </label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Créditos
                  </label>
                  <input
                    type="number"
                    value={editForm.credits}
                    onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Perfil
                  </label>
                  <select
                    value={editForm.profileType}
                    onChange={(e) => setEditForm({ ...editForm, profileType: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                  >
                    <option value="personal">Personal</option>
                    <option value="political">Político</option>
                    <option value="business">Empresarial</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#00E5FF] text-white font-medium hover:bg-[#00B8D4] flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
              <div className="p-6 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Eliminar Usuario
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
