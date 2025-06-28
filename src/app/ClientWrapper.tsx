'use client';

import { UserProvider } from '@/context/UserContext';
import { CreditProvider } from '@/context/CreditosContext';
import { PlanProvider } from '@/context/PlanContext';

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PlanProvider>
        <CreditProvider>
          {children}
        </CreditProvider>
      </PlanProvider>
    </UserProvider>
  );
}
