/**
 * Helper server-side para deduccion atomica de creditos
 * Usa las funciones SQL de Supabase para operaciones atomicas
 */

import { supabase } from '@/lib/supabase-server';
import { CREDIT_COSTS, CreditAction } from './credit-costs';

export interface CreditGuardResult {
  success: boolean;
  newBalance?: number;
  transactionId?: string;
  error?: string;
  insufficientCredits?: boolean;
  cost?: number;
}

/**
 * Deduce creditos para una accion especifica
 * Usa la funcion SQL deduct_user_credits() para operacion atomica
 */
export async function deductCreditsForAction(
  userId: string,
  action: CreditAction,
  quantity: number = 1,
  description?: string
): Promise<CreditGuardResult> {
  const totalCost = CREDIT_COSTS[action] * quantity;

  try {
    const { data, error } = await supabase.rpc('deduct_user_credits', {
      p_user_id: userId,
      p_amount: totalCost,
      p_description: description || `${action} x${quantity}`,
      p_related_entity: action,
    });

    if (error) {
      // La funcion SQL lanza 'Insufficient credits' si no hay saldo
      if (error.message?.includes('Insufficient credits')) {
        return {
          success: false,
          insufficientCredits: true,
          error: 'Creditos insuficientes',
          cost: totalCost,
        };
      }
      return { success: false, error: error.message, cost: totalCost };
    }

    const result = data?.[0];

    return {
      success: true,
      newBalance: result?.new_balance ?? undefined,
      transactionId: result?.transaction_id ?? undefined,
      cost: totalCost,
    };
  } catch (err: any) {
    return { success: false, error: err.message, cost: totalCost };
  }
}

/**
 * Verifica si el usuario tiene saldo suficiente sin deducir
 */
export async function checkBalance(userId: string, requiredAmount: number): Promise<{
  hasEnough: boolean;
  currentBalance: number;
  unlimited: boolean;
}> {
  try {
    const { data, error } = await supabase.rpc('get_credit_balance', {
      p_user_id: userId,
    });

    if (error || !data || data.length === 0) {
      return { hasEnough: false, currentBalance: 0, unlimited: false };
    }

    const { balance, unlimited } = data[0];

    if (unlimited) {
      return { hasEnough: true, currentBalance: -1, unlimited: true };
    }

    return {
      hasEnough: balance >= requiredAmount,
      currentBalance: balance,
      unlimited: false,
    };
  } catch {
    return { hasEnough: false, currentBalance: 0, unlimited: false };
  }
}

/**
 * Extrae userId del token JWT de la cookie auth-token
 */
export function extractUserIdFromToken(authToken: string): string | null {
  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || (() => { throw new Error('FATAL: JWT_SECRET no está configurado en el entorno') })();
    const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}
