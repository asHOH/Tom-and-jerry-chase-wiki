import 'server-only';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import {
  applyPublicActionRows,
  resolvePublicActionTargets,
  type PublicActionTargetRegistry,
} from '@/lib/gameData/actionReplay';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { cached } from '@/lib/serverCache';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { supabaseServerPublic } from '@/lib/supabase/public';
import {
  achievements,
  achievementsEdit,
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

import { normalizePublicActionEntries } from './actionEntries';
import {
  PublicActionQueryError,
  queryApprovedPublicActionRows,
  queryPublicActionHistoryRows,
} from './publicActionQueries';
import type { PublicActionRow } from './publicActionsTypes';
import { getGameDataActionEntityKey } from './scopedEntityPaths';

export { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';

const appliedPublicActionIds = new Set<string>();

const serverPublicActionTargetRegistry: PublicActionTargetRegistry = {
  achievements: [
    achievements as unknown as Record<string, unknown>,
    achievementsEdit as unknown as Record<string, unknown>,
  ],
  characters: [characters as unknown as Record<string, unknown>],
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
} satisfies Record<PublishableEntityType, Record<string, unknown>[]>;

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
  return getGameDataActionEntityKey(entityType, path);
}

export async function getEntityUpdateHistory(): Promise<Map<string, EntityUpdateHistory>> {
  const actions = await fetchPublicGameDataActionHistoryRows();
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
        const isLaterAction =
          !existing ||
          new Date(action.created_at) > new Date(existing.updatedAt) ||
          (action.created_at === existing.updatedAt &&
            action.id.localeCompare(existing.actionId) > 0);

        if (isLaterAction) {
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

async function fetchPublicGameDataActionHistoryRows(): Promise<PublicActionRow[]> {
  if (!hasSupabasePublicConfig()) {
    return [];
  }

  try {
    return await cached(
      [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'history'],
      () => queryPublicActionHistoryRows(supabaseServerPublic),
      {
        revalidate: false,
        tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
      }
    );
  } catch (error) {
    console.error(
      'Error fetching public game data action history:',
      error instanceof PublicActionQueryError ? error.cause : error
    );
    return [];
  }
}

export async function fetchPublicGameDataActions(): Promise<PublicActionRow[]> {
  if (!hasSupabasePublicConfig()) {
    return [];
  }

  try {
    return await cached(
      [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
      () => queryApprovedPublicActionRows(supabaseServerPublic),
      {
        // Public actions change only through server mutations, which explicitly
        // revalidate this tag. Avoid periodic database reads on public page requests.
        revalidate: false,
        tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
      }
    );
  } catch (error) {
    console.error(
      'Error fetching public game data actions:',
      error instanceof PublicActionQueryError ? error.cause : error
    );
    return [];
  }
}

export async function getPublicGameDataActionsAndApplyToServerData(): Promise<PublicActionRow[]> {
  const actions = await fetchPublicGameDataActions();
  applyPublicGameDataActionsToServerData(actions);

  return actions;
}
