'use client';

import { Toaster } from 'sonner';
import { UserProvider } from '@/context/UserContext';
import { CreditProvider } from '@/context/CreditosContext';
import { PlanProvider } from '@/context/PlanContext';
import { PoliticalProvider } from '@/context/PoliticalContext';

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PlanProvider>
        <CreditProvider>
          <PoliticalProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </PoliticalProvider>
        </CreditProvider>
      </PlanProvider>
    </UserProvider>
  );
}
