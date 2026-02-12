'use client';

import { actionHistorySchema } from '@/lib/validation/schemas';

import type { ActionHistoryEntry } from './diffUtils';

const DRAFT_STORAGE_PREFIX = 'editmode:draft:';

export interface DraftData {
  savedAt: number;
  actions: ActionHistoryEntry[];
}

/**
 * Returns the localStorage key used to persist draft for a specific entity.
 */
export function getDraftStorageKey(entityType: string, entityId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${entityType}:${entityId}`;
}

/**
 * Saves a draft for a specific entity to localStorage.
 */
export function saveDraft(
  entityType: string,
  entityId: string,
  actions: ActionHistoryEntry[]
): void {
  console.log('saveDraft');
  if (typeof window === 'undefined') return;
  if (actions.length === 0) return;

  const key = getDraftStorageKey(entityType, entityId);
  const draft: DraftData = {
    savedAt: Date.now(),
    actions,
  };

  try {
    window.localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // ignore storage failures
  }
}

/**
 * Loads a draft for a specific entity from localStorage.
 * Returns null if no draft exists or if the draft is invalid.
 */
export function loadDraft(entityType: string, entityId: string): DraftData | null {
  if (typeof window === 'undefined') return null;

  const key = getDraftStorageKey(entityType, entityId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const draft = parsed as { savedAt?: unknown; actions?: unknown };
    if (typeof draft.savedAt !== 'number') return null;

    const actionsResult = actionHistorySchema.safeParse(draft.actions);
    if (!actionsResult.success) return null;

    return {
      savedAt: draft.savedAt,
      actions: actionsResult.data as ActionHistoryEntry[],
    };
  } catch {
    return null;
  }
}

/**
 * Checks if a draft exists for a specific entity.
 */
export function hasDraft(entityType: string, entityId: string): boolean {
  if (typeof window === 'undefined') return false;

  const key = getDraftStorageKey(entityType, entityId);

  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * Clears the draft for a specific entity from localStorage.
 */
export function clearDraft(entityType: string, entityId: string): void {
  console.log('clearDraft');
  if (typeof window === 'undefined') return;

  const key = getDraftStorageKey(entityType, entityId);

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Gets all draft keys from localStorage.
 * Useful for cleanup or showing draft list to user.
 */
export function getAllDraftKeys(): string[] {
  if (typeof window === 'undefined') return [];

  const keys: string[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(DRAFT_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
  } catch {
    // ignore
  }

  return keys;
}

/**
 * Parses a draft key to extract entityType and entityId.
 */
export function parseDraftKey(key: string): { entityType: string; entityId: string } | null {
  if (!key.startsWith(DRAFT_STORAGE_PREFIX)) return null;

  const rest = key.slice(DRAFT_STORAGE_PREFIX.length);
  const colonIndex = rest.indexOf(':');
  if (colonIndex === -1) return null;

  return {
    entityType: rest.slice(0, colonIndex),
    entityId: rest.slice(colonIndex + 1),
  };
}

/**
 * Formats a draft's savedAt timestamp into a human-readable relative time.
 */
export function formatDraftAge(savedAt: number): string {
  const now = Date.now();
  const diff = now - savedAt;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return '刚刚';
}
