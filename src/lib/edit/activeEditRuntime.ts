'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { snapshot, subscribe as subscribeValtio } from 'valtio/vanilla';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { EditModeRegistry } from '@/lib/edit/editModeRegistry';
import type { EditStores } from '@/lib/edit/editStores';
import type { PublishedRevision } from '@/lib/gameData/published/revision';

export type ActiveEditRuntime = Readonly<{
  stores: EditStores;
  registry: EditModeRegistry;
  revision: PublishedRevision;
}>;

let activeRuntime: ActiveEditRuntime | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function installActiveEditRuntime(runtime: ActiveEditRuntime): void {
  activeRuntime = runtime;
  emitChange();
}

export function clearActiveEditRuntime(runtime?: ActiveEditRuntime): void {
  if (runtime && activeRuntime !== runtime) return;
  activeRuntime = null;
  emitChange();
}

export function getActiveEditRuntime(): ActiveEditRuntime | null {
  return activeRuntime;
}

export function requireActiveEditRuntime(): ActiveEditRuntime {
  if (!activeRuntime) {
    throw new Error('The edit runtime is not ready.');
  }
  return activeRuntime;
}

export function useActiveEditRuntime(): ActiveEditRuntime | null {
  return useSyncExternalStore(subscribe, getActiveEditRuntime, () => null);
}

export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: DeepReadonly<T>
): DeepReadonly<T> {
  const subscribeToStore = useCallback(
    (listener: () => void) => (store ? subscribeValtio(store, listener) : () => undefined),
    [store]
  );
  const getSnapshot = useCallback(
    () => (store ? (snapshot(store) as DeepReadonly<T>) : fallback),
    [fallback, store]
  );

  return useSyncExternalStore(subscribeToStore, getSnapshot, () => fallback);
}
