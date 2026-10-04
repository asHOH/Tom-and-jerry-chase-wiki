'use client';

import type { ReactNode } from 'react';
import { LazyMotion } from 'motion/react';

import { PermissionProvider } from '@/lib/auth/PermissionProvider';
import { ToastProvider } from '@/context/ToastContext';

import { CacheDebugPanel } from './CacheDebugPanel';
import { OfflineIndicator } from './OfflineIndicator';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';
import { VersionChecker } from './VersionChecker';

type ClientProvidersProps = { children: ReactNode };

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domMax);

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ToastProvider>
        <PermissionProvider>{children}</PermissionProvider>
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <OfflineIndicator />
      </ToastProvider>
    </LazyMotion>
  );
}
