import 'server-only';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import type { Article as ArticleListItem, ArticlesData, Category } from '@/data/types';

import { getPublicReadClient } from './readClient';

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
  current_version:article_versions_public_view!articles_current_version_id_fkey (
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

export async function getArticlesPageData(): Promise<ArticlesData> {
  const supabase = getPublicReadClient();
  if (!supabase) return { articles: [], categories: [] };

  return cached(
    ['articles', 'page-data'],
    async () => {
      const { data: articles } = await supabase
        .from('articles')
        .select(ARTICLE_LIST_SELECT)
        .not('current_version_id', 'is', null)
        .order('created_at');

      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      return {
        articles: (articles ?? []) as unknown as ArticleListItem[],
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
        .not('current_version_id', 'is', null)
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
        .select('id', { count: 'exact', head: true })
        .not('current_version_id', 'is', null);

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
        articles: (articles ?? []) as unknown as ArticleListItem[],
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
