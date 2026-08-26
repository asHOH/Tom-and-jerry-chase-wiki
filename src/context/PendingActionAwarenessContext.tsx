'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import useSWR from 'swr';

import type { Action } from '@/lib/edit/diffUtils';
import {
  toActionDependencyDescriptor,
  type ActionDependencyDescriptor,
} from '@/lib/gameData/actionDependencies';
import {
  findPendingTargetsForDescriptors,
  summarizePendingActionTargets,
} from '@/lib/gameData/pendingActionAwareness';
import type {
  PendingActionOverlapSummary,
  PendingActionTarget,
  PendingActionTargetsResponse,
} from '@/lib/gameData/pendingActionAwarenessTypes';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

export type PendingActionAwarenessSource = {
  targets: readonly PendingActionTarget[];
  truncated: boolean;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => Promise<void>;
  summarizeActions: (actions: readonly Readonly<Action>[]) => PendingActionOverlapSummary | null;
};

const EMPTY_SOURCE: PendingActionAwarenessSource = {
  targets: [],
  truncated: false,
  isLoading: false,
  error: undefined,
  refresh: async () => undefined,
  summarizeActions: () => null,
};

const PendingActionAwarenessContext = createContext<PendingActionAwarenessSource>(EMPTY_SOURCE);

function isPendingActionTarget(value: unknown): value is PendingActionTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as Partial<PendingActionTarget>;
  return (
    (target.op === 'set' || target.op === 'add' || target.op === 'delete') &&
    typeof target.path === 'string' &&
    typeof target.hasNewValue === 'boolean' &&
    (target.ownership === 'self' || target.ownership === 'other') &&
    typeof target.isPublic === 'boolean' &&
    Number.isSafeInteger(target.count) &&
    (target.count ?? 0) > 0
  );
}

async function fetchPendingTargets(url: string): Promise<PendingActionTargetsResponse> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`加载待审核改动失败 (${response.status})`);
  const body: unknown = await response.json();
  if (!body || typeof body !== 'object') throw new Error('待审核改动响应格式无效');
  const candidate = body as Partial<PendingActionTargetsResponse>;
  if (!Array.isArray(candidate.targets) || typeof candidate.truncated !== 'boolean') {
    throw new Error('待审核改动响应格式无效');
  }
  return {
    targets: candidate.targets.filter(isPendingActionTarget),
    truncated: candidate.truncated,
  };
}

export function usePendingActionAwarenessSource(options: {
  enabled: boolean;
  entityType: PublishableEntityType;
  entityKey?: string;
}): PendingActionAwarenessSource {
  const query = useMemo(() => {
    const params = new URLSearchParams({ entityType: options.entityType });
    if (options.entityKey?.trim()) params.set('entityKey', options.entityKey.trim());
    return `/api/game-data-actions/pending-targets?${params.toString()}`;
  }, [options.entityKey, options.entityType]);
  const { data, error, isLoading, mutate } = useSWR<PendingActionTargetsResponse, Error>(
    options.enabled ? query : null,
    fetchPendingTargets,
    {
      refreshInterval: options.enabled ? 60_000 : 0,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const targets = data?.targets ?? EMPTY_SOURCE.targets;
  const truncated = data?.truncated ?? false;
  const refresh = useCallback(async () => {
    try {
      await mutate();
    } catch {
      // Awareness is advisory; a refresh failure must not turn a successful publish into a failure.
    }
  }, [mutate]);
  const summarizeActions = useCallback(
    (actions: readonly Readonly<Action>[]) => {
      const descriptors = actions.map(toActionDependencyDescriptor);
      const matches = findPendingTargetsForDescriptors(targets, descriptors);
      return matches.length > 0 ? summarizePendingActionTargets(matches, truncated) : null;
    },
    [targets, truncated]
  );

  return useMemo(
    () => ({
      targets,
      truncated,
      isLoading,
      error,
      refresh,
      summarizeActions,
    }),
    [error, isLoading, refresh, summarizeActions, targets, truncated]
  );
}

export function PendingActionAwarenessProvider({
  source,
  children,
}: {
  source: PendingActionAwarenessSource;
  children: ReactNode;
}) {
  return <PendingActionAwarenessContext value={source}>{children}</PendingActionAwarenessContext>;
}

export function usePendingActionAwareness(): PendingActionAwarenessSource {
  return useContext(PendingActionAwarenessContext);
}

export function usePendingFieldAwareness(
  descriptors: readonly ActionDependencyDescriptor[]
): PendingActionOverlapSummary | null {
  const awareness = usePendingActionAwareness();
  const matches = findPendingTargetsForDescriptors(awareness.targets, descriptors);
  return matches.length > 0 ? summarizePendingActionTargets(matches, awareness.truncated) : null;
}
