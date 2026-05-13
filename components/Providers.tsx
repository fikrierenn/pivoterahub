'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

/**
 * Root provider wrapper. next-auth/react'tan `useSession`, `signIn`, `signOut`
 * çağrılarının çalışması için <SessionProvider> zinciri gerekli.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
