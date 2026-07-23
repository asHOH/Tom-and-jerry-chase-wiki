import type { DeepReadonly } from '@/types/deep-readonly';
import type { CardGameData, CharacterGameData } from '@/lib/dataManager';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type {
  Achievement,
  Buff,
  Entity,
  FactionId,
  Fixture,
  Map as GameMap,
  Item,
  Mode,
  SpecialSkill,
} from '@/data/types';

import type { PublishedRevision } from './revision';

type FactionData<T> = Record<FactionId, Record<string, T>>;

type PublishedGameDataShapeByType = {
  characters: CharacterGameData;
  cards: CardGameData;
  entities: Record<string, Entity>;
  buffs: Record<string, Buff>;
  items: Record<string, Item>;
  fixtures: Record<string, Fixture>;
  maps: Record<string, GameMap>;
  modes: Record<string, Mode>;
  specialSkills: FactionData<SpecialSkill>;
  achievements: FactionData<Achievement>;
};

export type PublishedGameDataEntityByType = {
  characters: CharacterGameData[string];
  cards: CardGameData[string];
  entities: Entity;
  buffs: Buff;
  items: Item;
  fixtures: Fixture;
  maps: GameMap;
  modes: Mode;
  specialSkills: SpecialSkill;
  achievements: Achievement;
};

export type PublishedGameDataByType = {
  readonly [EntityType in keyof PublishedGameDataShapeByType]: DeepReadonly<
    PublishedGameDataShapeByType[EntityType]
  >;
};

type HasExactlyPublishableEntityTypeKeys<T> =
  Exclude<keyof T, PublishableEntityType> extends never
    ? Exclude<PublishableEntityType, keyof T> extends never
      ? true
      : false
    : false;

type Assert<T extends true> = T;

export type PublishedGameDataByTypeIsExhaustive = Assert<
  HasExactlyPublishableEntityTypeKeys<PublishedGameDataShapeByType>
>;

export type PublishedGameDataSnapshot = DeepReadonly<{
  revision: PublishedRevision;
  actionRevision: `v1:${string}`;
  buildIdentity: string;
  data: PublishedGameDataByType;
}>;

export type PublishedDomainReadModel<EntityType extends PublishableEntityType> = {
  readonly revision: PublishedRevision;
  readonly entityType: EntityType;
  readonly data: PublishedGameDataByType[EntityType];
};
