import {
  Achievement,
  Buff,
  Card,
  Character,
  Entity,
  Fixture,
  Item,
  ItemGroup,
  Map as MapType,
  Mode,
  SpecialSkill,
} from '@/data/types';

export type SearchResult =
  | ({ type: 'character'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Character,
      'id' | 'imageUrl'
    >)
  | ({ type: 'card'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Card,
      'id' | 'imageUrl'
    >)
  | ({
      type: 'specialSkill';
      matchContext: string;
      priority: number;
      isPinyinMatch: boolean;
    } & Pick<SpecialSkill, 'name' | 'imageUrl' | 'factionId'>)
  | {
      type: 'itemGroup';
      matchContext: string;
      priority: number;
      isPinyinMatch: boolean;
      name: ItemGroup['name'];
      imageUrl?: string;
    }
  | ({ type: 'item'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Item,
      'name' | 'imageUrl'
    >)
  | ({ type: 'entity'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Entity,
      'name' | 'imageUrl'
    >)
  | ({ type: 'buff'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Buff,
      'name' | 'imageUrl'
    >)
  | ({ type: 'map'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      MapType,
      'name' | 'imageUrl'
    >)
  | ({ type: 'fixture'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Fixture,
      'name' | 'imageUrl'
    >)
  | ({ type: 'mode'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Mode,
      'name' | 'imageUrl'
    >)
  | {
      type: 'doc';
      matchContext: string;
      priority: number;
      isPinyinMatch: boolean;
      name: string;
      slug: string;
      path: string;
      imageUrl?: string;
    }
  | ({ type: 'achievement'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Achievement,
      'name' | 'imageUrl'
    >);
