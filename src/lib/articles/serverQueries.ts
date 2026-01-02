import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';
import type { Database } from '@/data/database.types';
import type { Article as ArticleListItem, ArticlesData, Category } from '@/data/types';

function getPublicReadClient(): SupabaseClient<Database> | undefined {
  // Prefer service-role (faster/consistent, bypasses any RLS quirks), fall back to anon server client.
  return (
    (supabaseAdmin as unknown as SupabaseClient<Database> | undefined) ??
    (supabaseServerPublic as unknown as SupabaseClient<Database> | undefined)
  );
}

export async function getArticlesPageData(): Promise<ArticlesData> {
  const supabase = getPublicReadClient();
  if (!supabase) return { articles: [], categories: [] };

  return cached(
    ['articles', 'page-data'],
    async () => {
      const { data: articles } = await supabase
        .from('articles')
        .select(
          `
            id,
            title,
            created_at,
            view_count,
            author_id,
            category_id,
            character_id,
            categories (
              id,
              name
            ),
            users_public_view:author_id (
              nickname
            ),
            latest_approved_version:article_versions_public_view!inner (
              id,
              content,
              created_at,
              status,
              editor_id,
              users_public_view:editor_id (
                nickname
              )
            )
          `
        )
        .eq('article_versions_public_view.status', 'approved')
        .order('created_at');

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      return {
        articles: (articles || []) as unknown as ArticleListItem[],
        categories: (categories || []) as unknown as Category[],
      };
    },
    {
      revalidate: 60,
      tags: [CACHE_TAGS.articles, CACHE_TAGS.categories],
    }
  );
}

export type ArticleBasicInfo = {
  id: string;
  title: string;
  category_id: string;
  author_id: string;
  created_at: string;
  view_count?: number;
  character_id?: string | null;
  categories: { name: string };
  users_public_view: { nickname: string | null } | null;
};

export async function getArticleBasicInfo(articleId: string): Promise<ArticleBasicInfo | null> {
  const supabase = getPublicReadClient();
  if (!supabase) return null;

  return cached(
    ['article', articleId, 'basic'],
    async () => {
      const { data: article } = await supabase
        .from('articles')
        .select(
          `
            id,
            title,
            category_id,
            author_id,
            created_at,
            view_count,
            character_id,
            categories(name),
            users_public_view!author_id(nickname)
          `
        )
        .eq('id', articleId)
        .single();

      return (article as unknown as ArticleBasicInfo) ?? null;
    },
    {
      revalidate: 300,
      tags: [CACHE_TAGS.article(articleId), CACHE_TAGS.articles],
    }
  );
}

export type ArticleApprovedVersion = {
  id: string;
  content: string | null;
  created_at: string | null;
  editor_id: string | null;
  users_public_view: { nickname: string | null } | null;
};

export async function getApprovedArticleVersion(args: {
  articleId: string;
  versionId?: string;
}): Promise<ArticleApprovedVersion | null> {
  const supabase = getPublicReadClient();
  if (!supabase) return null;

  const { articleId, versionId } = args;

  return cached(
    ['article', articleId, 'approved-version', versionId ?? 'latest'],
    async () => {
      let query = supabase
        .from('article_versions_public_view')
        .select(
          `
            id,
            content,
            created_at,
            editor_id,
            users_public_view!editor_id(nickname)
          `
        )
        .eq('article_id', articleId)
        .eq('status', 'approved');

      if (versionId) {
        query = query.eq('id', versionId);
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data } = await query.limit(1).single();
      return (data as unknown as ArticleApprovedVersion) ?? null;
    },
    {
      revalidate: 60,
      tags: [CACHE_TAGS.articleVersions(articleId), CACHE_TAGS.article(articleId)],
    }
  );
}
