"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, BellOff, Filter, SortDesc, MailOpen, Info, CheckCircle, AlertTriangle, XCircle, Settings } from 'lucide-react';
import { Notification, fetchUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notifications';
import { useUser } from '@/context/UserContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' };
    case 'error': return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'info': return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'system': return { icon: Settings, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' };
    default: return { icon: Bell, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10' };
  }
}

export default function NotificacionesPage() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const userId = user?.id || localStorage.getItem('userId') || '';
      if (!userId) {
        setIsLoading(false);
        return;
      }
      const data = await fetchUserNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const success = await markNotificationAsRead(id);
      if (success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (error) {
      console.error('Error al marcar notificacion como leida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = user?.id || localStorage.getItem('userId') || '';
      if (!userId) return;
      const success = await markAllNotificationsAsRead(userId);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error al marcar todas como leidas:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteNotification(id);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar notificacion:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortDesc ? dateB - dateA : dateA - dateB;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filterOptions = [
    { key: 'all' as const, label: 'Todas', count: notifications.length },
    { key: 'unread' as const, label: 'No leidas', count: unreadCount },
    { key: 'read' as const, label: 'Leidas', count: notifications.length - unreadCount },
  ];

  return (
    <motion.div
      className="container mx-auto px-4 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-[#01257D] to-indigo-600 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bell className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notificaciones</h1>
              <p className="text-blue-200 text-sm">
                {unreadCount > 0
                  ? `Tienes ${unreadCount} notificacion${unreadCount > 1 ? 'es' : ''} sin leer`
                  : 'Todas las notificaciones al dia'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center rounded-lg bg-white/10 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
              onClick={() => setSortDesc(!sortDesc)}
            >
              <SortDesc className={`mr-2 h-4 w-4 transition-transform ${!sortDesc ? 'rotate-180' : ''}`} />
              {sortDesc ? 'Recientes' : 'Antiguas'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center rounded-lg bg-white/20 backdrop-blur-sm px-3 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              onClick={handleMarkAllAsRead}
              disabled={isLoading || unreadCount === 0}
            >
              <MailOpen className="mr-2 h-4 w-4" />
              Marcar todas
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="flex gap-2 mb-6"
      >
        {filterOptions.map((opt) => (
          <motion.button
            key={opt.key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(opt.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === opt.key
                ? 'bg-[#01257D] text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#01257D]/30'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {opt.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === opt.key
                ? 'bg-white/20'
                : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              {opt.count}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((notification) => {
              const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
              return (
                <motion.div
                  key={notification.id}
                  variants={itemVariants}
                  exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, transition: { duration: 0.3 } }}
                  layout
                  whileHover={{ y: -2, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-default ${
                    !notification.isRead
                      ? 'bg-white dark:bg-gray-800 border-[#01257D]/20 dark:border-[#00E5FF]/20'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Icono */}
                  <div className={`flex-shrink-0 p-2.5 rounded-xl ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium text-sm ${
                          !notification.isRead
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] transition-colors"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Marcar como leida"
                      >
                        <Check className="h-4 w-4" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors"
                      onClick={() => handleDelete(notification.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-gray-800 p-12 text-center border border-gray-200 dark:border-gray-700"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <BellOff className="h-16 w-16 text-gray-300 dark:text-gray-600" />
          </motion.div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No hay notificaciones
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            {filter !== 'all'
              ? `No tienes notificaciones ${filter === 'unread' ? 'sin leer' : 'leidas'} en este momento.`
              : 'Cuando recibas alertas o menciones apareceran aqui.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
