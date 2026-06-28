/**
 * Sistema de notificaciones para la plataforma
 * Gestiona las notificaciones de usuario, alertas y mensajes del sistema
 */

export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

// Tipos específicos de notificaciones
export type AnalysisNotification = Notification & {
  type: 'info' | 'success';
  analysisId: string;
  progress?: number;
};

export type AccountNotification = Notification & {
  type: 'warning' | 'info' | 'error';
  accountAction?: 'subscription' | 'payment' | 'security' | 'credits';
};

export type SystemNotification = Notification & {
  type: 'system';
  priority: 'low' | 'medium' | 'high';
};

// Funciones para gestionar notificaciones (endpoint real: /api/notifications,
// auth por cookie/Bearer; la misma API que usa la app móvil).
export async function fetchUserNotifications(userId: string, _limit: number = 30): Promise<Notification[]> {
  try {
    const response = await fetch('/api/notifications', { credentials: 'include' });
    if (!response.ok) return [];
    const data = await response.json();
    const list: any[] = Array.isArray(data?.notifications) ? data.notifications : [];
    return list.map((n) => ({
      id: n.id,
      userId,
      type: n.type,
      title: n.title,
      message: n.message,
      link: n.actionUrl || undefined,
      isRead: !!n.read,
      createdAt: n.timestamp ? new Date(n.timestamp) : new Date(),
    }));
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markRead', id: notificationId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(_userId?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: notificationId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return false;
  }
}

// Funciones para crear notificaciones (usadas internamente por la API)
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification | null> {
  try {
    // Esta sería la llamada a la API para crear una nueva notificación
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notification,
        isRead: false,
      })
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return null;
  }
}

// Notificaciones para eventos específicos del sistema
export const NotificationTemplates = {
  ANALYSIS_COMPLETE: (username: string, analysisId: string, analysisType: string) => ({
    title: 'Análisis Completo',
    message: `¡Hola ${username}! Tu ${analysisType} ha sido completado y está listo para revisar.`,
    type: 'success' as const,
    link: `/dashboard/creditos/analisis/${analysisId}`
  }),
  
  CREDITS_LOW: (username: string, creditsLeft: number) => ({
    title: 'Créditos Bajos',
    message: `¡Atención ${username}! Te quedan solo ${creditsLeft} créditos. Considera recargar pronto.`,
    type: 'warning' as const,
    link: `/dashboard/creditos/comprar`
  }),
  
  SUBSCRIPTION_EXPIRING: (username: string, daysLeft: number) => ({
    title: 'Suscripción por Expirar',
    message: `Tu suscripción expirará en ${daysLeft} días. Renueva ahora para mantener el acceso a todas las funciones.`,
    type: 'info' as const,
    link: `/dashboard/perfil/suscripcion`
  }),
  
  PAYMENT_FAILED: (username: string) => ({
    title: 'Problema con el Pago',
    message: `Hubo un problema al procesar tu último pago. Por favor actualiza tu método de pago.`,
    type: 'error' as const,
    link: `/dashboard/perfil/metodos-pago`
  }),

  NEW_MENTION: (username: string, source: string, mentionId: string) => ({
    title: 'Nueva Mención Detectada',
    message: `Hemos detectado una nueva mención de tu marca en ${source}.`,
    type: 'info' as const,
    link: `/dashboard/redes-sociales/menciones/${mentionId}`
  }),
};
