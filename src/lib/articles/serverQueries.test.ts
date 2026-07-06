import { supabaseAdmin } from '@/lib/supabase/admin';

import {
  getArticlesPageData,
  getEmbeddedArticlesForCharacter,
  incrementArticleViewCount,
} from './serverQueries';

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
    rpc: jest.fn(),
  },
}));

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: undefined,
}));

const mockSupabaseAdmin = supabaseAdmin as unknown as { from: jest.Mock; rpc: jest.Mock };

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
    mockSupabaseAdmin.rpc.mockResolvedValue({ error: null });
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

  it('should return sanitized embedded articles for a character', async () => {
    const articleQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    };
    const versionQuery = {
      select: jest.fn(),
      in: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    };

    articleQuery.select.mockReturnValue(articleQuery);
    articleQuery.eq.mockReturnValue(articleQuery);
    articleQuery.order.mockResolvedValue({
      data: [
        {
          id: 'article-1',
          title: 'Guide',
          created_at: '2026-01-01',
          view_count: 12,
          categories: { name: 'Tips' },
          users_public_view: { nickname: 'Alice' },
        },
        {
          id: 'article-2',
          title: 'No approved content',
          created_at: '2026-01-03',
          view_count: 3,
          categories: null,
          users_public_view: null,
        },
      ],
    });

    versionQuery.select.mockReturnValue(versionQuery);
    versionQuery.in.mockReturnValue(versionQuery);
    versionQuery.eq.mockReturnValue(versionQuery);
    versionQuery.order.mockResolvedValue({
      data: [
        {
          article_id: 'article-1',
          content: '<h1>Remove me</h1><p>Keep me</p>',
          created_at: '2026-01-02',
        },
        {
          article_id: 'article-1',
          content: '<p>Older content</p>',
          created_at: '2026-01-01',
        },
        {
          article_id: 'article-2',
          content: null,
          created_at: '2026-01-03',
        },
      ],
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
      if (table === 'article_versions_public_view') return versionQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getEmbeddedArticlesForCharacter('tom')).resolves.toEqual([
      {
        id: 'article-1',
        title: 'Guide',
        content: 'Remove me<p>Keep me</p>',
        authors: ['Alice'],
        createdAt: '2026-01-02',
        viewCount: 12,
        categoryName: 'Tips',
        articleCreatedAt: '2026-01-01',
      },
    ]);
    expect(articleQuery.eq).toHaveBeenCalledWith('character_id', 'tom');
    expect(versionQuery.in).toHaveBeenCalledWith('article_id', ['article-1', 'article-2']);
  });

  it('should increment article view count through the article RPC', async () => {
    await incrementArticleViewCount('article-1');

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('increment_article_view_count', {
      p_article_id: 'article-1',
    });
  });
});
