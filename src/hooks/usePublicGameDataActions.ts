'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { actionHistoryEntrySchema } from '@/lib/validation/schemas';
import { env } from '@/env';

import {
  buffsEdit,
  cardsEdit,
  characters,
  entitiesEdit,
  fixturesEdit,
  itemsEdit,
  mapsEdit,
  modesEdit,
  specialSkillsEdit,
} from '../data';
import { GameDataManager } from '../lib/dataManager';
import {
  applyActionEntry,
  getActionsStorageKey,
  withRecordingSuppressed,
  type ActionHistoryEntry,
} from '../lib/edit/diffUtils';

function getTarget(entityType: string): Record<string, unknown> | null {
  switch (entityType) {
    case 'characters':
      return characters as unknown as Record<string, unknown>;
    case 'cards':
      return cardsEdit as unknown as Record<string, unknown>;
    case 'entities':
      return entitiesEdit as unknown as Record<string, unknown>;
    case 'buffs':
      return buffsEdit as unknown as Record<string, unknown>;
    case 'items':
      return itemsEdit as unknown as Record<string, unknown>;
    case 'fixtures':
      return fixturesEdit as unknown as Record<string, unknown>;
    case 'maps':
      return mapsEdit as unknown as Record<string, unknown>;
    case 'modes':
      return modesEdit as unknown as Record<string, unknown>;
    case 'specialSkills':
      return specialSkillsEdit as unknown as Record<string, unknown>;
    default:
      return null;
  }
}

const EDIT_MODE_KEY = 'isEditMode';
const EDIT_MODE_ENABLED_AT_KEY = 'editmode:enabledAt';

function readEditModeState(): { isEditMode: boolean; enabledAtMs: number | null } {
  if (typeof window === 'undefined') return { isEditMode: false, enabledAtMs: null };

  let isEditMode = false;
  try {
    const raw = window.localStorage.getItem(EDIT_MODE_KEY);
    isEditMode = raw ? (JSON.parse(raw) as unknown) === true : false;
  } catch {
    isEditMode = false;
  }

  if (!isEditMode) return { isEditMode: false, enabledAtMs: null };

  let enabledAtMs: number | null = null;
  try {
    const raw = window.localStorage.getItem(EDIT_MODE_ENABLED_AT_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      enabledAtMs = parsed;
    } else {
      const now = Date.now();
      window.localStorage.setItem(EDIT_MODE_ENABLED_AT_KEY, String(now));
      enabledAtMs = now;
    }
  } catch {
    enabledAtMs = null;
  }

  return { isEditMode: true, enabledAtMs };
}
/**
 * Parses and normalizes entry to an array of ActionHistoryEntry items.
 * Supports both single entry and array of entries.
 */
function parseEntries(rawEntry: unknown): ActionHistoryEntry[] {
  // Check if it's an array of entries (batch submission)
  if (Array.isArray(rawEntry)) {
    // First try to parse as array of ActionHistoryEntry items
    const entries: ActionHistoryEntry[] = [];
    let allValid = true;

    for (const item of rawEntry) {
      const parsed = actionHistoryEntrySchema.safeParse(item);
      if (parsed.success) {
        entries.push(parsed.data as ActionHistoryEntry);
      } else {
        allValid = false;
        break;
      }
    }

    if (allValid && entries.length > 0) {
      return entries;
    }

    // Fall back to treating the whole array as a single ActionHistoryEntry (array of actions)
    const singleParsed = actionHistoryEntrySchema.safeParse(rawEntry);
    if (singleParsed.success) {
      return [singleParsed.data as ActionHistoryEntry];
    }

    return [];
  }

  // Single entry
  const parsed = actionHistoryEntrySchema.safeParse(rawEntry);
  if (parsed.success) {
    return [parsed.data as ActionHistoryEntry];
  }

  return [];
}

export function usePublicGameDataActions(options?: { initialPublicActions?: PublicActionRow[] }) {
  'use no memo';
  const [appliedCount, setAppliedCount] = useState(0);
  const appliedIdsRef = useRef<Set<string>>(new Set());

  const [{ isEditMode, enabledAtMs }, setEditModeState] = useState(() => readEditModeState());

  const enabled = env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const actions = enabled ? options?.initialPublicActions : undefined;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => setEditModeState(readEditModeState());
    sync();

    const onStorage = (e: StorageEvent) => {
      if (e.key === EDIT_MODE_KEY || e.key === EDIT_MODE_ENABLED_AT_KEY) {
        sync();
      }
    };

    const onCustom = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as unknown;
        if (detail && typeof (detail as { isEditMode?: unknown }).isEditMode === 'boolean') {
          sync();
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('editmode:changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('editmode:changed', onCustom);
    };
  }, []);

  useLayoutEffect(() => {
    if (!actions?.length) return;

    // In edit mode, freeze public actions at the moment edit mode was enabled.
    // This avoids remote updates overwriting local in-progress edits.
    const cutoffMs = isEditMode && enabledAtMs ? enabledAtMs : Number.POSITIVE_INFINITY;

    let totalAppliedInThisPass = 0;

    for (const row of actions) {
      if (!row?.id || appliedIdsRef.current.has(row.id)) continue;

      const createdAtMs = Date.parse(row.created_at);
      if (Number.isFinite(createdAtMs) && createdAtMs > cutoffMs) {
        continue;
      }

      const target = getTarget(row.entity_type);
      if (!target) continue;

      const entries = parseEntries(row.entry);
      if (entries.length === 0) continue;

      try {
        const storageKey = getActionsStorageKey(row.entity_type);
        withRecordingSuppressed(storageKey, () => {
          for (const entry of entries) {
            applyActionEntry(target, entry);
          }
        });
        appliedIdsRef.current.add(row.id);
        totalAppliedInThisPass += 1;
      } catch (err) {
        console.error('Failed to apply public action:', row, err);
      }
    }

    if (totalAppliedInThisPass > 0) {
      setAppliedCount((prev) => prev + totalAppliedInThisPass);
      GameDataManager.invalidate();
    }
  }, [actions, enabledAtMs, isEditMode]);

  return { appliedCount };
}
