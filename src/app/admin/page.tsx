"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Eye, EyeOff, Users, Database, BarChart3, Shield, Search, RefreshCw,
  Edit, Trash2, DollarSign, Crown, UserPlus, X, Check, Settings, Power,
  MessageSquare, Home, CreditCard, Bell, Menu, LogOut, Globe
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
}

// ============================================================
// COMPONENTE: Login Dark Tech
// ============================================================
function AdminLogin({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user?.role === 'admin') {
        onLoginSuccess();
      } else if (data.user && data.user.role !== 'admin') {
        setError('Esta cuenta no tiene permisos de administrador');
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Patrón de fondo - Grilla sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 229, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 229, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Glow decorativo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00E5FF]/3 rounded-full blur-3xl" />

      {/* Tarjeta de Login */}
      <div className="relative w-full max-w-md">
        {/* Glow detrás de la tarjeta */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF]/20 via-[#00E5FF]/10 to-[#00E5FF]/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative bg-[#1F2937] rounded-2xl border border-gray-700/50 shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00E5FF]/10 mb-4">
              <Shield className="w-8 h-8 text-[#00E5FF]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-400 text-sm">
              Ingresa al panel de administración
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0B1120] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all duration-200"
                placeholder="admin@ejemplo.com"
                required
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#0B1120] border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00E5FF] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-xl hover:bg-[#00D4ED] focus:outline-none focus:ring-2 focus:ring-[#00E5FF] focus:ring-offset-2 focus:ring-offset-[#1F2937] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Ingresar al Panel
                </>
              )}
            </button>
          </form>

          {/* Link inferior */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-[#00E5FF] transition-colors"
            >
              ← Volver al login de usuarios
            </Link>
          </div>
        </div>

        {/* Texto inferior */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Panel de Administración • Reputación Online
        </p>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE: Sidebar Admin (después de autenticación)
// ============================================================
function AdminSidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', icon: Home, label: 'Dashboard' },
    { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
    { href: '/admin/creditos', icon: CreditCard, label: 'Créditos' },
    { href: '/admin/pagos', icon: DollarSign, label: 'Pagos' },
    { href: '/admin/planes', icon: Crown, label: 'Planes' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1120] border-r border-gray-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
        <Link href="/admin" className="flex items-center">
          <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#00E5FF]" />
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-lg font-bold text-white">Admin</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg text-gray-400 hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#00E5FF]/15 text-[#00E5FF]'
                  : 'text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] transition-all duration-200`}
        >
          <Globe className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : ''}`} />
          {!isCollapsed && <span className="font-medium">Ir al Dashboard</span>}
        </Link>
      </div>
    </aside>
  );
}

// ============================================================
// COMPONENTE: Dashboard Admin Content
// ============================================================
function AdminDashboardContent({ onLogout }: { onLogout: () => void }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ plan: '', credits: '', profileType: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [searchEngineEnabled, setSearchEngineEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadSystemSettings();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (data.success) {
        const settings = data.settings || [];
        const searchSetting = settings.find((s: any) => s.key === 'search_engine_enabled');
        const messageSetting = settings.find((s: any) => s.key === 'maintenance_message');
        setSearchEngineEnabled(searchSetting?.value === 'true' || searchSetting?.value === undefined);
        setMaintenanceMessage(messageSetting?.value || 'El motor de búsqueda está temporalmente deshabilitado.');
      }
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    }
  };

  const saveSystemSettings = async () => {
    setSettingsLoading(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'search_engine_enabled', value: searchEngineEnabled.toString() })
      });
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'maintenance_message', value: maintenanceMessage })
      });
      alert('Configuraciones guardadas');
    } catch (error) {
      alert('Error guardando configuraciones');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ plan: user.plan, credits: user.credits.toString(), profileType: user.profileType || 'personal' });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const response = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: editingUser.id,
          plan: editForm.plan,
          credits: parseInt(editForm.credits),
          profileType: editForm.profileType
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await loadUsers();
        setEditingUser(null);
      } else {
        alert(data.message || 'Error actualizando usuario');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await loadUsers();
        setShowDeleteConfirm(null);
      } else {
        alert(data.message || 'Error eliminando usuario');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = filterPlan === 'all' || user.plan === filterPlan;
    const matchesType = filterType === 'all' || user.profileType === filterType;
    return matchesSearch && matchesPlan && matchesType;
  });

  const getTotalUsers = () => users.length;
  const getActiveUsers = () => users.filter(u => u.lastLogin).length;
  const getTotalCredits = () => users.reduce((sum, u) => sum + u.credits, 0);

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <AdminSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 h-16 bg-[#151C2E] border-b border-gray-800 flex items-center justify-between px-6">
          <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </header>

        <main className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#151C2E] rounded-xl p-5 border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#00E5FF]/10 rounded-xl">
                  <Users className="w-6 h-6 text-[#00E5FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Usuarios</p>
                  <p className="text-2xl font-bold text-white">{getTotalUsers()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#151C2E] rounded-xl p-5 border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-white">{getActiveUsers()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#151C2E] rounded-xl p-5 border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Database className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Créditos</p>
                  <p className="text-2xl font-bold text-white">{getTotalCredits().toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#151C2E] rounded-xl p-5 border border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl">
                  <Crown className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Plan Pro+</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => ['pro', 'enterprise'].includes(u.plan)).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-[#151C2E] rounded-xl border border-gray-800 mb-6">
            <div className="flex border-b border-gray-800">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-5 h-5" />
                Gestión de Usuarios
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
                Configuraciones
              </button>
            </div>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              {/* Filters */}
              <div className="bg-[#151C2E] rounded-xl border border-gray-800 p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#0B1120] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#00E5FF]"
                    />
                  </div>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value)}
                    className="px-4 py-2.5 bg-[#0B1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value="all">Todos los planes</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2.5 bg-[#0B1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value="all">Todos los tipos</option>
                    <option value="personal">Personal</option>
                    <option value="political">Político</option>
                    <option value="business">Empresarial</option>
                  </select>
                  <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="px-4 py-2.5 bg-[#00E5FF] text-[#0B1120] font-medium rounded-xl hover:bg-[#00D4ED] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-[#151C2E] rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h3 className="text-lg font-medium text-white">Lista de Usuarios ({filteredUsers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1120]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Plan</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Créditos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Creado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-[#1A202C] transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.profileType === 'political' ? 'bg-blue-500/20 text-blue-400' :
                              user.profileType === 'business' ? 'bg-green-500/20 text-green-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.profileType || 'Personal'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                              user.plan === 'pro' ? 'bg-[#00E5FF]/20 text-[#00E5FF]' :
                              user.plan === 'basic' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white">{user.credits.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.lastLogin ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {user.lastLogin ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role !== 'admin' ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(user.id)}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 italic">Protegido</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-[#151C2E] rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-medium text-white mb-6">Configuraciones del Sistema</h3>

              <div className="space-y-6">
                {/* Motor de búsqueda */}
                <div className="p-4 bg-[#0B1120] rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <Power className="w-5 h-5" />
                        Motor de Búsqueda
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">Habilitar o deshabilitar el motor de búsqueda</p>
                    </div>
                    <button
                      onClick={() => setSearchEngineEnabled(!searchEngineEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        searchEngineEnabled ? 'bg-[#00E5FF]' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        searchEngineEnabled ? 'left-7' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {!searchEngineEnabled && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Mensaje de mantenimiento</label>
                      <textarea
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-[#151C2E] border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={saveSystemSettings}
                  disabled={settingsLoading}
                  className="px-6 py-3 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-xl hover:bg-[#00D4ED] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {settingsLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Guardar Configuraciones
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1F2937] rounded-2xl border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Editar: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Créditos</label>
                <input
                  type="number"
                  value={editForm.credits}
                  onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Tipo de Perfil</label>
                <select
                  value={editForm.profileType}
                  onChange={(e) => setEditForm({ ...editForm, profileType: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B1120] border border-gray-600 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                >
                  <option value="personal">Personal</option>
                  <option value="political">Político</option>
                  <option value="business">Empresarial</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 py-3 bg-[#00E5FF] text-[#0B1120] font-semibold rounded-xl hover:bg-[#00D4ED] transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1F2937] rounded-2xl border border-gray-700 p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Eliminar Usuario</h3>
            <p className="text-gray-400 mb-6">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Al montar, verifica si ya hay sesion admin valida (cookie auth-token)
  // antes de mostrar el formulario de login. Sin esto, F5 o navegacion
  // hacia /admin desde otra ruta siempre mostraba el login otra vez.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/verify', { method: 'GET', credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled) return;
        if (data && data.success && data.user?.role === 'admin') {
          setIsAuthenticated(true);
        }
      })
      .catch(() => { /* sin sesion, mostrara el login */ })
      .finally(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    setIsAuthenticated(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando sesion...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminDashboardContent onLogout={handleLogout} />;
}
