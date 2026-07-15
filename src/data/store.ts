import { proxy } from 'valtio';

import { GameDataManager } from '@/lib/dataManager';
import { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
import catAchievementsStatic from '@/features/achievements/data/catAchievements';
import mouseAchievementsStatic from '@/features/achievements/data/mouseAchievements';
import buffsStatic from '@/features/buffs/data/buffs';
import entitiesStatic from '@/features/entities/data/entities';
import fixturesStatic from '@/features/fixtures/data/fixtures';
import itemsStatic from '@/features/items/data/items';
import modesStatic from '@/features/modes/data/modes';
import catSpecialSkillsStatic from '@/features/special-skills/data/catSpecialSkills';
import mouseSpecialSkillsStatic from '@/features/special-skills/data/mouseSpecialSkills';

import mapsStatic from './maps';
import type {
  Achievement,
  Buff,
  Entity,
  Fixture,
  Item,
  Map as MapType,
  Mode,
  SpecialSkill,
} from './types';

function createEditableStore<T extends Record<string, unknown>>(record: T): T {
  return proxy(structuredClone(record)) as T;
}

export const characters: Record<string, CharacterWithFaction> = createEditableStore(
  GameDataManager.getCharacters() as Record<string, CharacterWithFaction>
);

// Knowledge cards are exported as a read-only static object in src/data/static.ts.
// This proxy-backed store enables local-only edit mode, mirroring how characters are edited.
export const cardsEdit: Record<string, KnowledgeCardWithFaction> = createEditableStore(
  GameDataManager.getCards() as Record<string, KnowledgeCardWithFaction>
);

export const itemsEdit: Record<string, Item> = createEditableStore(
  itemsStatic as Record<string, Item>
);

export const buffsEdit: Record<string, Buff> = createEditableStore(
  buffsStatic as Record<string, Buff>
);

export const mapsEdit: Record<string, MapType> = createEditableStore(
  mapsStatic as Record<string, MapType>
);

export const fixturesEdit: Record<string, Fixture> = createEditableStore(
  fixturesStatic as Record<string, Fixture>
);

export const modesEdit: Record<string, Mode> = createEditableStore(
  modesStatic as Record<string, Mode>
);

export const entitiesEdit: Record<string, Entity> = createEditableStore(
  entitiesStatic as Record<string, Entity>
);

export const specialSkillsEdit: {
  cat: Record<string, SpecialSkill>;
  mouse: Record<string, SpecialSkill>;
} = proxy({
  cat: createEditableStore(catSpecialSkillsStatic as Record<string, SpecialSkill>),
  mouse: createEditableStore(mouseSpecialSkillsStatic as Record<string, SpecialSkill>),
});

export const achievementsEdit: {
  cat: Record<string, Achievement>;
  mouse: Record<string, Achievement>;
} = proxy({
  cat: createEditableStore(catAchievementsStatic as Record<string, Achievement>),
  mouse: createEditableStore(mouseAchievementsStatic as Record<string, Achievement>),
});
