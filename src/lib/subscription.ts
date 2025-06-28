/**
 * Biblioteca de funciones para gestión de suscripciones y pagos
 */

// Tipos para suscripciones
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  creditsPerCycle: number;
  isPopular?: boolean;
}

// Planes de suscripción disponibles
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-basico-mensual',
    name: 'Plan Básico',
    description: 'Para necesidades básicas de monitoreo',
    price: 99000,
    billingCycle: 'monthly',
    features: [
      'Monitoreo de menciones básico',
      'Análisis de sentimiento limitado',
      'Soporte por email',
      '500 créditos mensuales'
    ],
    creditsPerCycle: 500
  },
  {
    id: 'plan-pro-mensual',
    name: 'Plan Profesional',
    description: 'Para empresas en crecimiento',
    price: 249000,
    billingCycle: 'monthly',
    features: [
      'Monitoreo de menciones avanzado',
      'Análisis de sentimiento completo',
      'Soporte prioritario por email y chat',
      'Reportes personalizados',
      '1500 créditos mensuales'
    ],
    creditsPerCycle: 1500,
    isPopular: true
  },
  {
    id: 'plan-empresarial-mensual',
    name: 'Plan Empresarial',
    description: 'Para grandes organizaciones',
    price: 499000,
    billingCycle: 'monthly',
    features: [
      'Monitoreo de menciones ilimitado',
      'Análisis de sentimiento avanzado',
      'Soporte prioritario 24/7',
      'Reportes personalizados avanzados',
      'API de acceso',
      '5000 créditos mensuales'
    ],
    creditsPerCycle: 5000
  }
];

// Planes anuales con descuento
export const yearlySubscriptionPlans: SubscriptionPlan[] = subscriptionPlans.map(plan => ({
  ...plan,
  id: plan.id.replace('mensual', 'anual'),
  billingCycle: 'yearly' as const,
  price: Math.round(plan.price * 10), // Precio anual (10 meses en lugar de 12, descuento de 2 meses)
  creditsPerCycle: plan.creditsPerCycle * 12, // Créditos anuales
  name: `${plan.name} (Anual)`
}));

// Funciones para gestionar suscripciones
export async function createSubscription(userId: string, planId: string): Promise<Subscription | null> {
  try {
    // Aquí iría la lógica para crear una suscripción en tu backend/API
    // Este es un mock para ilustrar la función
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, planId })
    });
    
    if (!response.ok) throw new Error('Error al crear la suscripción');
    return await response.json();
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    return null;
  }
}

export async function cancelSubscription(subscriptionId: string, cancelImmediately: boolean = false): Promise<boolean> {
  try {
    // Aquí iría la lógica para cancelar una suscripción
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelImmediately })
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return false;
  }
}

export async function updateSubscription(subscriptionId: string, planId: string): Promise<Subscription | null> {
  try {
    // Aquí iría la lógica para actualizar una suscripción
    const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    
    if (!response.ok) throw new Error('Error al actualizar la suscripción');
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar suscripción:', error);
    return null;
  }
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    // Aquí iría la lógica para obtener la suscripción activa del usuario
    const response = await fetch(`/api/users/${userId}/subscription`);
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error al obtener suscripción del usuario:', error);
    return null;
  }
}

export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return [...subscriptionPlans, ...yearlySubscriptionPlans].find(plan => plan.id === planId);
}

// Función para calcular el próximo ciclo de facturación
export function getNextBillingDate(currentPeriodEnd: Date): string {
  const date = new Date(currentPeriodEnd);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
