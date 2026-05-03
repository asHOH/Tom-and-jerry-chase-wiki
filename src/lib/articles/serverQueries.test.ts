import { supabaseAdmin } from '@/lib/supabase/admin';

import { getArticlesPageData } from './serverQueries';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/serverCache', () => ({
  cached: (_keyParts: string[], fn: () => Promise<unknown>) => fn(),
}));

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: {
    articles: 'articles',
    categories: 'categories',
    article: (articleId: string) => `article:${articleId}`,
    articleVersions: (articleId: string) => `article-versions:${articleId}`,
  },
}));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
};

const categoriesQuery = {
  select: jest.fn(),
  order: jest.fn(),
};

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: undefined,
}));

const mockSupabaseAdmin = supabaseAdmin as unknown as { from: jest.Mock };

describe('serverQueries', () => {
  beforeEach(() => {
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockReturnValue(query);

    categoriesQuery.select.mockReturnValue(categoriesQuery);
    categoriesQuery.order.mockResolvedValue({ data: [] });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return query;
      if (table === 'categories') return categoriesQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('should select the newest approved embedded version for article list previews', async () => {
    await getArticlesPageData();

    expect(query.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
      referencedTable: 'article_versions_public_view',
    });
    expect(query.limit).toHaveBeenCalledWith(1, {
      referencedTable: 'article_versions_public_view',
    });
  });
});
