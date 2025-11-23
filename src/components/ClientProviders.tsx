'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/context/ToastContext';

import { usePersistentGameStore } from '@/hooks/usePersistentGameStore';

type ClientProvidersProps = { children: ReactNode };

export function ClientProviders({ children }: ClientProvidersProps) {
  usePersistentGameStore();
  return <ToastProvider>{children}</ToastProvider>;
}
