import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { CharacterWithFaction, KnowledgeCardWithFaction } from '@/lib/types';
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

type FactionData<T> = Record<FactionId, Record<string, T>>;

export type PublishedGameDataByType = {
  characters: Record<string, CharacterWithFaction>;
  cards: Record<string, KnowledgeCardWithFaction>;
  entities: Record<string, Entity>;
  buffs: Record<string, Buff>;
  items: Record<string, Item>;
  fixtures: Record<string, Fixture>;
  maps: Record<string, GameMap>;
  modes: Record<string, Mode>;
  specialSkills: FactionData<SpecialSkill>;
  achievements: FactionData<Achievement>;
};

type HasExactlyPublishableEntityTypeKeys<T> =
  Exclude<keyof T, PublishableEntityType> extends never
    ? Exclude<PublishableEntityType, keyof T> extends never
      ? true
      : false
    : false;

type Assert<T extends true> = T;

export type PublishedGameDataByTypeIsExhaustive = Assert<
  HasExactlyPublishableEntityTypeKeys<PublishedGameDataByType>
>;
