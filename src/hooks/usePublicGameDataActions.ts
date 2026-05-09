'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  applyPublicActionRows,
  resolvePublicActionTargets,
  type PublicActionTargetRegistry,
} from '@/lib/gameData/actionReplay';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
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
} from '@/data/store';
import { env } from '@/env';

import { GameDataManager } from '../lib/dataManager';
import { getActionsStorageKey, withRecordingSuppressed } from '../lib/edit/diffUtils';

const clientPublicActionTargetRegistry: PublicActionTargetRegistry = {
  characters: [characters as unknown as Record<string, unknown>],
  cards: [cardsEdit as unknown as Record<string, unknown>],
  entities: [entitiesEdit as unknown as Record<string, unknown>],
  buffs: [buffsEdit as unknown as Record<string, unknown>],
  items: [itemsEdit as unknown as Record<string, unknown>],
  fixtures: [fixturesEdit as unknown as Record<string, unknown>],
  maps: [mapsEdit as unknown as Record<string, unknown>],
  modes: [modesEdit as unknown as Record<string, unknown>],
  specialSkills: [specialSkillsEdit as unknown as Record<string, unknown>],
};

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
export function usePublicGameDataActions(options?: { initialPublicActions?: PublicActionRow[] }) {
  'use no memo';
  const [appliedCount, setAppliedCount] = useState(0);
  const handledIdsRef = useRef<Set<string>>(new Set());

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

    const shouldApply = (row: PublicActionRow) => {
      const createdAtMs = Date.parse(row.created_at);
      return !Number.isFinite(createdAtMs) || createdAtMs <= cutoffMs;
    };

    const result = applyPublicActionRows({
      rows: actions,
      handledIds: handledIdsRef.current,
      resolveTargets: (entityType) =>
        resolvePublicActionTargets(clientPublicActionTargetRegistry, entityType),
      shouldApply,
      applyWithin: (row, fn) => {
        withRecordingSuppressed(getActionsStorageKey(row.entity_type), fn);
      },
      onError: (row, err) => {
        console.error('Failed to apply public action:', row, err);
      },
    });

    if (result.mutatedCount > 0) {
      setAppliedCount((prev) => prev + result.mutatedCount);
      GameDataManager.invalidate();
    }
  }, [actions, enabledAtMs, isEditMode]);

  return { appliedCount };
}
