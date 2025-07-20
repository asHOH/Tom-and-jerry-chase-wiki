import { Character, Card } from '@/data/types';
export type SearchResult =
  | ({ type: 'character'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Character,
      'id' | 'imageUrl'
    >)
  | ({ type: 'card'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Card,
      'id' | 'imageUrl'
    >);
