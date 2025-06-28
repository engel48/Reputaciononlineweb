"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Tipos de datos
export interface CreditTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus';
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
  
  // Historial y transacciones
  transactions: CreditTransaction[];
  
  // Planes disponibles
  availablePlans: CreditPlan[];
  
  // Acciones
  purchaseCredits: (planId: string) => Promise<boolean>;
  useCredits: (amount: number, service: string, description: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilidades
  getMonthlyUsage: () => number;
  getWeeklyUsage: () => number;
  getUsageByService: (service: string) => number;
}

const CreditContext = createContext<CreditContextType | undefined>(undefined);

// Datos simulados para demostración
const DEMO_PLANS: CreditPlan[] = [
  {
    id: 'basic',
    name: 'Plan Básico',
    credits: 1000,
    price: 89900,
    features: [
      'Monitoreo de 3 redes sociales',
      'Análisis básico de sentimiento',
      'Reportes mensuales',
      'Soporte por email'
    ]
  },
  {
    id: 'professional',
    name: 'Plan Professional',
    credits: 3000,
    price: 199900,
    popular: true,
    features: [
      'Monitoreo de 10 redes sociales',
      'Análisis avanzado de sentimiento',
      'Reportes personalizados',
      'Alertas en tiempo real',
      'Soporte prioritario'
    ]
  },
  {
    id: 'enterprise',
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

const DEMO_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx-001',
    date: '2025-06-15T10:30:00Z',
    amount: 3000,
    type: 'purchase',
    description: 'Compra Plan Professional',
    status: 'completed'
  },
  {
    id: 'tx-002',
    date: '2025-06-14T14:20:00Z',
    amount: -150,
    type: 'usage',
    description: 'Análisis de sentimiento - Instagram',
    service: 'sentiment_analysis',
    status: 'completed'
  },
  {
    id: 'tx-003',
    date: '2025-06-13T09:45:00Z',
    amount: -75,
    type: 'usage',
    description: 'Monitoreo menciones - Twitter/X',
    service: 'social_monitoring',
    status: 'completed'
  },
  {
    id: 'tx-004',
    date: '2025-06-12T16:15:00Z',
    amount: -200,
    type: 'usage',
    description: 'Análisis competencia - Facebook',
    service: 'competitor_analysis',
    status: 'completed'
  },
  {
    id: 'tx-005',
    date: '2025-06-10T11:00:00Z',
    amount: 500,
    type: 'bonus',
    description: 'Bono de bienvenida',
    status: 'completed'
  }
];

export const CreditProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [totalPurchased, setTotalPurchased] = useState<number>(0);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [availablePlans] = useState<CreditPlan[]>(DEMO_PLANS);

  // Inicializar datos
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Simular carga de datos desde API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setTransactions(DEMO_TRANSACTIONS);
        
        // Calcular totales basados en transacciones
        const purchased = DEMO_TRANSACTIONS
          .filter(t => t.type === 'purchase' || t.type === 'bonus')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const used = Math.abs(DEMO_TRANSACTIONS
          .filter(t => t.type === 'usage')
          .reduce((sum, t) => sum + t.amount, 0));
        
        setTotalPurchased(purchased);
        setTotalUsed(used);
        setCurrentBalance(purchased - used);
        
      } catch (error) {
        console.error('Error inicializando datos de créditos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const purchaseCredits = async (planId: string): Promise<boolean> => {
    try {
      const plan = availablePlans.find(p => p.id === planId);
      if (!plan) return false;

      const newTransaction: CreditTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        amount: plan.credits,
        type: 'purchase',
        description: `Compra ${plan.name}`,
        status: 'completed'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setCurrentBalance(prev => prev + plan.credits);
      setTotalPurchased(prev => prev + plan.credits);

      return true;
    } catch (error) {
      console.error('Error comprando créditos:', error);
      return false;
    }
  };

  const useCredits = async (amount: number, service: string, description: string): Promise<boolean> => {
    try {
      if (currentBalance < amount) return false;

      const newTransaction: CreditTransaction = {
        id: `tx-${Date.now()}`,
        date: new Date().toISOString(),
        amount: -amount,
        type: 'usage',
        description,
        service,
        status: 'completed'
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setCurrentBalance(prev => prev - amount);
      setTotalUsed(prev => prev + amount);

      return true;
    } catch (error) {
      console.error('Error usando créditos:', error);
      return false;
    }
  };

  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    // Simular actualización de datos
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
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
    transactions,
    availablePlans,
    purchaseCredits,
    useCredits,
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
