'use client';

import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

import { usePersistentGameStore } from '@/hooks/usePersistentGameStore';
import { usePublicGameDataActions } from '@/hooks/usePublicGameDataActions';
import { ToastProvider } from '@/context/ToastContext';

import { CacheDebugPanel } from './CacheDebugPanel';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { VersionChecker } from './VersionChecker';

type ClientProvidersProps = { children: ReactNode };

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domAnimation);

export function ClientProviders({ children }: ClientProvidersProps) {
  usePersistentGameStore();
  usePublicGameDataActions();
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ToastProvider>
        {children}
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <OfflineIndicator />
      </ToastProvider>
    </LazyMotion>
  );
}
