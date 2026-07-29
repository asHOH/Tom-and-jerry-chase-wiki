import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

export type ChatGameData = Pick<
  PublishedGameDataByType,
  'characters' | 'cards' | 'specialSkills' | 'items' | 'entities' | 'buffs'
>;

export type ChatGameDataResponse = Readonly<{
  revision: `v1:${string}`;
  data: ChatGameData;
}>;

export function selectChatGameData(data: PublishedGameDataByType): ChatGameData {
  return {
    characters: data.characters,
    cards: data.cards,
    specialSkills: data.specialSkills,
    items: data.items,
    entities: data.entities,
    buffs: data.buffs,
  };
}

export function isChatGameDataResponse(value: unknown): value is ChatGameDataResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    revision?: unknown;
    data?: Record<string, unknown>;
  };

  return (
    typeof candidate.revision === 'string' &&
    candidate.revision.startsWith('v1:') &&
    !!candidate.data &&
    typeof candidate.data === 'object' &&
    ['characters', 'cards', 'specialSkills', 'items', 'entities', 'buffs'].every(
      (key) => !!candidate.data?.[key] && typeof candidate.data[key] === 'object'
    )
  );
}
