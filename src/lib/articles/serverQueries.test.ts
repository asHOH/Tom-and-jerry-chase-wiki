import { supabaseAdmin } from '@/lib/supabase/admin';

import {
  getArticleDetailData,
  getArticleHistory,
  getArticlesPageData,
  getEmbeddedArticlesForCharacter,
  getPaginatedArticles,
  incrementArticleViewCount,
} from './serverQueries';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/serverCache', () => ({
  cached: (
    _keyParts: Array<string | number | boolean | null | undefined>,
    fn: () => Promise<unknown>
  ) => fn(),
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

function createThenableQuery<T>(result: T) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    ilike: jest.fn(),
    then: jest.fn((resolve: (value: T) => unknown) => Promise.resolve(resolve(result))),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.ilike.mockReturnValue(query);

  return query;
}

function createSingleQuery<T>(result: T) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.single.mockResolvedValue(result);

  return query;
}

describe('serverQueries', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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

  it('should return paginated articles with filters and categories', async () => {
    const listQuery = createThenableQuery({
      data: [{ id: 'article-1', title: 'Guide' }],
      error: null,
    });
    const countQuery = createThenableQuery({
      count: 20,
      error: null,
    });
    const categoryQuery = {
      select: jest.fn(),
      order: jest.fn(),
    };

    categoryQuery.select.mockReturnValue(categoryQuery);
    categoryQuery.order.mockResolvedValue({
      data: [{ id: 'category-1', name: 'Tips' }],
      error: null,
    });

    mockSupabaseAdmin.from
      .mockImplementationOnce(() => listQuery)
      .mockImplementationOnce(() => countQuery)
      .mockImplementationOnce(() => categoryQuery);

    await expect(
      getPaginatedArticles({
        page: 2,
        limit: 5,
        category: 'category-1',
        search: 'tom',
        sortBy: 'created_at',
        sortOrder: 'asc',
      })
    ).resolves.toEqual({
      articles: [{ id: 'article-1', title: 'Guide' }],
      total_count: 20,
      current_page: 2,
      total_pages: 4,
      categories: [{ id: 'category-1', name: 'Tips' }],
      has_next: true,
      has_prev: true,
    });

    expect(listQuery.order).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(listQuery.range).toHaveBeenCalledWith(5, 9);
    expect(listQuery.eq).toHaveBeenCalledWith('category_id', 'category-1');
    expect(listQuery.ilike).toHaveBeenCalledWith('title', '%tom%');
    expect(countQuery.select).toHaveBeenCalledWith('id, article_versions_public_view!inner(id)', {
      count: 'exact',
      head: true,
    });
    expect(countQuery.eq).toHaveBeenCalledWith('category_id', 'category-1');
    expect(countQuery.ilike).toHaveBeenCalledWith('title', '%tom%');
    expect(categoryQuery.order).toHaveBeenCalledWith('name');
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

  it('should return article detail data with the latest approved version', async () => {
    const articleQuery = createSingleQuery({
      data: {
        id: 'article-1',
        title: 'Guide',
        category_id: 'category-1',
        author_id: 'user-1',
        created_at: '2026-01-01',
        view_count: 3,
        categories: { name: 'Tips' },
        users_public_view: { nickname: 'Alice' },
      },
      error: null,
    });
    const versionQuery = createSingleQuery({
      data: {
        id: 'version-1',
        content: '<p>Guide content</p>',
        created_at: '2026-01-02',
        editor_id: 'user-2',
        users_public_view: { nickname: 'Bob' },
      },
      error: null,
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
      if (table === 'article_versions_public_view') return versionQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getArticleDetailData('article-1')).resolves.toEqual({
      article: {
        id: 'article-1',
        title: 'Guide',
        category_id: 'category-1',
        author_id: 'user-1',
        created_at: '2026-01-01',
        view_count: 3,
        categories: { name: 'Tips' },
        users_public_view: { nickname: 'Alice' },
        latest_version: {
          id: 'version-1',
          content: '<p>Guide content</p>',
          created_at: '2026-01-02',
          editor_id: 'user-2',
          users_public_view: { nickname: 'Bob' },
        },
      },
    });
    expect(articleQuery.eq).toHaveBeenCalledWith('id', 'article-1');
    expect(versionQuery.eq).toHaveBeenCalledWith('article_id', 'article-1');
    expect(versionQuery.eq).toHaveBeenCalledWith('status', 'approved');
    expect(versionQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(versionQuery.limit).toHaveBeenCalledWith(1);
  });

  it('should return validation details for invalid article detail payloads', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const articleQuery = createSingleQuery({
      data: {
        id: 'article-1',
        title: '',
        category_id: 'category-1',
        author_id: 'user-1',
        created_at: '2026-01-01',
        categories: { name: 'Tips' },
        users_public_view: { nickname: 'Alice' },
      },
      error: null,
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    try {
      await expect(getArticleDetailData('article-1')).resolves.toEqual({
        error: 'Article data invalid',
        details: [{ path: 'title', message: 'Too small: expected string to have >=1 characters' }],
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('should return article history with approved versions', async () => {
    const articleQuery = createSingleQuery({
      data: {
        id: 'article-1',
        title: 'Guide',
        categories: { name: 'Tips' },
      },
      error: null,
    });
    const versionQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    };

    versionQuery.select.mockReturnValue(versionQuery);
    versionQuery.eq.mockReturnValue(versionQuery);
    versionQuery.order.mockResolvedValue({
      data: [
        {
          id: 'version-2',
          content: '<p>New</p>',
          created_at: '2026-01-02',
          editor_id: 'user-2',
          status: 'approved',
          commit_message: 'Update article',
          users: { nickname: 'Bob' },
        },
        {
          id: 'version-1',
          content: '<p>Old</p>',
          created_at: '2026-01-01',
          editor_id: 'user-1',
          status: 'approved',
          commit_message: null,
          users: { nickname: 'Alice' },
        },
      ],
      error: null,
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
      if (table === 'article_versions_public_view') return versionQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    await expect(getArticleHistory('article-1')).resolves.toEqual({
      article: {
        id: 'article-1',
        title: 'Guide',
        categories: { name: 'Tips' },
      },
      versions: [
        {
          id: 'version-2',
          content: '<p>New</p>',
          created_at: '2026-01-02',
          editor_id: 'user-2',
          status: 'approved',
          commit_message: 'Update article',
          users: { nickname: 'Bob' },
        },
        {
          id: 'version-1',
          content: '<p>Old</p>',
          created_at: '2026-01-01',
          editor_id: 'user-1',
          status: 'approved',
          commit_message: null,
          users: { nickname: 'Alice' },
        },
      ],
      total_count: 2,
    });
    expect(articleQuery.eq).toHaveBeenCalledWith('id', 'article-1');
    expect(versionQuery.eq).toHaveBeenCalledWith('article_id', 'article-1');
    expect(versionQuery.eq).toHaveBeenCalledWith('status', 'approved');
    expect(versionQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should increment article view count through the article RPC', async () => {
    await incrementArticleViewCount('article-1');

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('increment_article_view_count', {
      p_article_id: 'article-1',
    });
  });
});
