import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';
import { sanitizeHTML } from '@/lib/xssUtils';
import type { Database } from '@/data/database.types';
import type { Article as ArticleListItem, ArticlesData, Category } from '@/data/types';

const ARTICLE_LIST_SELECT = `
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
`;

function getPublicReadClient(): SupabaseClient<Database> | undefined {
  // Prefer secret-key admin access for consistency, fall back to the publishable-key client.
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
        .select(ARTICLE_LIST_SELECT)
        .eq('article_versions_public_view.status', 'approved')
        .order('created_at', {
          ascending: false,
          referencedTable: 'article_versions_public_view',
        })
        .limit(1, { referencedTable: 'article_versions_public_view' })
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

export type PaginatedArticlesParams = {
  page: number;
  limit: number;
  category: string | null;
  search: string | null;
  sortBy: string;
  sortOrder: string;
};

export type PaginatedArticlesData = {
  articles: ArticleListItem[];
  total_count: number;
  current_page: number;
  total_pages: number;
  categories: Category[];
  has_next: boolean;
  has_prev: boolean;
};

export async function getPaginatedArticles({
  page,
  limit,
  category,
  search,
  sortBy,
  sortOrder,
}: PaginatedArticlesParams): Promise<PaginatedArticlesData> {
  const supabase = getPublicReadClient();
  if (!supabase) {
    return {
      articles: [],
      total_count: 0,
      current_page: 1,
      total_pages: 0,
      categories: [],
      has_next: false,
      has_prev: false,
    };
  }

  const offset = (page - 1) * limit;

  return cached(
    ['api', 'articles', page, limit, category ?? 'all', search ?? '', sortBy, sortOrder],
    async () => {
      let query = supabase
        .from('articles')
        .select(ARTICLE_LIST_SELECT)
        .eq('article_versions_public_view.status', 'approved')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (category && category !== 'all') {
        query = query.eq('category_id', category);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data: articles, error: articlesError } = await query;

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        throw new Error('Failed to fetch articles');
      }

      let countQuery = supabase
        .from('articles')
        .select('id, article_versions_public_view!inner(id)', { count: 'exact', head: true })
        .eq('article_versions_public_view.status', 'approved');

      if (category && category !== 'all') {
        countQuery = countQuery.eq('category_id', category);
      }

      if (search) {
        countQuery = countQuery.ilike('title', `%${search}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) {
        console.error('Error counting articles:', countError);
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      return {
        articles: (articles || []) as unknown as ArticleListItem[],
        total_count: count || 0,
        current_page: page,
        total_pages: Math.ceil((count || 0) / limit),
        categories: (categories || []) as unknown as Category[],
        has_next: offset + limit < (count || 0),
        has_prev: page > 1,
      };
    },
    {
      revalidate: 30,
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

export async function incrementArticleViewCount(articleId: string): Promise<void> {
  const adminClient = supabaseAdmin as unknown as SupabaseClient<Database> | undefined;
  if (!adminClient) return;

  const { error } = await adminClient.rpc('increment_article_view_count', {
    p_article_id: articleId,
  });

  if (error) {
    console.error('Error incrementing article view count:', error);
  }
}
