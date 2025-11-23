import { Card, Character, Item, SpecialSkill } from '@/data/types';

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
  | ({ type: 'item'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Item,
      'name' | 'imageUrl'
    >);
