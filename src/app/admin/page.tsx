"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Users, Database, BarChart3, Shield, Search, Filter, Download, RefreshCw, Edit, Trash2, DollarSign, Crown, UserPlus, X, Check, Settings, Power, MessageSquare } from 'lucide-react';

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
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ plan: '', credits: '', profileType: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Estados para configuraciones del sistema
  const [activeTab, setActiveTab] = useState('users'); // 'users' o 'settings'
  const [searchEngineEnabled, setSearchEngineEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.');
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Funciones para configuraciones del sistema
  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success) {
        const settings = data.settings || [];
        const searchSetting = settings.find((s: any) => s.key === 'search_engine_enabled');
        const messageSetting = settings.find((s: any) => s.key === 'maintenance_message');
        
        setSearchEngineEnabled(searchSetting?.value === 'true' || searchSetting?.value === undefined);
        setMaintenanceMessage(messageSetting?.value || 'El motor de búsqueda está temporalmente deshabilitado. Por favor, inténtelo más tarde.');
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    }
  };

  const saveSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      // Guardar estado del motor de búsqueda
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'search_engine_enabled',
          value: searchEngineEnabled.toString(),
          description: 'Habilitar o deshabilitar el motor de búsqueda de personalidades'
        })
      });

      // Guardar mensaje de mantenimiento
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'maintenance_message',
          value: maintenanceMessage,
          description: 'Mensaje mostrado cuando el motor de búsqueda está deshabilitado'
        })
      });

      alert('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      alert('Error guardando configuraciones');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Método 1: Credenciales hardcodeadas
    if (username === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      loadUsers();
      loadSystemSettings();
      return;
    }
    
    // Método 2: Verificar contra la base de datos
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: username.includes('@') ? username : `${username}@admin.com`,
          password: password,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user && data.user.role === 'admin') {
          setIsAuthenticated(true);
          loadUsers();
          loadSystemSettings();
          return;
        }
      }
    } catch (error) {
      console.error('Error en login admin:', error);
    }
    
    setError('Credenciales incorrectas o usuario sin permisos de administrador');
  };

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
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.company && user.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesType = filterType === 'all' || user.profileType === filterType;
    
    return matchesSearch && matchesPlan && matchesType;
  });

  const getTotalUsers = () => users.length;
  const getActiveUsers = () => users.filter(u => u.lastLogin).length;
  const getTotalCredits = () => users.reduce((sum, u) => sum + u.credits, 0);
  const getPlanDistribution = () => {
    const plans = users.reduce((acc, user) => {
      acc[user.plan] = (acc[user.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return plans;
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-[#01257D]" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              Panel de Administración
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Acceso restringido a administradores
            </p>
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Opciones de acceso:</strong><br/>
                • Usuario: admin, Contraseña: admin<br/>
                • O cualquier usuario con rol de administrador
              </p>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                placeholder="admin o email de administrador"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#01257D] hover:bg-[#013AAA] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01257D]"
            >
              Iniciar Sesión
            </button>
            
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin');
              }}
              className="w-full mt-2 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#01257D] dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Usar Credenciales por Defecto
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-[#01257D] mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Panel de Administración
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gestión de usuarios y base de datos
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-[#01257D] transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {getTotalUsers()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Usuarios Activos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {getActiveUsers()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Créditos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {getTotalCredits().toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Plan Pro+
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {users.filter(u => ['pro', 'enterprise'].includes(u.plan)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-[#01257D] text-[#01257D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Gestión de Usuarios
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-[#01257D] text-[#01257D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Configuraciones del Sistema
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <>
            {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
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
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D] text-gray-900 dark:text-white"
                />
              </div>

              {/* Plan Filter */}
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]"
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
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#01257D] focus:border-[#01257D]"
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
                className="px-4 py-2 bg-[#01257D] text-white rounded-md hover:bg-[#013AAA] focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:ring-offset-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6 p-4 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <Crown className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Upgrade a Pro</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Actualizar usuarios seleccionados a plan Pro
              </p>
              <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm">
                Próximamente
              </button>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Asignar Créditos</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Añadir créditos masivamente
              </p>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                Próximamente
              </button>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <UserPlus className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-gray-900 dark:text-white">Crear Usuario</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Crear nuevo usuario manualmente
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                Próximamente
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Lista de Usuarios ({filteredUsers.length})
            </h3>
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
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
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
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : user.profileType === 'business'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {user.profileType || 'Personal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.plan === 'enterprise' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : user.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : user.plan === 'basic'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.credits.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.lastLogin 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {user.lastLogin ? 'Activo' : 'Inactivo'}
                        </span>
                        {user.onboardingCompleted === false && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                            Onboarding
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {user.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-[#01257D] hover:text-[#013AAA] p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Editar usuario"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
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

        {/* Modal de Edición */}
        {editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-20 mx-4 p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white truncate pr-2">
                    Editar: {editingUser.name}
                  </h3>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Plan
                    </label>
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Perfil
                    </label>
                    <select
                      value={editForm.profileType}
                      onChange={(e) => setEditForm({ ...editForm, profileType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="personal">Personal</option>
                      <option value="political">Político</option>
                      <option value="business">Empresarial</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                  <button
                    onClick={() => setEditingUser(null)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="w-full sm:w-auto px-4 py-2 bg-[#01257D] text-white rounded-md hover:bg-[#013AAA] flex items-center justify-center"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-20 mx-4 p-4 sm:p-5 border w-full max-w-sm sm:max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                  Eliminar Usuario
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showDeleteConfirm)}
                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configuraciones del Sistema
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Administra las configuraciones globales de la plataforma
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Motor de Búsqueda */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                      <Power className="w-5 h-5 mr-2" />
                      Motor de Búsqueda de Personalidades
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Habilitar o deshabilitar completamente el motor de búsqueda
                    </p>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setSearchEngineEnabled(!searchEngineEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:ring-offset-2 ${
                        searchEngineEnabled ? 'bg-[#01257D]' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          searchEngineEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      {searchEngineEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </span>
                  </div>
                </div>
                
                {!searchEngineEnabled && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Mensaje de Mantenimiento
                    </label>
                    <textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                      placeholder="Mensaje que se mostrará cuando el motor esté deshabilitado..."
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Este mensaje se mostrará a los usuarios cuando el motor de búsqueda esté deshabilitado
                    </p>
                  </div>
                )}
              </div>

              {/* Estado Actual */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Estado Actual del Sistema
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mr-3 ${searchEngineEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Motor de Búsqueda
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {searchEngineEnabled ? 'Operativo' : 'Fuera de servicio'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Panel de Admin
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Operativo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardar Cambios */}
              <div className="flex justify-end">
                <button
                  onClick={saveSystemSettings}
                  disabled={settingsLoading}
                  className="px-6 py-2 bg-[#01257D] text-white rounded-md hover:bg-[#013AAA] focus:outline-none focus:ring-2 focus:ring-[#01257D] focus:ring-offset-2 disabled:opacity-50 flex items-center"
                >
                  {settingsLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {settingsLoading ? 'Guardando...' : 'Guardar Configuraciones'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
