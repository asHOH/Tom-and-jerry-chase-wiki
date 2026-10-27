import type { FactionId } from '@/data/types';

export type SearchMatch = {
  matchContext: string;
  highlightRanges: [start: number, end: number][];
  priority: number;
  isPinyinMatch: boolean;
};

export type SearchResult = SearchMatch & {
  key: string;
  title: string;
  href: string;
  imageUrl?: string | undefined;
} & (
    | {
        type:
          | 'character'
          | 'card'
          | 'itemGroup'
          | 'item'
          | 'entity'
          | 'buff'
          | 'map'
          | 'fixture'
          | 'mode'
          | 'doc';
      }
    | { type: 'specialSkill' | 'achievement'; factionId: FactionId }
  );
