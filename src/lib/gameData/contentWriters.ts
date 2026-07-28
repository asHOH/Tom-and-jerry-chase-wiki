import 'server-only';

import { getPublicReadClient } from '@/lib/articles/server/readClient';
import { flattenActionEntries, normalizePublicActionEntries } from '@/lib/gameData/actionEntries';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';
import { getGameDataActionTarget } from '@/lib/gameData/scopedEntityPaths';
import { cached } from '@/lib/serverCache';
import type { ContentEditor } from '@/lib/types';
import { contributors, RoleType } from '@/data/contributors';
import { getContentWritersByCharacter } from '@/constants';

type CharacterGameDataActionAuthorRow = {
  entry: unknown;
  created_by: string | null;
  users_public_view: { nickname: string | null } | null;
};

export type CharacterContentWriterData = {
  writers: string[];
  editors: ContentEditor[];
};

async function queryGameDataActionAuthors(characterId: string): Promise<ContentEditor[]> {
  const supabase = getPublicReadClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('game_data_actions')
    .select('entry, created_by, users_public_view!created_by(nickname)')
    .eq('entity_type', 'characters')
    .eq('is_public', true);

  if (error) {
    console.error('Failed to load game-data action authors:', error);
    return [];
  }

  const authors = new Map<string, string>();
  for (const row of (data ?? []) as unknown as CharacterGameDataActionAuthorRow[]) {
    const nickname = row.users_public_view?.nickname?.trim();
    if (!row.created_by || !nickname) continue;

    const touchesCharacter = flattenActionEntries(normalizePublicActionEntries(row.entry)).some(
      (action) => getGameDataActionTarget('characters', action.path)?.entityId === characterId
    );
    if (touchesCharacter) authors.set(row.created_by, nickname);
  }

  return [...authors].map(([id, name]) => ({ id, name }));
}

export async function getContentWritersForCharacter(
  characterId: string
): Promise<CharacterContentWriterData> {
  const staticAuthors = [...new Set(getContentWritersByCharacter(characterId))];
  const staticAuthorNames = new Set(staticAuthors);
  const staticAuthorIds = new Set(
    contributors
      .filter((contributor) =>
        contributor.roles.some(
          (role) => role.type === RoleType.ContentWriter && role.characters?.includes(characterId)
        )
      )
      .map((contributor) => contributor.id)
  );
  let actionAuthors: ContentEditor[] = [];
  try {
    actionAuthors = await cached(
      [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'character-content-writers', characterId],
      () => queryGameDataActionAuthors(characterId),
      {
        revalidate: 300,
        tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
      }
    );
  } catch (error) {
    console.error('Failed to load cached game-data action authors:', error);
  }

  const editorNames = new Set<string>();
  const editors = actionAuthors.filter(({ id, name }) => {
    if (staticAuthorIds.has(id) || staticAuthorNames.has(name) || editorNames.has(name)) {
      return false;
    }

    editorNames.add(name);
    return true;
  });

  return {
    writers: [...new Set([...staticAuthors, ...editors.map(({ name }) => name)])],
    editors,
  };
}
