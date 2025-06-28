import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, BarChart, Settings, FileText, ShoppingCart } from 'lucide-react';

export default function CreditosNavigation() {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Resumen',
      href: '/dashboard/creditos',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      name: 'Análisis',
      href: '/dashboard/creditos/analisis',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      name: 'Reportes',
      href: '/dashboard/creditos/reportes',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Comprar',
      href: '/dashboard/creditos/comprar',
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      name: 'Configuración',
      href: '/dashboard/creditos/configuracion',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  // Verificar si la ruta actual coincide con el ítem del menú
  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="mb-6 overflow-x-auto">
      <nav className="flex space-x-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-[100px] items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'}`}
          >
            {item.icon}
            <span className="ml-2">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
