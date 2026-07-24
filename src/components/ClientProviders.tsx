'use client';

import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

import { PermissionProvider } from '@/lib/auth/PermissionProvider';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { usePublicGameDataActions } from '@/hooks/usePublicGameDataActions';
import { ToastProvider } from '@/context/ToastContext';
import { WikiHistoryProvider } from '@/context/WikiHistoryContext';

import { CacheDebugPanel } from './CacheDebugPanel';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { VersionChecker } from './VersionChecker';

type ClientProvidersProps = { children: ReactNode; initialPublicActions?: PublicActionRow[] };

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domMax);

export function ClientProviders({ children, initialPublicActions }: ClientProvidersProps) {
  usePublicGameDataActions(initialPublicActions ? { initialPublicActions } : undefined);
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ToastProvider>
        <PermissionProvider>
          <WikiHistoryProvider publicActions={initialPublicActions}>{children}</WikiHistoryProvider>
        </PermissionProvider>
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <OfflineIndicator />
      </ToastProvider>
    </LazyMotion>
  );
}
