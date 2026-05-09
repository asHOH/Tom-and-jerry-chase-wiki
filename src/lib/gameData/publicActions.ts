import 'server-only';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import {
  applyPublicActionRows,
  resolvePublicActionTargets,
  type PublicActionTargetRegistry,
} from '@/lib/gameData/actionReplay';
import { cached } from '@/lib/serverCache';
import { supabaseServerPublic } from '@/lib/supabase/public';
import {
  buffs,
  buffsEdit,
  cards,
  cardsEdit,
  characters,
  entities,
  fixtures,
  fixturesEdit,
  items,
  itemsEdit,
  maps,
  mapsEdit,
  modes,
  modesEdit,
  specialSkills,
  specialSkillsEdit,
} from '@/data';
import { env } from '@/env';

import { normalizePublicActionEntries } from './actionEntries';
import type { PublicActionRow } from './publicActionsTypes';

const appliedPublicActionIds = new Set<string>();

const serverPublicActionTargetRegistry: PublicActionTargetRegistry = {
  characters: [characters as unknown as Record<string, unknown>],
  factions: [],
  cards: [
    cards as unknown as Record<string, unknown>,
    cardsEdit as unknown as Record<string, unknown>,
  ],
  entities: [entities as unknown as Record<string, unknown>],
  buffs: [
    buffs as unknown as Record<string, unknown>,
    buffsEdit as unknown as Record<string, unknown>,
  ],
  items: [
    items as unknown as Record<string, unknown>,
    itemsEdit as unknown as Record<string, unknown>,
  ],
  fixtures: [
    fixtures as unknown as Record<string, unknown>,
    fixturesEdit as unknown as Record<string, unknown>,
  ],
  maps: [
    maps as unknown as Record<string, unknown>,
    mapsEdit as unknown as Record<string, unknown>,
  ],
  modes: [
    modes as unknown as Record<string, unknown>,
    modesEdit as unknown as Record<string, unknown>,
  ],
  specialSkills: [
    specialSkills as unknown as Record<string, unknown>,
    specialSkillsEdit as unknown as Record<string, unknown>,
  ],
};

function applyPublicGameDataActionsToServerData(actions: PublicActionRow[]): void {
  applyPublicActionRows({
    rows: actions,
    handledIds: appliedPublicActionIds,
    resolveTargets: (entityType) =>
      resolvePublicActionTargets(serverPublicActionTargetRegistry, entityType),
    onError: (row, err) => {
      console.error('Failed to apply public action on server:', row, err);
    },
  });
}

export type EntityUpdateHistory = {
  updatedAt: string;
  actionId: string;
  createdBy: string | null;
  status: string;
  message: string | null;
  reviewedAt: string | null;
  affectedPath: string;
};

function extractActionPaths(entry: ActionHistoryEntry): string[] {
  if (Array.isArray(entry)) {
    const paths: string[] = [];
    for (const action of entry) {
      if (action.path) paths.push(action.path);
    }
    return paths;
  }
  return entry.path ? [entry.path] : [];
}

function extractEntryId(entityType: string, path: string): string | undefined {
  const pathParts = path.split('.').filter(Boolean);
  if (pathParts.length === 0) return undefined;

  if (entityType === 'specialSkills') {
    return pathParts.length >= 2 ? pathParts[1] : undefined;
  }

  return pathParts[0];
}

export async function getEntityUpdateHistory(): Promise<Map<string, EntityUpdateHistory>> {
  const actions = await fetchPublicGameDataActions();
  const historyMap = new Map<string, EntityUpdateHistory>();

  for (const action of actions) {
    if (action.status !== 'approved' && action.status !== 'synced') continue;

    const entries = normalizePublicActionEntries(action.entry);
    for (const entry of entries) {
      const paths = extractActionPaths(entry);
      for (const path of paths) {
        const entryId = extractEntryId(action.entity_type, path);
        if (!entryId) continue;

        const historyKey = `${action.entity_type}:${entryId}`;

        const existing = historyMap.get(historyKey);
        if (!existing || new Date(action.created_at) > new Date(existing.updatedAt)) {
          historyMap.set(historyKey, {
            updatedAt: action.created_at,
            actionId: action.id,
            createdBy: action.created_by ?? null,
            status: action.status,
            message: action.message ?? null,
            reviewedAt: action.reviewed_at ?? null,
            affectedPath: path,
          });
        }
      }
    }
  }

  return historyMap;
}

export async function fetchPublicGameDataActions(): Promise<PublicActionRow[]> {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const actions = await cached(
    ['public-game-data-actions'],
    async () => {
      const { data, error } = await supabaseServerPublic
        .from('game_data_actions')
        .select('id, entity_type, entry, created_at, status, message, reviewed_at, created_by')
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching public game data actions:', error);
        return [];
      }

      return data ?? [];
    },
    {
      revalidate: 600,
      tags: ['public-game-data-actions'],
    }
  );

  return actions;
}

export async function getPublicGameDataActionsAndApplyToServerData(): Promise<PublicActionRow[]> {
  const actions = await fetchPublicGameDataActions();
  applyPublicGameDataActionsToServerData(actions);

  return actions;
}
