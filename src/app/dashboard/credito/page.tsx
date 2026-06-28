"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Ruta antigua con datos demo. Redirige a la página real de créditos.
export default function CreditoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/creditos');
  }, [router]);

  return null;
}
