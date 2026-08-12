import { proxy } from 'valtio/vanilla';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
import type {
  Achievement,
  Buff,
  Entity,
  Fixture,
  Map as GameMap,
  Item,
  Mode,
  SpecialSkill,
  Trait,
} from '@/data/types';

export type EditStores = {
  characters: Record<string, CharacterWithFaction>;
  cards: Record<string, KnowledgeCardWithFaction>;
  entities: Record<string, Entity>;
  buffs: Record<string, Buff>;
  items: Record<string, Item>;
  fixtures: Record<string, Fixture>;
  maps: Record<string, GameMap>;
  modes: Record<string, Mode>;
  specialSkills: Record<'cat' | 'mouse', Record<string, SpecialSkill>>;
  achievements: Record<'cat' | 'mouse', Record<string, Achievement>>;
  traits: Record<string, Trait>;
};

function createEditableStore<T extends object>(value: object): T {
  return proxy(structuredClone(value)) as T;
}

export function createEditStores(baseline: PublishedGameDataByType): EditStores {
  return {
    achievements: createEditableStore<EditStores['achievements']>(baseline.achievements),
    characters: createEditableStore<EditStores['characters']>(baseline.characters),
    cards: createEditableStore<EditStores['cards']>(baseline.cards),
    entities: createEditableStore<EditStores['entities']>(baseline.entities),
    buffs: createEditableStore<EditStores['buffs']>(baseline.buffs),
    items: createEditableStore<EditStores['items']>(baseline.items),
    fixtures: createEditableStore<EditStores['fixtures']>(baseline.fixtures),
    maps: createEditableStore<EditStores['maps']>(baseline.maps),
    modes: createEditableStore<EditStores['modes']>(baseline.modes),
    specialSkills: createEditableStore<EditStores['specialSkills']>(baseline.specialSkills),
    traits: createEditableStore<EditStores['traits']>(baseline.traits),
  };
}
