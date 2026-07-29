import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import type { FactionId } from '@/data/types';

export type ArticleCharacterOption = Readonly<{
  id: string;
  factionId: FactionId;
}>;

export function selectArticleCharacterOptions(
  characters: PublishedGameDataByType['characters']
): ArticleCharacterOption[] {
  return Object.values(characters).flatMap(({ id, factionId }) =>
    factionId ? [{ id, factionId }] : []
  );
}
