'use client';

import { useMemo, type ReactNode } from 'react';
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

type ClientProvidersProps = {
  children: ReactNode;
  initialPublicActions?: PublicActionRow[];
  initialWikiHistoryActions?: PublicActionRow[];
};

const loadMotionFeatures = () => import('motion/react').then((mod) => mod.domMax);

function mergeWikiHistoryActions(
  publicActions: PublicActionRow[] | undefined,
  historyActions: PublicActionRow[] | undefined
): PublicActionRow[] {
  const actionsById = new Map<string, PublicActionRow>();

  for (const action of publicActions ?? []) actionsById.set(action.id, action);
  for (const action of historyActions ?? []) actionsById.set(action.id, action);

  return Array.from(actionsById.values()).sort(
    (left, right) =>
      left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)
  );
}

export function ClientProviders({
  children,
  initialPublicActions,
  initialWikiHistoryActions,
}: ClientProvidersProps) {
  const wikiHistoryActions = useMemo(
    () => mergeWikiHistoryActions(initialPublicActions, initialWikiHistoryActions),
    [initialPublicActions, initialWikiHistoryActions]
  );

  usePublicGameDataActions(initialPublicActions ? { initialPublicActions } : undefined);
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <ToastProvider>
        <PermissionProvider>
          <WikiHistoryProvider publicActions={wikiHistoryActions}>{children}</WikiHistoryProvider>
        </PermissionProvider>
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <OfflineIndicator />
      </ToastProvider>
    </LazyMotion>
  );
}
