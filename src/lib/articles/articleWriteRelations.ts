import 'server-only';

import { resolveArticleCategoryPolicy } from '@/lib/articles/articleCategoryPolicy';
import { selectArticleCharacterOptions } from '@/lib/articles/articleCharacterOptions';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class ArticleWriteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArticleWriteValidationError';
  }
}

export async function resolveArticleCharacterForWrite({
  categoryId,
  characterId,
}: {
  categoryId: string;
  characterId: string | null;
}): Promise<string | null> {
  const { data: categories, error } = await supabaseAdmin
    .from('categories')
    .select('id, parent_category_id, requires_character');

  if (error) {
    throw new Error(`Failed to load article category policy: ${error.message}`);
  }

  const policy = resolveArticleCategoryPolicy(categories ?? [], categoryId);
  if (!policy) {
    throw new ArticleWriteValidationError('Article category not found');
  }

  if (!policy.requiresCharacter) return null;

  if (!characterId) {
    throw new ArticleWriteValidationError('This article category requires a character');
  }

  const characters = await getPublishedDomainReadModel('characters');
  const isValidCharacter = selectArticleCharacterOptions(characters.data).some(
    (character) => character.id === characterId
  );

  if (!isValidCharacter) {
    throw new ArticleWriteValidationError('Article character not found');
  }

  return characterId;
}
