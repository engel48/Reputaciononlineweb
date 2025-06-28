"use client";

import React, { useState, useEffect } from 'react';
import { BellIcon, Check, Trash2, Calendar, User, BellOff, Filter, SortDesc, MailOpen } from 'lucide-react';
import { Notification, fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notifications';

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Función para cargar notificaciones
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      // Para demo usamos un ID fijo, en producción vendría del contexto de autenticación
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const data = await fetchUserNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marcar notificación como leída
  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      // Para demo usamos un ID fijo
      const userId = localStorage.getItem('userId') || 'demo-user-123';
      const success = await markAllNotificationsAsRead(userId);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  // Eliminar notificación
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteNotification(id);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  // Filtrar notificaciones según el filtro activo
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortDesc ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notificaciones</h1>
        
        <div className="flex items-center space-x-2">
          {/* Filtros */}
          <div className="relative">
            <button 
              className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setFilter(filter === 'all' ? 'unread' : filter === 'unread' ? 'read' : 'all')}
            >
              <Filter className="mr-2 h-4 w-4" />
              {filter === 'all' ? 'Todas' : filter === 'unread' ? 'No leídas' : 'Leídas'}
            </button>
          </div>
          
          {/* Ordenar */}
          <button 
            className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            onClick={() => setSortDesc(!sortDesc)}
          >
            <SortDesc className={`mr-2 h-4 w-4 ${!sortDesc ? 'rotate-180 transform' : ''}`} />
            {sortDesc ? 'Más recientes' : 'Más antiguas'}
          </button>
          
          {/* Marcar todas como leídas */}
          <button 
            className="flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
            onClick={handleMarkAllAsRead}
            disabled={isLoading || !notifications.some(n => !n.isRead)}
          >
            <MailOpen className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="divide-y divide-gray-200 rounded-lg bg-white shadow-md dark:divide-gray-700 dark:bg-gray-800">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`flex p-4 ${!notification.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              {/* Icono */}
              <div className={`mr-4 rounded-full p-2 ${
                notification.type === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 
                notification.type === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {notification.type === 'system' ? 
                  <BellIcon className="h-6 w-6" /> : 
                  notification.type === 'error' ? 
                    <User className="h-6 w-6" /> : 
                    <Calendar className="h-6 w-6" />
                }
              </div>
              
              {/* Contenido */}
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className={`font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
                
                {/* Acciones */}
                <div className="mt-2 flex justify-end space-x-2">
                  {!notification.isRead && (
                    <button 
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-700"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Marcar como leída"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  <button 
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                    onClick={() => handleDelete(notification.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <BellOff className="mb-3 h-12 w-12 text-gray-400" />
          <h3 className="mb-1 text-lg font-medium text-gray-900 dark:text-white">No hay notificaciones</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filter !== 'all' 
              ? `No tienes notificaciones ${filter === 'unread' ? 'no leídas' : 'leídas'} en este momento.`
              : 'No tienes notificaciones en este momento.'}
          </p>
        </div>
      )}
    </div>
  );
}
