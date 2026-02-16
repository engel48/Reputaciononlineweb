import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientWrapper from './ClientWrapper';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { SWRProvider } from '@/lib/swr-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Reputacion Online',
  description: 'Plataforma de monitoreo de redes sociales y gestion de reputacion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <SWRProvider>
          <SupabaseProvider>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </SupabaseProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
