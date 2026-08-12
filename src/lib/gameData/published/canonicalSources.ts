import 'server-only';

import type { DeepReadonly } from '@/types/deep-readonly';
import { buildCardGameData, buildCharacterGameData } from '@/lib/dataManager';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { createMapsData } from '@/data/maps';
import { createTraitsData } from '@/data/traits';
import { createCatAchievementsData } from '@/features/achievements/data/catAchievements';
import { createMouseAchievementsData } from '@/features/achievements/data/mouseAchievements';
import { createBuffsData } from '@/features/buffs/data/buffs';
import { createEntitiesData } from '@/features/entities/data/entities';
import { createFixturesData } from '@/features/fixtures/data/fixtures';
import { createItemsData } from '@/features/items/data/items';
import { createModesData } from '@/features/modes/data/modes';
import { createCatSpecialSkillsData } from '@/features/special-skills/data/catSpecialSkills';
import { createMouseSpecialSkillsData } from '@/features/special-skills/data/mouseSpecialSkills';

import type { PublishedGameDataByType } from './types';

type CanonicalSourceRegistry = {
  [EntityType in PublishableEntityType]: () => PublishedGameDataByType[EntityType];
};

function createCanonicalGetter<T>(factory: () => T): () => DeepReadonly<T> {
  let canonicalValue: DeepReadonly<T> | undefined;

  return () => {
    canonicalValue ??= factory() as DeepReadonly<T>;
    return canonicalValue;
  };
}

const canonicalSources = {
  characters: createCanonicalGetter(buildCharacterGameData),
  cards: createCanonicalGetter(buildCardGameData),
  entities: createCanonicalGetter(createEntitiesData),
  buffs: createCanonicalGetter(createBuffsData),
  items: createCanonicalGetter(createItemsData),
  fixtures: createCanonicalGetter(createFixturesData),
  maps: createCanonicalGetter(createMapsData),
  modes: createCanonicalGetter(createModesData),
  specialSkills: createCanonicalGetter(() => ({
    cat: createCatSpecialSkillsData(),
    mouse: createMouseSpecialSkillsData(),
  })),
  achievements: createCanonicalGetter(() => ({
    cat: createCatAchievementsData(),
    mouse: createMouseAchievementsData(),
  })),
  traits: createCanonicalGetter(createTraitsData),
} satisfies CanonicalSourceRegistry;

export function getCanonicalGameData<EntityType extends PublishableEntityType>(
  entityType: EntityType
): PublishedGameDataByType[EntityType] {
  const getCanonicalSource = canonicalSources[
    entityType
  ] as () => PublishedGameDataByType[EntityType];

  return getCanonicalSource();
}
