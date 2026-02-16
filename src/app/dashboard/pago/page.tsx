"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { usePlan } from '@/context/PlanContext';
import { ArrowLeft, Check, CreditCard, Shield, Clock, Award, Smartphone, Building2, Banknote } from 'lucide-react';

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  popular?: boolean;
}

const PLAN_INFO: Record<string, PlanInfo> = {
  free: {
    id: 'free',
    name: 'Plan Gratuito',
    price: 0,
    monthlyPrice: '$0',
    yearlyPrice: '$0',
    features: ['100 créditos mensuales', 'Análisis básico', 'Soporte por email']
  },
  basic: {
    id: 'basic',
    name: 'Plan Básico',
    price: 29,
    monthlyPrice: '$29',
    yearlyPrice: '$290',
    features: ['500 créditos mensuales', 'Monitoreo en tiempo real', 'Análisis de sentimientos', 'Soporte prioritario']
  },
  pro: {
    id: 'pro',
    name: 'Plan Pro',
    price: 99,
    monthlyPrice: '$99',
    yearlyPrice: '$990',
    features: ['5,000 créditos mensuales', 'Análisis avanzado', 'API acceso', 'Reportes personalizados', 'Análisis político', 'Soporte 24/7'],
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Plan Enterprise',
    price: 299,
    monthlyPrice: '$299',
    yearlyPrice: '$2,990',
    features: ['Créditos ilimitados', 'Todas las funciones', 'Soporte dedicado', 'White label', 'Integraciones personalizadas']
  }
};

export default function PagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useUser();
  const { currentPlan } = usePlan();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semester' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'pse' | 'bancolombia' | 'nequi'>('card');
  const [pseBank, setPseBank] = useState('');
  const [paymentType, setPaymentType] = useState<'plan' | 'pack'>('plan');
  const [selectedPack, setSelectedPack] = useState<string>('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  // Paquetes de creditos
  const CREDIT_PACKS = [
    { id: 'pack-500', name: '500 Creditos', credits: 500, price: 49900 },
    { id: 'pack-1000', name: '1,000 Creditos', credits: 1000, price: 89900, popular: true },
    { id: 'pack-2500', name: '2,500 Creditos', credits: 2500, price: 199900 },
    { id: 'pack-5000', name: '5,000 Creditos', credits: 5000, price: 349900 },
  ];

  // Descuentos por periodo
  const DISCOUNTS: Record<string, { discount: number; label: string; months: number }> = {
    monthly: { discount: 0, label: 'Mensual', months: 1 },
    quarterly: { discount: 0.10, label: 'Trimestral (-10%)', months: 3 },
    semester: { discount: 0.15, label: 'Semestral (-15%)', months: 6 },
    yearly: { discount: 0.20, label: 'Anual (-20%)', months: 12 },
  };

  useEffect(() => {
    const plan = searchParams.get('plan');
    const type = searchParams.get('type');
    const packId = searchParams.get('packId');

    if (type === 'pack' && packId) {
      setPaymentType('pack');
      setSelectedPack(packId);
    } else if (plan && PLAN_INFO[plan]) {
      setPaymentType('plan');
      setSelectedPlan(plan);
    } else {
      router.push('/dashboard/perfil?tab=plan');
    }
  }, [searchParams, router]);

  const planInfo = selectedPlan ? PLAN_INFO[selectedPlan] : null;
  const packInfo = CREDIT_PACKS.find(p => p.id === selectedPack);

  if (paymentType === 'plan' && !planInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Plan no valido</h2>
          <button
            onClick={() => router.push('/dashboard/perfil?tab=plan')}
            className="mt-4 px-4 py-2 bg-[#01257D] text-white rounded-lg hover:bg-[#013AAA]"
          >
            Volver a Planes
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setProcessing(true);

    try {
      const finalAmount = paymentType === 'pack'
        ? (packInfo?.price || 0)
        : getFinalPrice();

      // Crear sesion de pago con el backend
      const response = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: paymentType,
          planId: selectedPlan,
          billingCycle,
          packId: selectedPack,
          paymentMethod,
          amount: finalAmount,
          currency: 'COP',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || 'Error creando sesion de pago');
        return;
      }

      // Si hay URL de checkout de Wompi, redirigir
      if (result.data.wompiCheckoutUrl && paymentMethod !== 'card') {
        window.location.href = result.data.wompiCheckoutUrl;
        return;
      }

      // Para tarjeta con widget de Wompi, o si no hay Wompi configurado (fallback a simulacion)
      if (!result.data.publicKey) {
        // Fallback: simulacion local (para desarrollo sin Wompi)
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (paymentType === 'plan') {
          await updateUser({ plan: selectedPlan as 'free' | 'basic' | 'pro' | 'enterprise' });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('planChanged', {
              detail: { newPlan: selectedPlan, timestamp: Date.now() }
            }));
          }
        }

        router.push(`/dashboard/perfil?tab=plan&success=true&plan=${selectedPlan}`);
        return;
      }

      // Con Wompi configurado: redirigir al checkout
      window.location.href = result.data.wompiCheckoutUrl;

    } catch (error) {
      alert('Error procesando el pago. Intenta nuevamente.');
    } finally {
      setProcessing(false);
    }
  };

  const getDiscount = () => DISCOUNTS[billingCycle]?.discount || 0;
  const getSavings = () => {
    if (!planInfo) return 0;
    const full = planInfo.price * DISCOUNTS[billingCycle].months;
    return Math.round(full * getDiscount());
  };
  const getFinalPrice = () => {
    if (!planInfo) return 0;
    const basePrice = planInfo.price;
    const months = DISCOUNTS[billingCycle].months;
    return Math.round(basePrice * months * (1 - getDiscount()));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[#01257D] hover:text-[#013AAA] mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Checkout - {paymentType === 'pack' ? (packInfo?.name || 'Paquete') : (planInfo?.name || '')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Completa tu compra para acceder a todas las funciones premium
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Resumen del Plan
            </h2>
            
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {planInfo?.name}
                  {planInfo?.popular && (
                    <span className="ml-2 px-2 py-1 bg-[#01257D] text-white text-xs rounded-full">
                      Más Popular
                    </span>
                  )}
                </h3>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#01257D]">
                    {billingCycle === 'yearly' ? planInfo?.yearlyPrice : planInfo?.monthlyPrice}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    /{billingCycle === 'yearly' ? 'año' : 'mes'}
                  </p>
                </div>
              </div>
              
              {getDiscount() > 0 && planInfo && planInfo.price > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                  <p className="text-green-800 dark:text-green-300 text-sm font-medium">
                    Ahorras ${getSavings().toLocaleString('es-CO')} COP con pago {DISCOUNTS[billingCycle].label.toLowerCase().split(' (')[0]}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                {planInfo?.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            {planInfo && planInfo.price > 0 && paymentType === 'plan' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ciclo de Facturacion
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(DISCOUNTS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setBillingCycle(key as typeof billingCycle)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        billingCycle === key
                          ? 'border-[#01257D] bg-[#01257D]/10 text-[#01257D]'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm">{config.label.split(' (')[0]}</p>
                      <p className="text-xs mt-0.5">
                        ${((planInfo?.price || 0) * config.months * (1 - config.discount)).toLocaleString('es-CO')} COP
                      </p>
                      {config.discount > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">-{config.discount * 100}%</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Información de Pago
            </h2>

            {(planInfo?.price ?? 0) === 0 ? (
              <div className="text-center py-8">
                <Award className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¡Plan Gratuito!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  No se requiere información de pago para este plan
                </p>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="w-full bg-[#01257D] text-white py-3 px-4 rounded-lg hover:bg-[#013AAA] disabled:opacity-50 font-medium"
                >
                  {processing ? 'Activando...' : 'Activar Plan Gratuito'}
                </button>
              </div>
            ) : (
              <>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'card'
                          ? 'border-[#01257D] bg-[#01257D]/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Tarjeta</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('pse')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'pse'
                          ? 'border-[#01257D] bg-[#01257D]/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Building2 className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">PSE</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bancolombia')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'bancolombia'
                          ? 'border-[#01257D] bg-[#01257D]/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Banknote className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Bancolombia</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('nequi')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'nequi'
                          ? 'border-[#01257D] bg-[#01257D]/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <Smartphone className="h-6 w-6 mx-auto mb-2" />
                      <p className="text-sm font-medium">Nequi</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        paymentMethod === 'paypal'
                          ? 'border-[#01257D] bg-[#01257D]/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      <div className="h-6 w-6 mx-auto mb-2 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <p className="text-sm font-medium">PayPal</p>
                    </button>
                  </div>
                </div>

                {/* Card Form */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número de Tarjeta
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.number}
                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          MM/AA
                        </label>
                        <input
                          type="text"
                          placeholder="12/25"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardData.cvc}
                          onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre en la Tarjeta
                      </label>
                      <input
                        type="text"
                        placeholder="Juan Pérez"
                        value={cardData.name}
                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Shield className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Tarjetas Aceptadas</span>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        Visa, Mastercard, American Express, Diners Club
                      </p>
                    </div>
                  </div>
                )}

                {/* PSE Form */}
                {paymentMethod === 'pse' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Selecciona tu Banco
                      </label>
                      <select
                        value={pseBank}
                        onChange={(e) => setPseBank(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Selecciona un banco</option>
                        <option value="bancolombia">Bancolombia</option>
                        <option value="banco_bogota">Banco de Bogotá</option>
                        <option value="banco_popular">Banco Popular</option>
                        <option value="bbva">BBVA Colombia</option>
                        <option value="davivienda">Davivienda</option>
                        <option value="banco_occidente">Banco de Occidente</option>
                        <option value="banco_av_villas">Banco AV Villas</option>
                        <option value="colpatria">Scotiabank Colpatria</option>
                        <option value="banco_caja_social">Banco Caja Social</option>
                        <option value="banco_agrario">Banco Agrario</option>
                      </select>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Building2 className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">PSE - Pagos Seguros en Línea</span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        Serás redirigido al portal de tu banco para completar el pago de forma segura.
                      </p>
                    </div>
                  </div>
                )}

                {/* Bancolombia Button Form */}
                {paymentMethod === 'bancolombia' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                      <Banknote className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                        Bancolombia Botón de Pagos
                      </h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        Serás redirigido al portal seguro de Bancolombia para completar tu pago.
                      </p>
                    </div>
                  </div>
                )}

                {/* Nequi Form */}
                {paymentMethod === 'nequi' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Número de Celular Nequi
                      </label>
                      <input
                        type="tel"
                        placeholder="3001234567"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#01257D] focus:border-[#01257D] dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Smartphone className="h-4 w-4 text-purple-600 mr-2" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Pago con Nequi</span>
                      </div>
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        Recibirás una notificación en tu app Nequi para autorizar el pago.
                      </p>
                    </div>
                  </div>
                )}

                {/* PayPal Form */}
                {paymentMethod === 'paypal' && (
                  <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
                      <div className="h-12 w-12 bg-blue-600 rounded mx-auto mb-3 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">PayPal</span>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        Pagar con PayPal
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Serás redirigido a PayPal para completar tu pago de forma segura.
                      </p>
                    </div>
                  </div>
                )}

                {/* Total and Payment Button */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                    <span className="text-2xl font-bold text-[#01257D]">
                      ${getFinalPrice()}
                      {billingCycle === 'yearly' && getDiscount() > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-through ml-2">
                          ${(planInfo?.price || 0) * 12}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="w-full bg-[#01257D] text-white py-3 px-4 rounded-lg hover:bg-[#013AAA] disabled:opacity-50 font-medium flex items-center justify-center"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Procesando Pago...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Confirmar Pago
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center justify-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <Shield className="h-4 w-4 mr-1" />
                    Pago seguro con encriptación SSL
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}