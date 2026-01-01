'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

import {
  buffsEdit,
  cardsEdit,
  characters,
  entitiesEdit,
  factions,
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

type PublicActionRow = {
  id: string;
  entity_type: string;
  entry: ActionHistoryEntry;
  created_at: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as { actions: PublicActionRow[] };
};

function getTarget(entityType: string): Record<string, unknown> | null {
  switch (entityType) {
    case 'characters':
      return characters as unknown as Record<string, unknown>;
    case 'factions':
      return factions as unknown as Record<string, unknown>;
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

export function usePublicGameDataActions() {
  const [appliedCount, setAppliedCount] = useState(0);
  const appliedIdsRef = useRef<Set<string>>(new Set());

  const enabled =
    !process.env.NEXT_PUBLIC_DISABLE_ARTICLES && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { data } = useSWR(enabled ? '/api/game-data-actions/public' : null, fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (!data?.actions?.length) return;

    let didApply = 0;

    for (const row of data.actions) {
      if (!row?.id || appliedIdsRef.current.has(row.id)) continue;

      const target = getTarget(row.entity_type);
      if (!target) continue;

      const storageKey = getActionsStorageKey(row.entity_type);

      try {
        withRecordingSuppressed(storageKey, () => {
          applyActionEntry(target, row.entry);
        });
        appliedIdsRef.current.add(row.id);
        didApply += 1;
      } catch (err) {
        console.error('Failed to apply public action:', row, err);
      }
    }

    if (didApply > 0) {
      setAppliedCount((prev) => prev + didApply);
      GameDataManager.invalidate();
    }
  }, [data]);

  return { appliedCount };
}
