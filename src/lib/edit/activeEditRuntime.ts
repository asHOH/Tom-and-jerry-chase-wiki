'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { snapshot, subscribe as subscribeValtio } from 'valtio/vanilla';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { EditSession, EditSessionRuntime } from '@/lib/edit/editSession';

/** @deprecated Phase 5 removes the remaining raw runtime test helpers. */
export type ActiveEditRuntime = EditSessionRuntime;

let activeRuntime: EditSessionRuntime | null = null;
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

export function installActiveEditSession(session: EditSessionRuntime): void {
  installActiveEditRuntime(session);
}

export function clearActiveEditSession(session?: EditSession): void {
  clearActiveEditRuntime(session as EditSessionRuntime | undefined);
}

export function getActiveEditSession(): EditSession | null {
  return getActiveEditRuntime();
}

export function useActiveEditSession(): EditSession | null {
  return useSyncExternalStore(subscribe, getActiveEditSession, () => null);
}

export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: DeepReadonly<T>
): DeepReadonly<T>;
export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: null
): DeepReadonly<T> | null;
export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: undefined
): DeepReadonly<T> | undefined;
export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: DeepReadonly<T> | null
): DeepReadonly<T> | null;
export function useOptionalEditSnapshot<T extends object>(
  store: T | null | undefined,
  fallback: DeepReadonly<T> | null | undefined
): DeepReadonly<T> | null | undefined {
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
