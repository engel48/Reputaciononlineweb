"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  downloadUrl: string;
}

interface BillingHistoryProps {
  invoices: Invoice[];
  currentPlan?: {
    name: string;
    nextBillingDate: string;
    amount: number;
  };
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ invoices, currentPlan }) => {
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<HTMLDivElement>(null);
  const invoiceRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const detailsRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  useEffect(() => {
    if (containerRef.current) {
      // Animación de entrada del componente
      gsap.from(containerRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out'
      });
    }

    // Animar lista de facturas
    if (invoicesRef.current && Object.values(invoiceRefs.current).length > 0) {
      gsap.from(Object.values(invoiceRefs.current), {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3
      });
    }
  }, [invoices]);

  // Manejar expansión de detalles de factura
  const toggleInvoiceDetails = (invoiceId: string) => {
    const isExpanding = expandedInvoice !== invoiceId;
    
    // Antes de cambiar el estado, animar el cierre del actual si existe
    if (expandedInvoice && detailsRefs.current[expandedInvoice]) {
      gsap.to(detailsRefs.current[expandedInvoice], {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
    
    setExpandedInvoice(isExpanding ? invoiceId : null);
    
    // Animar la expansión del nuevo elemento si corresponde
    if (isExpanding && detailsRefs.current[invoiceId]) {
      gsap.fromTo(detailsRefs.current[invoiceId],
        { height: 0, opacity: 0 },
        { 
          height: 'auto', 
          opacity: 1, 
          duration: 0.5, 
          ease: 'power2.out' 
        }
      );
      
      // Animar el icono de expansión
      const chevronElem = document.querySelector(`.chevron-${invoiceId}`);
      if (chevronElem) {
        gsap.to(chevronElem, {
          rotation: 180,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    } else if (!isExpanding) {
      // Restablecer rotación del icono al contraer
      const chevronElem = document.querySelector(`.chevron-${invoiceId}`);
      if (chevronElem) {
        gsap.to(chevronElem, {
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    }
  };

  // Color según el estado de la factura
  const getStatusColor = (status: 'paid' | 'pending' | 'overdue') => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="rounded-lg bg-white shadow-lg dark:bg-gray-800"
    >
      {/* Sección del plan actual */}
      {currentPlan && (
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Plan Actual
          </h3>
          
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-700/30">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {currentPlan.name}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Próxima facturación: {new Date(currentPlan.nextBillingDate).toLocaleDateString('es-ES', { 
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="mt-2 sm:mt-0">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${currentPlan.amount}
                </span>
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">/mes</span>
              </div>
              
              <div className="mt-4 w-full sm:mt-3 sm:w-auto">
                <button className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:w-auto">
                  Cambiar Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Historial de facturas */}
      <div className="p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
          Facturas y Pagos
        </h3>
        
        <div ref={invoicesRef} className="space-y-3">
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <React.Fragment key={invoice.id}>
                <div 
                  ref={el => invoiceRefs.current[invoice.id] = el}
                  className="cursor-pointer rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                  onClick={() => toggleInvoiceDetails(invoice.id)}
                >
                  <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                        <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(invoice.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`mr-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status === 'paid' && <CheckCircle className="mr-1 h-3 w-3" />}
                        {invoice.status === 'overdue' && <AlertCircle className="mr-1 h-3 w-3" />}
                        {invoice.status === 'paid' ? 'Pagado' : invoice.status === 'pending' ? 'Pendiente' : 'Vencido'}
                      </span>
                      
                      <span className="mr-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${invoice.amount.toFixed(2)}
                      </span>
                      
                      {expandedInvoice === invoice.id ? (
                        <ChevronUp className={`chevron-${invoice.id} h-5 w-5 text-gray-500 dark:text-gray-400`} />
                      ) : (
                        <ChevronDown className={`chevron-${invoice.id} h-5 w-5 text-gray-500 dark:text-gray-400`} />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Detalles de factura */}
                <div 
                  ref={el => detailsRefs.current[invoice.id] = el}
                  className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
                  style={{ height: 0, opacity: 0 }}
                >
                  <div className="bg-gray-50 p-4 dark:bg-gray-700/30">
                    <div className="flex flex-wrap justify-between">
                      <div className="mb-4 w-full md:mb-0 md:w-auto">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Detalles de Factura</h4>
                        <ul className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                          <li>Método de Pago: Tarjeta de crédito •••• 4242</li>
                          <li>Estado de Factura: {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Vencida'}</li>
                          <li>Fecha de Emisión: {new Date(invoice.date).toLocaleDateString('es-ES')}</li>
                          <li>Número de Factura: {invoice.invoiceNumber}</li>
                        </ul>
                      </div>
                      
                      <div className="flex items-center">
                        <button 
                          className="inline-flex items-center rounded-md bg-primary-100 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Animar botón de descarga
                            gsap.to(e.currentTarget, {
                              scale: 1.05,
                              duration: 0.2,
                              ease: 'power2.out',
                              yoyo: true,
                              repeat: 1
                            });
                          }}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Descargar PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay facturas disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingHistory;
