import 'server-only';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

export type ChatGameData = Pick<
  PublishedGameDataByType,
  'characters' | 'cards' | 'specialSkills' | 'items' | 'entities' | 'buffs'
>;

export function selectChatGameData(data: PublishedGameDataByType): ChatGameData {
  return {
    characters: data.characters,
    cards: data.cards,
    specialSkills: data.specialSkills,
    items: data.items,
    entities: data.entities,
    buffs: data.buffs,
  };
}
