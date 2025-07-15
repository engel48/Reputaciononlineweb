'use client';

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
          </PoliticalProvider>
        </CreditProvider>
      </PlanProvider>
    </UserProvider>
  );
}
