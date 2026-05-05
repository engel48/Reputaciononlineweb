/**
 * Tests para src/lib/credit-costs.ts
 *
 * Verifica calculo de costos por accion, busquedas (basica vs extendida),
 * etiquetas y agrupacion por categoria.
 */

import { describe, it, expect } from 'vitest';
import {
  CREDIT_COSTS,
  getSearchCost,
  estimateCost,
  getActionLabel,
  getCostsByCategory,
} from '@/lib/credit-costs';

describe('credit-costs', () => {
  describe('CREDIT_COSTS catalog', () => {
    it('todos los costos son enteros positivos', () => {
      for (const [, cost] of Object.entries(CREDIT_COSTS)) {
        expect(Number.isInteger(cost)).toBe(true);
        expect(cost).toBeGreaterThan(0);
      }
    });

    it('reportes son los mas caros (>= 10 creditos)', () => {
      expect(CREDIT_COSTS.report_basic).toBeGreaterThanOrEqual(10);
      expect(CREDIT_COSTS.report_advanced).toBeGreaterThanOrEqual(10);
    });

    it('chat de Julia es el mas barato (1 credito)', () => {
      expect(CREDIT_COSTS.julia_chat).toBe(1);
    });
  });

  describe('getSearchCost', () => {
    it('busqueda dentro de 30 dias usa costo basico', () => {
      expect(getSearchCost(15, 10)).toBe(CREDIT_COSTS.search_basic * 10);
    });

    it('busqueda en exactamente 30 dias usa costo basico', () => {
      expect(getSearchCost(30, 5)).toBe(CREDIT_COSTS.search_basic * 5);
    });

    it('busqueda mayor a 30 dias usa costo extendido', () => {
      expect(getSearchCost(31, 4)).toBe(CREDIT_COSTS.search_extended * 4);
    });

    it('cero resultados cuesta 0 creditos', () => {
      expect(getSearchCost(60, 0)).toBe(0);
    });
  });

  describe('estimateCost', () => {
    it('estima costo simple para una accion (cantidad default 1)', () => {
      expect(estimateCost('julia_chat')).toBe(1);
      expect(estimateCost('report_basic')).toBe(20);
    });

    it('multiplica por cantidad cuando se especifica', () => {
      expect(estimateCost('monitoring_hourly', 5)).toBe(CREDIT_COSTS.monitoring_hourly * 5);
    });

    it('cantidad 0 retorna 0', () => {
      expect(estimateCost('julia_reputation', 0)).toBe(0);
    });
  });

  describe('getActionLabel', () => {
    it('retorna etiqueta legible para cada accion del catalogo', () => {
      for (const action of Object.keys(CREDIT_COSTS) as (keyof typeof CREDIT_COSTS)[]) {
        const label = getActionLabel(action);
        expect(label).toBeTruthy();
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(2);
      }
    });

    it('etiqueta de search distingue rangos de fechas', () => {
      expect(getActionLabel('search_basic')).toContain('30 dias');
      expect(getActionLabel('search_extended')).toContain('30 dias');
    });
  });

  describe('getCostsByCategory', () => {
    it('agrupa los costos en al menos 4 categorias', () => {
      const categories = getCostsByCategory();
      expect(categories.length).toBeGreaterThanOrEqual(4);
    });

    it('cada categoria tiene nombre y al menos 1 item', () => {
      const categories = getCostsByCategory();
      for (const cat of categories) {
        expect(cat.category).toBeTruthy();
        expect(cat.items.length).toBeGreaterThan(0);
      }
    });

    it('cada item tiene action, label y cost', () => {
      const categories = getCostsByCategory();
      for (const cat of categories) {
        for (const item of cat.items) {
          expect(item.action).toBeTruthy();
          expect(item.label).toBeTruthy();
          expect(item.cost).toBeGreaterThan(0);
          expect(item.cost).toBe(CREDIT_COSTS[item.action]);
        }
      }
    });

    it('incluye categoria Julia IA con todas las acciones de Julia', () => {
      const categories = getCostsByCategory();
      const julia = categories.find(c => c.category === 'Julia IA');
      expect(julia).toBeDefined();
      const actions = julia!.items.map(i => i.action);
      expect(actions).toContain('julia_chat');
      expect(actions).toContain('julia_reputation');
      expect(actions).toContain('julia_sentiment');
    });
  });
});
