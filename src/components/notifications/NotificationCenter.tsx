"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ArrowRight, Facebook, Instagram, ChevronDown } from 'lucide-react';
import XLogo from '@/components/icons/XLogo';
import { gsap } from 'gsap';
import { useUser } from '@/context/UserContext';

// Tipado para las notificaciones
interface Notification {
  id: string;
  type: 'mention' | 'alert' | 'update' | 'system';
  title: string;
  message: string;
  source?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Tipado para menciones simuladas
interface SimulatedMention {
  source: string;
  content: string;
  date: string;
  url: string;
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Datos de menciones simulados para cuando no hay datos disponibles
  const simulatedMentions: SimulatedMention[] = [
    {
      source: 'x',
      content: 'Excelente servicio de atención al cliente. Muy satisfecha con la rapidez de respuesta.',
      date: new Date().toISOString(),
      url: 'https://x.com/example/status/123456789'
    },
    {
      source: 'facebook',
      content: 'Me encantó el producto, aunque podrían mejorar el envoltorio para hacerlo más ecológico.',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://facebook.com/example/posts/987654321'
    },
    {
      source: 'instagram',
      content: 'Totalmente recomendable. No cambiaría por ninguna otra marca.',
      date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      url: 'https://instagram.com/p/example123'
    }
  ];

  // Generar notificaciones basadas en el usuario actual
  useEffect(() => {
    // Crear notificaciones del sistema
    const systemNotifications: Notification[] = [
      {
        id: 'notification_system_1',
        type: 'system',
        title: 'Actualización de la plataforma',
        message: 'Nuevas funcionalidades disponibles en el módulo de Análisis.',
        timestamp: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        read: false
      },
      {
        id: 'notification_alert_1',
        type: 'alert',
        title: 'Alerta de reputación',
        message: 'Se ha detectado un incremento en menciones negativas en las últimas 24 horas.',
        timestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString(),
        read: false,
        actionUrl: '/dashboard/analytics'
      },
      {
        id: 'notification_update_1',
        type: 'update',
        title: 'Plan Pro activado',
        message: 'Tu suscripción al Plan Pro ha sido activada correctamente.',
        timestamp: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        read: true,
        actionUrl: '/dashboard/credito'
      }
    ];
    
    // Crear notificaciones basadas en menciones
    let mentionNotifications: Notification[] = [];
    
    // Verificar si tenemos menciones reales para usar
    if (user?.reputation?.recentMentions && Array.isArray(user.reputation.recentMentions) && user.reputation.recentMentions.length > 0) {
      mentionNotifications = user.reputation.recentMentions.slice(0, 3).map((mention, index) => ({
        id: `notification_mention_${index}`,
        type: 'mention' as const,
        title: `Nueva mención en ${mention.source}`,
        message: mention.content.length > 80 ? mention.content.substring(0, 80) + '...' : mention.content,
        source: mention.source,
        timestamp: mention.date,
        read: false,
        actionUrl: mention.url
      }));
    } else {
      // Usar menciones simuladas si no hay reales
      mentionNotifications = simulatedMentions.map((mention, index) => ({
        id: `notification_mention_${index}`,
        type: 'mention' as const,
        title: `Nueva mención en ${mention.source}`,
        message: mention.content.length > 80 ? mention.content.substring(0, 80) + '...' : mention.content,
        source: mention.source,
        timestamp: mention.date,
        read: false,
        actionUrl: mention.url
      }));
    }

    // Combinar todas las notificaciones y ordenarlas por fecha
    const allNotifications = [...mentionNotifications, ...systemNotifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(allNotifications);
    setUnreadCount(allNotifications.filter(notif => !notif.read).length);
  }, [user]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto de animación para el dropdown
  useEffect(() => {
    if (dropdownRef.current) {
      if (isOpen) {
        gsap.fromTo(
          dropdownRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
        );
      } else {
        gsap.to(dropdownRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.2,
          ease: 'power3.in'
        });
      }
    }
  }, [isOpen]);

  // Marcar una notificación como leída
  const markAsRead = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = () => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  // Renderizar icono basado en fuente
  const renderSourceIcon = (source: string | undefined) => {
    if (!source) return null;
    
    switch (source.toLowerCase()) {
      case 'x':
        return <XLogo className="h-4 w-4" />;
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="relative rounded-full bg-white p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700"
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-gray-200 px-4 py-3 dark:border-gray-700 ${
                    notification.read ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                  }`}
                >
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      {renderSourceIcon(notification.source)}
                      <span className="ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(notification.timestamp).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </h4>
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                    {notification.message}
                  </p>
                  {notification.actionUrl && (
                    <a
                      href={notification.actionUrl}
                      className="mt-2 flex items-center text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Ver detalles
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones.</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
              <a
                href="/dashboard/notificaciones"
                className="flex items-center justify-center text-xs font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Ver todas las notificaciones
                <ChevronDown className="ml-1 h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
