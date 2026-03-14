'use client';

import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { usePersistentGameStore } from '@/hooks/usePersistentGameStore';
import { usePublicGameDataActions } from '@/hooks/usePublicGameDataActions';
import { PublicActionsProvider } from '@/context/PublicActionsContext';
import { ToastProvider } from '@/context/ToastContext';

import { CacheDebugPanel } from './CacheDebugPanel';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { VersionChecker } from './VersionChecker';

type ClientProvidersProps = { children: ReactNode; initialPublicActions?: PublicActionRow[] };

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domMax);

export function ClientProviders({ children, initialPublicActions }: ClientProvidersProps) {
  usePersistentGameStore();
  usePublicGameDataActions(initialPublicActions ? { initialPublicActions } : undefined);
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ToastProvider>
        <PublicActionsProvider initialActions={initialPublicActions}>
          {children}
        </PublicActionsProvider>
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <OfflineIndicator />
      </ToastProvider>
    </LazyMotion>
  );
}
