import 'server-only';

import { getPublicReadClient } from '@/lib/articles/server/readClient';
import { flattenActionEntries, normalizePublicActionEntries } from '@/lib/gameData/actionEntries';
import { GAME_DATA_CONTRIBUTION_FILTER } from '@/lib/gameData/contributionFilter';
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

type AggregatedContentEditor = ContentEditor & {
  contributionCount: number;
};

async function queryGameDataActionAuthors(characterId: string): Promise<AggregatedContentEditor[]> {
  const supabase = getPublicReadClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('game_data_actions')
    .select('entry, created_by, users_public_view!created_by(nickname)')
    .eq('entity_type', 'characters')
    .or(GAME_DATA_CONTRIBUTION_FILTER);

  if (error) {
    console.error('Failed to load game-data action authors:', error);
    return [];
  }

  const authors = new Map<string, AggregatedContentEditor>();
  for (const row of (data ?? []) as unknown as CharacterGameDataActionAuthorRow[]) {
    const nickname = row.users_public_view?.nickname?.trim();
    if (!row.created_by || !nickname) continue;

    const touchesCharacter = flattenActionEntries(normalizePublicActionEntries(row.entry)).some(
      (action) => getGameDataActionTarget('characters', action.path)?.entityId === characterId
    );
    if (touchesCharacter) {
      const author = authors.get(row.created_by);
      if (author) {
        author.contributionCount += 1;
      } else {
        authors.set(row.created_by, { id: row.created_by, name: nickname, contributionCount: 1 });
      }
    }
  }

  return [...authors.values()].sort(
    (left, right) =>
      right.contributionCount - left.contributionCount || left.name.localeCompare(right.name)
  );
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
  let actionAuthors: AggregatedContentEditor[] = [];
  try {
    actionAuthors = await cached(
      [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'character-content-writers-v2', characterId],
      () => queryGameDataActionAuthors(characterId),
      {
        revalidate: false,
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
    editors: editors.map(({ id, name }) => ({ id, name })),
  };
}
