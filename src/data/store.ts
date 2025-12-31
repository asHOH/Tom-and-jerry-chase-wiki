import { proxy } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction, FactionWithCharacters, KnowledgeCardWithFaction } from '@/lib/types';
import fixturesStatic from '@/features/fixtures/data/fixtures';
import itemsStatic from '@/features/items/data/items';
import modesStatic from '@/features/modes/data/modes';
import catSpecialSkillsStatic from '@/features/special-skills/data/catSpecialSkills';
import mouseSpecialSkillsStatic from '@/features/special-skills/data/mouseSpecialSkills';

import buffsStatic from './buffs';
import catEntitiesStatic from './catEntities';
import mapsStatic from './maps';
import mouseEntitiesStatic from './mouseEntities';
import type { Buff, Entity, Fixture, Item, Map as MapType, Mode, SpecialSkill } from './types';

function proxyRecord<T extends Record<string, unknown>>(record: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === 'object' && value !== null ? proxy(value as Record<string, unknown>) : value,
    ])
  );
}

export const characters: Record<string, CharacterWithFaction> = proxy(
  GameDataManager.getCharacters()
);

export const factions: Record<string, FactionWithCharacters> = proxy(GameDataManager.getFactions());

// Knowledge cards are exported as a read-only static object in src/data/static.ts.
// This proxy-backed store enables local-only edit mode, mirroring how characters are edited.
export const cardsEdit: Record<string, KnowledgeCardWithFaction> = proxy(
  GameDataManager.getCards()
);

export const itemsEdit: Record<string, Item> = proxy(
  proxyRecord(itemsStatic) as Record<string, Item>
);

export const buffsEdit: Record<string, Buff> = proxy(
  proxyRecord(buffsStatic) as Record<string, Buff>
);

export const mapsEdit: Record<string, MapType> = proxy(
  proxyRecord(mapsStatic) as Record<string, MapType>
);

export const fixturesEdit: Record<string, Fixture> = proxy(
  proxyRecord(fixturesStatic) as Record<string, Fixture>
);

export const modesEdit: Record<string, Mode> = proxy(
  proxyRecord(modesStatic) as Record<string, Mode>
);

export const entitiesEdit: Record<string, Entity> = proxy(
  proxyRecord({
    ...(catEntitiesStatic as Record<string, Entity>),
    ...(mouseEntitiesStatic as Record<string, Entity>),
  }) as Record<string, Entity>
);

export const specialSkillsEdit: {
  cat: Record<string, SpecialSkill>;
  mouse: Record<string, SpecialSkill>;
} = proxy({
  cat: proxy(proxyRecord(catSpecialSkillsStatic) as Record<string, SpecialSkill>),
  mouse: proxy(proxyRecord(mouseSpecialSkillsStatic) as Record<string, SpecialSkill>),
});
