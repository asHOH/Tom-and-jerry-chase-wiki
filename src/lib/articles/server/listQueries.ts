import 'server-only';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { cached } from '@/lib/serverCache';
import type {
  Article as ArticleListItem,
  ArticleListPageData,
  ArticlesData,
  Category,
} from '@/data/types';

import { ARTICLE_LIST_PAGE_SIZE, type ArticleListParams } from '../listParams';
import { getPublicReadClient } from './readClient';

const ARTICLE_FULL_LIST_SELECT = `
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

const ARTICLE_PAGE_SELECT = `
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
  current_version:article_versions_public_view!articles_current_version_id_fkey!inner (
    id,
    excerpt,
    created_at,
    status
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
        .select(ARTICLE_FULL_LIST_SELECT)
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

export async function getArticleListPage({
  page,
  categoryIds,
  sortBy,
  sortOrder,
}: ArticleListParams): Promise<ArticleListPageData> {
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

  const offset = (page - 1) * ARTICLE_LIST_PAGE_SIZE;

  return cached(
    ['articles', 'list-page', page, categoryIds.join(','), sortBy, sortOrder],
    async () => {
      let query = supabase
        .from('articles')
        .select(ARTICLE_PAGE_SELECT, { count: 'exact' })
        .not('current_version_id', 'is', null)
        .eq('current_version.status', 'approved')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .order('id', { ascending: true })
        .range(offset, offset + ARTICLE_LIST_PAGE_SIZE - 1);

      if (categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
      }

      const categoriesQuery = supabase.from('categories').select('id, name').order('name');
      const [
        { data: articles, error: articlesError, count },
        { data: categories, error: categoriesError },
      ] = await Promise.all([query, categoriesQuery]);

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        throw new Error('Failed to fetch articles');
      }

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      const totalCount = count ?? 0;

      return {
        articles: (articles ?? []) as unknown as ArticleListItem[],
        total_count: totalCount,
        current_page: page,
        total_pages: Math.ceil(totalCount / ARTICLE_LIST_PAGE_SIZE),
        categories: (categories || []) as unknown as Category[],
        has_next: offset + ARTICLE_LIST_PAGE_SIZE < totalCount,
        has_prev: page > 1,
      };
    },
    {
      revalidate: 30,
      tags: [CACHE_TAGS.articles, CACHE_TAGS.categories],
    }
  );
}
