"use client";

import React, { useState, useEffect } from 'react';
import { User, Camera, Save, X, UserCog, Shield, Megaphone, Award, Facebook, Instagram, Share2, Linkedin, Youtube, Globe, Settings, Bell, Lock, CreditCard, Crown, Check, Star, Zap, ArrowUpRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import { useSearchParams } from 'next/navigation';

interface ProfileFormData {
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  bio: string;
  partidoPolitico?: string;
  cargoActual?: string;
  propuestasPrincipales?: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useUser();
  const { currentPlan, features, hasFeature, changePlan } = usePlan();
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<'personal' | 'politico'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('perfil');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    language: 'es',
    timezone: 'America/Bogota'
  });
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    bio: '',
    partidoPolitico: '',
    cargoActual: '',
    propuestasPrincipales: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.name || '',
        email: user.email || '',
        telefono: user.phone || '',
        empresa: user.company || '',
        bio: user.bio || '',
        partidoPolitico: user.partidoPolitico || '',
        cargoActual: user.cargoActual || '',
        propuestasPrincipales: user.propuestasPrincipales || '',
      });
      
      if (user.avatarUrl) {
        setAvatar(user.avatarUrl);
      }
      
      if (user.profileCategory) {
        const isPolitico = user.profileCategory.toLowerCase().includes('político') || 
                          user.profileCategory.toLowerCase().includes('gubernamental');
        setUserType(isPolitico ? 'politico' : 'personal');
      }
    }
  }, [user]);

  useEffect(() => {
    // Verificar si vienen de una compra exitosa
    const success = searchParams.get('success');
    const tab = searchParams.get('tab');
    const plan = searchParams.get('plan');
    
    if (success === 'true' && plan) {
      setActiveTab('plan');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    } else if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updateData = {
        name: formData.nombre,
        email: formData.email,
        phone: formData.telefono,
        company: formData.empresa,
        bio: formData.bio,
        avatarUrl: avatar || user?.avatarUrl,
        ...(userType === 'politico' && {
          partidoPolitico: formData.partidoPolitico,
          cargoActual: formData.cargoActual,
          propuestasPrincipales: formData.propuestasPrincipales
        })
      };
      
      await updateUser(updateData);
      alert('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlanChange = (newPlan: string) => {
    // Redirigir a la página de pago
    window.location.href = `/dashboard/pago?plan=${newPlan}`;
  };

  const handlePreferencesUpdate = async (newPreferences: any) => {
    setPreferences(newPreferences);
    try {
      await updateUser({ settings: newPreferences });
    } catch (error) {
      console.error('Error al actualizar preferencias:', error);
    }
  };

  const handleSecurityUpdate = async (securityData: any) => {
    try {
      // Implementar cambio de contraseña
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(securityData)
      });
      
      if (response.ok) {
        alert('Contraseña actualizada correctamente');
        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactorEnabled: false });
      } else {
        alert('Error al actualizar la contraseña');
      }
    } catch (error) {
      console.error('Error al actualizar seguridad:', error);
      alert('Error al actualizar la seguridad');
    }
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('perfil')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'perfil' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <User className="mr-2 h-5 w-5" />
              Información Personal
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('cuentas')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'cuentas' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <Share2 className="mr-2 h-5 w-5" />
              Redes Sociales
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('preferencias')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'preferencias' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <Settings className="mr-2 h-5 w-5" />
              Preferencias
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('notificaciones')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'notificaciones' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <Bell className="mr-2 h-5 w-5" />
              Notificaciones
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('seguridad')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'seguridad' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <Lock className="mr-2 h-5 w-5" />
              Seguridad
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab('plan')}
              className={`inline-flex items-center py-4 px-4 text-sm font-medium text-center border-b-2 ${activeTab === 'plan' 
                ? 'text-[#01257D] border-[#01257D] dark:text-[#01257D] dark:border-[#01257D]' 
                : 'border-transparent hover:text-[#01257D] hover:border-[#01257D] dark:hover:text-[#01257D]'}`}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Plan y Facturación
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'perfil' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Información del perfil */}
          <div className="col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                      {userType === 'politico' ? 
                        <UserCog className="h-16 w-16" /> : 
                        <User className="h-16 w-16" />
                      }
                    </div>
                  )}
                  <label 
                    htmlFor="avatar-upload" 
                    className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#01257D] text-white hover:bg-[#013AAA]"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </div>

                <h2 className="text-lg font-medium text-gray-900 dark:text-white">{formData.nombre}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
                <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {userType === 'politico' ? 'Perfil Político' : 'Persona Natural'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario principal */}
          <div className="col-span-1 lg:col-span-2">
            <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h2 className="mb-6 border-b border-gray-200 pb-3 text-xl font-medium text-gray-900 dark:border-gray-700 dark:text-white">
                Información Personal
              </h2>

              <div className="mb-8 grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userType === 'politico' ? 'Partido político' : 'Empresa o marca'}
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Biografía / Descripción
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Breve descripción que aparecerá en tu perfil público.
                </p>
              </div>

              {userType === 'politico' && (
                <>
                  <h2 className="mb-6 border-b border-gray-200 pb-3 text-xl font-medium text-gray-900 dark:border-gray-700 dark:text-white">
                    Información Política
                  </h2>
                  
                  <div className="mb-8 grid gap-6 md:grid-cols-2">
                    <div>
                      <label htmlFor="cargoActual" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cargo actual o al que aspira
                      </label>
                      <input
                        type="text"
                        id="cargoActual"
                        name="cargoActual"
                        value={formData.cargoActual}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="propuestasPrincipales" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Propuestas principales
                    </label>
                    <textarea
                      id="propuestasPrincipales"
                      name="propuestasPrincipales"
                      rows={4}
                      value={formData.propuestasPrincipales}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Resume tus principales propuestas políticas o áreas de interés.
                    </p>
                  </div>
                </>
              )}

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center rounded-lg bg-[#01257D] px-4 py-2 text-sm font-medium text-white hover:bg-[#013AAA] focus:outline-none focus:ring-4 focus:ring-[#01257D]/50"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pestaña simplificada - Redes Sociales */}
      {activeTab === 'cuentas' && (
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Conectar Redes Sociales</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Conecta tus redes sociales para monitorear tu reputación online.
          </p>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
              { name: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
              { name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
              { name: 'YouTube', icon: Youtube, color: 'bg-red-600' }
            ].map((platform) => (
              <div key={platform.name} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex items-center">
                  <div className={`mr-3 rounded-full p-2 text-white ${platform.color}`}>
                    <platform.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-medium">{platform.name}</h3>
                </div>
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#01257D] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#013AAA]"
                >
                  Conectar cuenta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pestaña de Preferencias */}
      {activeTab === 'preferencias' && (
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Preferencias</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Modo Oscuro</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activa el tema oscuro para una mejor experiencia nocturna</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.darkMode}
                  onChange={(e) => handlePreferencesUpdate({ ...preferences, darkMode: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notificaciones</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe notificaciones sobre menciones y alertas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.notifications}
                  onChange={(e) => handlePreferencesUpdate({ ...preferences, notifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idioma</label>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferencesUpdate({ ...preferences, language: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Zona Horaria</label>
              <select
                value={preferences.timezone}
                onChange={(e) => handlePreferencesUpdate({ ...preferences, timezone: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="America/Bogota">Colombia (GMT-5)</option>
                <option value="America/Mexico_City">México (GMT-6)</option>
                <option value="America/Argentina/Buenos_Aires">Argentina (GMT-3)</option>
                <option value="Europe/Madrid">España (GMT+1)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña de Notificaciones */}
      {activeTab === 'notificaciones' && (
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Configuración de Notificaciones</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notificaciones por Email</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe alertas importantes por correo electrónico</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.emailNotifications}
                  onChange={(e) => handlePreferencesUpdate({ ...preferences, emailNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Notificaciones SMS</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe alertas críticas por mensaje de texto</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.smsNotifications}
                  onChange={(e) => handlePreferencesUpdate({ ...preferences, smsNotifications: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Emails de Marketing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recibe consejos y noticias sobre reputación online</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={preferences.marketingEmails}
                  onChange={(e) => handlePreferencesUpdate({ ...preferences, marketingEmails: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Pestaña de Seguridad */}
      {activeTab === 'seguridad' && (
        <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Configuración de Seguridad</h2>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSecurityUpdate(security); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contraseña Actual</label>
              <input
                type="password"
                value={security.currentPassword}
                onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nueva Contraseña</label>
              <input
                type="password"
                value={security.newPassword}
                onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Ingresa una nueva contraseña"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                value={security.confirmPassword}
                onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-[#01257D] focus:ring-[#01257D] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Confirma la nueva contraseña"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Autenticación de Dos Factores</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Añade una capa extra de seguridad a tu cuenta</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={security.twoFactorEnabled}
                  onChange={(e) => setSecurity({ ...security, twoFactorEnabled: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#01257D]/25 dark:peer-focus:ring-[#01257D]/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#01257D]"></div>
              </label>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA] focus:outline-none focus:ring-4 focus:ring-[#01257D]/50"
              >
                <Lock className="mr-2 h-4 w-4" />
                Actualizar Seguridad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pestaña de Plan y Facturación */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Mensaje de Éxito */}
          {showSuccessMessage && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300">
                    ¡Plan actualizado exitosamente!
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Todas las nuevas funciones ya están disponibles en tu dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Plan Actual */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan Actual</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                currentPlan === 'free' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                currentPlan === 'basic' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                currentPlan === 'pro' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                <Crown className="mr-1 h-3 w-3" />
                {currentPlan.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-[#01257D] dark:text-white">
                  {features.maxMonthlyCredits === -1 ? '∞' : features.maxMonthlyCredits}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Créditos Mensuales</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-[#01257D] dark:text-white">
                  {features.maxSocialAccounts === -1 ? '∞' : features.maxSocialAccounts}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Sociales</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-[#01257D] dark:text-white">
                  {features.maxReports === -1 ? '∞' : features.maxReports}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reportes Mensuales</p>
              </div>
            </div>
            
            {/* Características Activas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Características Incluidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: 'hasSentimentAnalysis', label: 'Análisis de Sentimientos' },
                  { key: 'hasRealTimeMonitoring', label: 'Monitoreo en Tiempo Real' },
                  { key: 'hasAdvancedAnalytics', label: 'Analíticas Avanzadas' },
                  { key: 'hasCompetitorAnalysis', label: 'Análisis de Competencia' },
                  { key: 'hasCustomReports', label: 'Reportes Personalizados' },
                  { key: 'hasAPIAccess', label: 'Acceso a API' },
                  { key: 'hasPrioritySupport', label: 'Soporte Prioritario' },
                  { key: 'hasVoterSentiment', label: 'Análisis Político' },
                ].map((feature) => (
                  <div key={feature.key} className={`flex items-center space-x-2 p-2 rounded ${
                    hasFeature(feature.key as keyof typeof features) 
                      ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/20'
                      : 'text-gray-500 bg-gray-50 dark:text-gray-400 dark:bg-gray-700'
                  }`}>
                    {hasFeature(feature.key as keyof typeof features) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span className="text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Cambiar Plan */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cambiar Plan</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'free', name: 'Gratis', price: '$0', color: 'border-gray-300' },
                { id: 'basic', name: 'Básico', price: '$29', color: 'border-blue-500' },
                { id: 'pro', name: 'Pro', price: '$99', color: 'border-purple-500' },
                { id: 'enterprise', name: 'Enterprise', price: '$299', color: 'border-yellow-500' }
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? `${plan.color} bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20`
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                  } ${currentPlan === plan.id ? 'ring-2 ring-[#01257D] ring-offset-2' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {currentPlan === plan.id && (
                    <div className="absolute -top-2 -right-2 bg-[#01257D] text-white px-2 py-1 rounded-full text-xs font-medium">
                      Actual
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                    <p className="text-2xl font-bold text-[#01257D] dark:text-white mt-2">{plan.price}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">/mes</p>
                  </div>
                  
                  {selectedPlan === plan.id && selectedPlan !== currentPlan && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlanChange(plan.id);
                        }}
                        disabled={isChangingPlan}
                        className="w-full bg-[#01257D] text-white px-4 py-2 rounded-lg hover:bg-[#013AAA] transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <>
                          <ArrowUpRight className="mr-1 h-4 w-4" />
                          {selectedPlan === 'free' ? 'Activar' : 'Comprar'}
                        </>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {selectedPlan !== currentPlan && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Cambio de Plan</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      Al cambiar al plan {selectedPlan.toUpperCase()}, tendrás acceso inmediato a todas las nuevas funciones. 
                      {selectedPlan !== 'free' && 'Los cambios se reflejarán en tu próxima facturación.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}