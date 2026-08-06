import { supabaseAdmin } from '@/lib/supabase/admin';

import {
  getApprovedArticleVersion,
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
  not: jest.fn(),
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
    in: jest.fn(),
    not: jest.fn(),
    order: jest.fn(),
    range: jest.fn(),
    ilike: jest.fn(),
    then: jest.fn((resolve: (value: T) => unknown) => Promise.resolve(resolve(result))),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.not.mockReturnValue(query);
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
    query.not.mockReturnValue(query);
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

  it('should select article list previews through the explicit current-version pointer', async () => {
    await getArticlesPageData();

    expect(query.not).toHaveBeenCalledWith('current_version_id', 'is', null);
    expect(query.order).toHaveBeenCalledWith('created_at');
  });

  it('should return paginated articles with filters and categories', async () => {
    const listQuery = createThenableQuery({
      data: [
        {
          id: 'article-1',
          title: 'Guide',
          current_version: {
            id: 'version-1',
            content: '<p>Current guide</p>',
            created_at: '2026-01-02',
            status: 'approved',
            editor_id: 'user-1',
            users_public_view: { nickname: 'Alice' },
          },
        },
      ],
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
      articles: [
        {
          id: 'article-1',
          title: 'Guide',
          current_version: {
            id: 'version-1',
            content: '<p>Current guide</p>',
            created_at: '2026-01-02',
            status: 'approved',
            editor_id: 'user-1',
            users_public_view: { nickname: 'Alice' },
          },
        },
      ],
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
    expect(countQuery.select).toHaveBeenCalledWith('id', {
      count: 'exact',
      head: true,
    });
    expect(countQuery.not).toHaveBeenCalledWith('current_version_id', 'is', null);
    expect(countQuery.eq).toHaveBeenCalledWith('category_id', 'category-1');
    expect(countQuery.ilike).toHaveBeenCalledWith('title', '%tom%');
    expect(categoryQuery.order).toHaveBeenCalledWith('name');
  });

  it('should return sanitized embedded articles for a character', async () => {
    const articleQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      not: jest.fn(),
      order: jest.fn(),
    };
    articleQuery.select.mockReturnValue(articleQuery);
    articleQuery.eq.mockReturnValue(articleQuery);
    articleQuery.not.mockReturnValue(articleQuery);
    articleQuery.order.mockResolvedValue({
      data: [
        {
          id: 'article-1',
          title: 'Guide',
          created_at: '2026-01-01',
          view_count: 12,
          categories: { name: 'Tips' },
          users_public_view: { nickname: 'Alice' },
          current_version: {
            content: '<h1>Remove me</h1><p>Keep me</p>',
            created_at: '2026-01-02',
          },
        },
        {
          id: 'article-2',
          title: 'No approved content',
          created_at: '2026-01-03',
          view_count: 3,
          categories: null,
          users_public_view: null,
          current_version: {
            content: null,
            created_at: '2026-01-03',
          },
        },
      ],
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
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
    expect(articleQuery.not).toHaveBeenCalledWith('current_version_id', 'is', null);
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
        current_version: {
          id: 'version-1',
          content: '<p>Guide content</p>',
          created_at: '2026-01-02',
          editor_id: 'user-2',
          users_public_view: { nickname: 'Bob' },
        },
      },
      error: null,
    });

    mockSupabaseAdmin.from.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery;
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
  });

  it('should resolve the latest approved article version through the current pointer', async () => {
    const articleQuery = createSingleQuery({
      data: {
        current_version: {
          id: 'version-older-submission',
          content: '<p>Approved later</p>',
          created_at: '2026-01-01',
          editor_id: 'user-2',
          users_public_view: { nickname: 'Bob' },
        },
      },
      error: null,
    });

    mockSupabaseAdmin.from.mockReturnValue(articleQuery);

    await expect(getApprovedArticleVersion({ articleId: 'article-1' })).resolves.toEqual({
      id: 'version-older-submission',
      content: '<p>Approved later</p>',
      created_at: '2026-01-01',
      editor_id: 'user-2',
      users_public_view: { nickname: 'Bob' },
    });
    expect(articleQuery.select).toHaveBeenCalledWith(
      expect.stringContaining(
        'current_version:article_versions_public_view!articles_current_version_id_fkey'
      )
    );
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
    expect(versionQuery.order).toHaveBeenCalledWith('publication_revision', { ascending: false });
  });

  it('should increment article view count through the article RPC', async () => {
    await incrementArticleViewCount('article-1');

    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('increment_article_view_count', {
      p_article_id: 'article-1',
    });
  });
});
