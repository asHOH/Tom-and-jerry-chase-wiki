import 'server-only';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import { sanitizeHTML } from '@/lib/xssUtils';

import { getPublicReadClient } from './readClient';

type CharacterArticleMetaRow = {
  id: string;
  title: string;
  created_at: string | null;
  view_count: number | null;
  categories: { name: string } | null;
  users_public_view: { nickname: string | null } | null;
  current_version: {
    content: string | null;
    created_at: string | null;
  } | null;
};

export type EmbeddedCharacterArticle = {
  id: string;
  title: string;
  content: string;
  authors: string[];
  createdAt: string | null;
  viewCount: number | null;
  categoryName: string | null;
  articleCreatedAt: string | null;
};

export async function getEmbeddedArticlesForCharacter(
  characterId: string
): Promise<EmbeddedCharacterArticle[]> {
  const supabase = getPublicReadClient();
  if (!supabase) return [];

  return cached(
    ['articles', 'character', characterId, 'embedded'],
    async () => {
      const { data: articleRows } = await supabase
        .from('articles')
        .select(
          `
            id,
            title,
            created_at,
            view_count,
            categories(name),
            users_public_view!author_id(nickname),
            current_version:article_versions_public_view!articles_current_version_id_fkey(
              content,
              created_at
            )
          `
        )
        .eq('character_id', characterId)
        .not('current_version_id', 'is', null)
        .order('created_at', { ascending: false });

      const articles = (articleRows ?? []) as unknown as CharacterArticleMetaRow[];

      if (articles.length === 0) {
        return [];
      }

      return articles.flatMap((article): EmbeddedCharacterArticle[] => {
        const latest = article.current_version;
        if (!latest?.content) return [];

        const content = sanitizeHTML(latest.content, { removeH1: true });
        if (!content) return [];

        const authorNickname = article.users_public_view?.nickname ?? null;
        const authors = authorNickname ? [authorNickname] : [];

        return [
          {
            id: article.id,
            title: article.title,
            content,
            authors,
            createdAt: latest.created_at ?? null,
            viewCount: article.view_count,
            categoryName: article.categories?.name ?? null,
            articleCreatedAt: article.created_at,
          },
        ];
      });
    },
    {
      revalidate: 28800,
      tags: [CACHE_TAGS.articles],
    }
  );
}
