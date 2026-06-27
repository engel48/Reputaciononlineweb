import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientWrapper from './ClientWrapper';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { SWRProvider } from '@/lib/swr-config';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://reputaciononline.com.co'),
  title: {
    default: 'Reputación Online — Monitoreo y reputación digital con IA',
    template: '%s · Reputación Online',
  },
  description:
    'Monitoreá menciones, sentimiento y crisis de tu marca o figura pública en redes sociales y medios, con la asistente de IA Julia.',
  applicationName: 'Reputación Online',
  openGraph: {
    title: 'Reputación Online',
    description: 'Monitoreo de reputación digital con IA.',
    url: 'https://reputaciononline.com.co',
    siteName: 'Reputación Online',
    locale: 'es_CO',
    type: 'website',
  },
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
