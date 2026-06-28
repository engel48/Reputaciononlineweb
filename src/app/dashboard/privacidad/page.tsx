"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// La privacidad se unificó dentro de Configuración. Redirige para evitar duplicados.
export default function PrivacidadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/configuracion');
  }, [router]);

  return null;
}
