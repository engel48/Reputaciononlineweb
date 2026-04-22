"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de datos
export interface CreditTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string;
  service?: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  features: string[];
  popular?: boolean;
}

interface CreditContextType {
  // Estados principales
  currentBalance: number;
  totalPurchased: number;
  totalUsed: number;
  isLoading: boolean;
  lastUpdated: Date | null;

  // Historial y transacciones
  transactions: CreditTransaction[];

  // Planes disponibles
  availablePlans: CreditPlan[];

  // Acciones
  purchaseCredits: (planId: string) => Promise<boolean>;
  refreshBalance: (newBalance?: number) => Promise<void>;
  refreshData: () => Promise<void>;

  // Utilidades
  getMonthlyUsage: () => number;
  getWeeklyUsage: () => number;
  getUsageByService: (service: string) => number;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

// Paquetes de creditos (recarga sin cambiar plan)
export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  popular?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack-500', name: '500 Creditos', credits: 500, price: 49900, pricePerCredit: 99.8 },
  { id: 'pack-1000', name: '1,000 Creditos', credits: 1000, price: 89900, pricePerCredit: 89.9, popular: true },
  { id: 'pack-2500', name: '2,500 Creditos', credits: 2500, price: 199900, pricePerCredit: 79.96 },
  { id: 'pack-5000', name: '5,000 Creditos', credits: 5000, price: 349900, pricePerCredit: 69.98 },
];

// Planes disponibles (estos son los productos que se pueden comprar)
const AVAILABLE_PLANS: CreditPlan[] = [
  {
    id: 'basico',
    name: 'Plan Basico',
    credits: 1000,
    price: 89900,
    features: [
      'Monitoreo de 3 redes sociales',
      'Analisis basico de sentimiento',
      'Reportes mensuales',
      'Soporte por email'
    ]
  },
  {
    id: 'profesional',
    name: 'Plan Profesional',
    credits: 3000,
    price: 199900,
    popular: true,
    features: [
      'Monitoreo de 10 redes sociales',
      'Analisis avanzado de sentimiento',
      'Reportes personalizados',
      'Alertas en tiempo real',
      'Soporte prioritario'
    ]
  },
  {
    id: 'empresarial',
    name: 'Plan Empresarial',
    credits: 10000,
    price: 499900,
    features: [
      'Monitoreo ilimitado',
      'IA avanzada y predicciones',
      'API personalizada',
      'Reportes ejecutivos',
      'Soporte 24/7',
      'Gestor de cuenta dedicado'
    ]
  }
];

export const CreditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [totalPurchased, setTotalPurchased] = useState<number>(0);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [availablePlans] = useState<CreditPlan[]>(AVAILABLE_PLANS);

  // Cargar datos reales desde la API
  const loadCreditsData = async () => {
    try {
      setIsLoading(true);

      // Obtener datos del usuario y transacciones desde la API
      const response = await fetch('/api/credits', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        // Si no hay autenticacion, mostrar balance en 0
        if (response.status === 401) {
          setCurrentBalance(0);
          setTotalPurchased(0);
          setTotalUsed(0);
          setTransactions([]);
          return;
        }
        throw new Error('Error al cargar creditos');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentBalance(data.data.balance || 0);
        setTotalPurchased(data.data.totalPurchased || 0);
        setTotalUsed(data.data.totalUsed || 0);
        setLastUpdated(new Date());

        // Mapear transacciones de la base de datos
        const mappedTransactions: CreditTransaction[] = (data.data.transactions || []).map((t: any) => ({
          id: t.id,
          date: t.created_at,
          amount: t.amount,
          type: t.type,
          description: t.description || '',
          service: t.related_entity || undefined,
          status: 'completed' as const,
        }));

        setTransactions(mappedTransactions);
      }
    } catch (error) {
      console.error('Error cargando datos de creditos:', error);
      // En caso de error, mantener valores en 0
      setCurrentBalance(0);
      setTotalPurchased(0);
      setTotalUsed(0);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualización optimista del balance. Si recibe `newBalance` lo setea
   * inmediatamente (sin fetch) y en background refresca el historial completo.
   * Si no recibe nada, hace un GET completo a /api/credits.
   */
  const refreshBalance = async (newBalance?: number): Promise<void> => {
    if (typeof newBalance === 'number' && newBalance >= 0) {
      setCurrentBalance(newBalance);
      setLastUpdated(new Date());
      // Refresco el historial completo en segundo plano
      loadCreditsData().catch(() => {});
      return;
    }
    await loadCreditsData();
  };

  // Inicializar datos al montar el componente
  useEffect(() => {
    loadCreditsData();
  }, []);

  // Escuchar evento global "creditsChanged" disparado por los endpoints IA
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { newBalance?: number } | undefined;
      refreshBalance(detail?.newBalance);
    };
    window.addEventListener('creditsChanged', handler);
    return () => window.removeEventListener('creditsChanged', handler);
  }, []);

  const purchaseCredits = async (planId: string): Promise<boolean> => {
    try {
      const plan = availablePlans.find(p => p.id === planId);
      if (!plan) return false;

      // Llamar a la API para registrar la compra
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId: plan.id,
          credits: plan.credits,
          amount: plan.price,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar compra');
      }

      const data = await response.json();

      if (data.success) {
        // Recargar datos para reflejar cambios
        await loadCreditsData();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error comprando creditos:', error);
      return false;
    }
  };

  const refreshData = async (): Promise<void> => {
    await loadCreditsData();
  };

  const getMonthlyUsage = (): number => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return Math.abs(transactions
      .filter(t => t.type === 'usage' && new Date(t.date) >= monthStart)
      .reduce((sum, t) => sum + t.amount, 0));
  };

  const getWeeklyUsage = (): number => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));

    return Math.abs(transactions
      .filter(t => t.type === 'usage' && new Date(t.date) >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0));
  };

  const getUsageByService = (service: string): number => {
    return Math.abs(transactions
      .filter(t => t.type === 'usage' && t.service === service)
      .reduce((sum, t) => sum + t.amount, 0));
  };

  const contextValue: CreditContextType = {
    currentBalance,
    totalPurchased,
    totalUsed,
    isLoading,
    lastUpdated,
    transactions,
    availablePlans,
    purchaseCredits,
    refreshBalance,
    refreshData,
    getMonthlyUsage,
    getWeeklyUsage,
    getUsageByService
  };

  return (
    <CreditContext.Provider value={contextValue}>
      {children}
    </CreditContext.Provider>
  );
};

export const useCredits = (): CreditContextType => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits debe usarse dentro de CreditProvider');
  }
  return context;
};
