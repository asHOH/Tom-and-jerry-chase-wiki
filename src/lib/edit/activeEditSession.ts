'use client';

import { useSyncExternalStore } from 'react';

import type { EditSession } from '@/lib/edit/editSession';

let activeSession: EditSession | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

export function installActiveEditSession(session: EditSession): void {
  activeSession = session;
  emitChange();
}

export function clearActiveEditSession(session?: EditSession): void {
  if (session && activeSession !== session) return;
  activeSession = null;
  emitChange();
}

export function getActiveEditSession(): EditSession | null {
  return activeSession;
}

export function requireActiveEditSession(): EditSession {
  if (!activeSession) throw new Error('The edit session is not ready.');
  return activeSession;
}

export function useActiveEditSession(): EditSession | null {
  return useSyncExternalStore(subscribe, getActiveEditSession, () => null);
}
