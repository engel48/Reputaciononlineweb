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

// Funciones para gestionar notificaciones
export async function fetchUserNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
  try {
    // Esta sería la llamada a la API para obtener las notificaciones del usuario
    const response = await fetch(`/api/users/${userId}/notifications?limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    // Esta sería la llamada a la API para marcar la notificación como leída
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    return response.ok;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    // Esta sería la llamada a la API para marcar todas las notificaciones como leídas
    const response = await fetch(`/api/users/${userId}/notifications/read-all`, {
      method: 'PUT'
    });
    return response.ok;
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    // Esta sería la llamada a la API para eliminar una notificación
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
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
