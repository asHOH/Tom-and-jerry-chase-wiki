'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from '@/context/ToastContext';

import { usePersistentGameStore } from '@/hooks/usePersistentGameStore';

import { CacheDebugPanel } from './CacheDebugPanel';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { VersionChecker } from './VersionChecker';

type ClientProvidersProps = { children: ReactNode };

export function ClientProviders({ children }: ClientProvidersProps) {
  usePersistentGameStore();
  return (
    <ToastProvider>
      {children}
      <ServiceWorkerRegistration />
      <CacheDebugPanel />
      <VersionChecker />
      <OfflineIndicator />
    </ToastProvider>
  );
}
