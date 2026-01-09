import 'server-only';

import {
  applyAction,
  applyActionEntry,
  type Action,
  type ActionHistoryEntry,
} from '@/lib/edit/diffUtils';
import { cached } from '@/lib/serverCache';
import { supabaseServerPublic } from '@/lib/supabase/public';
import { actionHistoryEntrySchema } from '@/lib/validation/schemas';
import {
  buffs,
  buffsEdit,
  cards,
  cardsEdit,
  characters,
  entities,
  factions,
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

import type { PublicActionRow } from './publicActionsTypes';

const appliedPublicActionIds = new Set<string>();

function forEachAction(entry: ActionHistoryEntry, fn: (action: Action) => void): void {
  if (Array.isArray(entry)) {
    for (const action of entry) fn(action);
    return;
  }

  fn(entry);
}

function applyEntitiesActionEntry(entry: ActionHistoryEntry): void {
  const catEntities = entities.cat as unknown as Record<string, unknown>;
  const mouseEntities = entities.mouse as unknown as Record<string, unknown>;

  forEachAction(entry, (action) => {
    if (!action.path) return;

    const entityKey = action.path.split('.').filter(Boolean)[0];
    if (!entityKey) return;

    const target = Object.prototype.hasOwnProperty.call(catEntities, entityKey)
      ? catEntities
      : Object.prototype.hasOwnProperty.call(mouseEntities, entityKey)
        ? mouseEntities
        : null;

    if (!target) return;

    applyAction(target, action);
  });
}

function applyPublicActionRowToServerData(row: PublicActionRow): boolean {
  if (!row?.id || appliedPublicActionIds.has(row.id)) return false;

  const parsed = actionHistoryEntrySchema.safeParse(row.entry);
  if (!parsed.success) return false;
  const entry = parsed.data as ActionHistoryEntry;

  try {
    switch (row.entity_type) {
      case 'characters':
        applyActionEntry(characters as unknown as Record<string, unknown>, entry);
        break;
      case 'factions':
        applyActionEntry(factions as unknown as Record<string, unknown>, entry);
        break;
      case 'cards':
        applyActionEntry(cards as unknown as Record<string, unknown>, entry);
        applyActionEntry(cardsEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'entities':
        applyEntitiesActionEntry(entry);
        break;
      case 'buffs':
        applyActionEntry(buffs as unknown as Record<string, unknown>, entry);
        applyActionEntry(buffsEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'items':
        applyActionEntry(items as unknown as Record<string, unknown>, entry);
        applyActionEntry(itemsEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'fixtures':
        applyActionEntry(fixtures as unknown as Record<string, unknown>, entry);
        applyActionEntry(fixturesEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'maps':
        applyActionEntry(maps as unknown as Record<string, unknown>, entry);
        applyActionEntry(mapsEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'modes':
        applyActionEntry(modes as unknown as Record<string, unknown>, entry);
        applyActionEntry(modesEdit as unknown as Record<string, unknown>, entry);
        break;
      case 'specialSkills':
        applyActionEntry(specialSkills as unknown as Record<string, unknown>, entry);
        applyActionEntry(specialSkillsEdit as unknown as Record<string, unknown>, entry);
        break;
      default:
        return false;
    }

    appliedPublicActionIds.add(row.id);
    return true;
  } catch (err) {
    console.error('Failed to apply public action on server:', row, err);
    return false;
  }
}

function applyPublicGameDataActionsToServerData(actions: PublicActionRow[]): void {
  for (const row of actions) {
    applyPublicActionRowToServerData(row);
  }
}

export async function getPublicGameDataActions(): Promise<PublicActionRow[]> {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const actions = await cached(
    ['public-game-data-actions'],
    async () => {
      const { data, error } = await supabaseServerPublic
        .from('game_data_actions')
        .select('id, entity_type, entry, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching public game data actions:', error);
        return [];
      }

      return data ?? [];
    },
    {
      revalidate: 60,
      tags: ['public-game-data-actions'],
    }
  );

  // Side effect: keep server-side data in sync so route handlers / server components
  // that import from `@/data` see the same public patches as the client.
  applyPublicGameDataActionsToServerData(actions);

  return actions;
}
