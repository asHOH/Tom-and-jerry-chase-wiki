import 'server-only';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

export type ChatGameData = PublishedGameDataByType;

export function selectChatGameData(data: PublishedGameDataByType): ChatGameData {
  return {
    characters: data.characters,
    cards: data.cards,
    specialSkills: data.specialSkills,
    items: data.items,
    entities: data.entities,
    buffs: data.buffs,
    maps: data.maps,
    fixtures: data.fixtures,
    modes: data.modes,
    achievements: data.achievements,
    traits: data.traits,
  };
}
