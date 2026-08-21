import 'server-only';

import { getCharacterContributorIndex } from '@/lib/gameData/characterContributorIndex';
import type { CharacterContributor } from '@/lib/gameData/characterContributors';
import type { ContentEditor } from '@/lib/types';
import { contributors, RoleType } from '@/data/contributors';
import { getContentWritersByCharacter } from '@/constants';

export type CharacterContentWriterData = {
  writers: string[];
  editors: ContentEditor[];
};

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
  let actionAuthors: CharacterContributor[] = [];
  try {
    actionAuthors = (await getCharacterContributorIndex())[characterId] ?? [];
  } catch (error) {
    console.error('Failed to load game-data action authors:', error);
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
