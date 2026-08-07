import type { Route } from 'next';

export const ARTICLE_LIST_PAGE_SIZE = 18;

const MAX_ARTICLE_LIST_PAGE = 10_000;
const MAX_ARTICLE_LIST_CATEGORIES = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ArticleListSort = 'created_at' | 'title' | 'view_count';
export type ArticleListOrder = 'asc' | 'desc';

export type ArticleListParams = {
  page: number;
  categoryIds: string[];
  sortBy: ArticleListSort;
  sortOrder: ArticleListOrder;
};

export type ArticleListSearchParams = {
  page?: string | string[] | undefined;
  category?: string | string[] | undefined;
  sort?: string | string[] | undefined;
  order?: string | string[] | undefined;
};

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export function normalizeArticleListParams(
  searchParams: ArticleListSearchParams
): ArticleListParams {
  const rawPage = firstValue(searchParams.page);
  const parsedPage = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage >= 1
      ? Math.min(parsedPage, MAX_ARTICLE_LIST_PAGE)
      : 1;

  const rawSort = firstValue(searchParams.sort);
  const sortBy: ArticleListSort =
    rawSort === 'title' || rawSort === 'view_count' ? rawSort : 'created_at';
  const sortOrder: ArticleListOrder = firstValue(searchParams.order) === 'asc' ? 'asc' : 'desc';

  const validCategoryIds = (firstValue(searchParams.category) ?? '')
    .split(',')
    .map((categoryId) => categoryId.trim().toLowerCase())
    .filter((categoryId) => UUID_PATTERN.test(categoryId));
  const categoryIds = [...new Set(validCategoryIds)].slice(0, MAX_ARTICLE_LIST_CATEGORIES).sort();

  return { page, categoryIds, sortBy, sortOrder };
}

export function buildArticleListHref(params: ArticleListParams): Route {
  const searchParams = new URLSearchParams();

  if (params.page > 1) searchParams.set('page', String(params.page));
  if (params.categoryIds.length > 0) {
    searchParams.set('category', [...new Set(params.categoryIds)].sort().join(','));
  }
  if (params.sortBy !== 'created_at') searchParams.set('sort', params.sortBy);
  if (params.sortOrder !== 'desc') searchParams.set('order', params.sortOrder);

  const query = searchParams.toString();
  return (query ? `/articles?${query}` : '/articles') as Route;
}
