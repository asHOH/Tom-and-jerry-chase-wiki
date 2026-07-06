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
};

type CharacterArticleVersionRow = {
  article_id: string | null;
  content: string | null;
  created_at: string | null;
};

export type EmbeddedCharacterArticle = {
  id: string;
  title: string;
  content: string | null;
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
          'id, title, created_at, view_count, categories(name), users_public_view!author_id(nickname)'
        )
        .eq('character_id', characterId)
        .order('created_at', { ascending: false });

      const articles = (articleRows ?? []) as unknown as CharacterArticleMetaRow[];

      if (articles.length === 0) {
        return [];
      }

      const articleIds = articles.map((article) => article.id);
      const { data: versionRows } = await supabase
        .from('article_versions_public_view')
        .select('article_id, content, created_at')
        .in('article_id', articleIds)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      const latestByArticleId = new Map<
        string,
        {
          content: string | null;
          created_at: string | null;
        }
      >();

      for (const version of (versionRows ?? []) as unknown as CharacterArticleVersionRow[]) {
        if (!version.article_id) continue;
        if (!latestByArticleId.has(version.article_id)) {
          latestByArticleId.set(version.article_id, {
            content: version.content ?? null,
            created_at: version.created_at ?? null,
          });
        }
      }

      return articles
        .map((article): EmbeddedCharacterArticle => {
          const latest = latestByArticleId.get(article.id);
          const authorNickname = article.users_public_view?.nickname ?? null;
          const authors = authorNickname ? [authorNickname] : [];

          return {
            id: article.id,
            title: article.title,
            content: latest?.content ? sanitizeHTML(latest.content, { removeH1: true }) : null,
            authors,
            createdAt: latest?.created_at ?? null,
            viewCount: article.view_count,
            categoryName: article.categories?.name ?? null,
            articleCreatedAt: article.created_at,
          };
        })
        .filter((article) => Boolean(article.content));
    },
    {
      revalidate: 60,
      tags: [CACHE_TAGS.articles],
    }
  );
}
