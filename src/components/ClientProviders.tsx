'use client';

import type { ReactNode } from 'react';

import { usePersistentGameStore } from '@/hooks/usePersistentGameStore';

type ClientProvidersProps = { children: ReactNode };

export function ClientProviders({ children }: ClientProvidersProps) {
  usePersistentGameStore();
  return <>{children}</>;
}
