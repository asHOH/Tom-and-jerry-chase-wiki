import type { NextRequest } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

import { GET } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: { articles: 'articles' },
}));

jest.mock('@/lib/serverCache', () => ({
  cached: (
    _keyParts: Array<string | number | boolean | null | undefined>,
    fn: () => Promise<unknown>
  ) => fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
}));

const adminFromMock = jest.mocked(supabaseAdmin!.from);
const adminRpcMock = jest.mocked(supabaseAdmin!.rpc);

function createSingleQuery(result: unknown) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.single.mockResolvedValue(result);

  return query;
}

const createRequest = () =>
  ({ url: 'https://example.test/api/articles/preview?token=preview-token' }) as NextRequest;

const completeVersion = {
  id: 'version-1',
  article_id: 'article-1',
  content: '<p>预览内容</p>',
  editor_id: 'editor-1',
  status: 'pending',
  preview_token: 'preview-token',
  created_at: '2026-08-07T00:00:00.000Z',
  commit_message: '更新元数据',
  proposed_title: '新标题',
  proposed_category_id: 'category-new',
  proposed_character_id: '汤姆',
};

const currentArticle = {
  id: 'article-1',
  title: '旧标题',
  category_id: 'category-old',
  character_id: '杰瑞',
  author_id: 'author-1',
  created_at: '2026-01-01T00:00:00.000Z',
  categories: { name: '旧分类' },
  users_public_view: { nickname: '作者' },
};

describe('article preview route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses the complete proposed metadata and resolves the proposed category name', async () => {
    adminRpcMock.mockResolvedValue({ data: [completeVersion], error: null } as never);

    const articleQuery = createSingleQuery({ data: currentArticle, error: null });
    const editorQuery = createSingleQuery({
      data: { id: 'editor-1', nickname: '编辑者' },
      error: null,
    });
    const categoryQuery = createSingleQuery({ data: { name: '新分类' }, error: null });

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery as never;
      if (table === 'users_public_view') return editorQuery as never;
      if (table === 'categories') return categoryQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preview.article).toMatchObject({
      title: '新标题',
      category_id: 'category-new',
      character_id: '汤姆',
      categories: { name: '新分类' },
      version: { content: '<p>预览内容</p>' },
    });
    expect(categoryQuery.eq).toHaveBeenCalledWith('id', 'category-new');
  });

  it('preserves an intentional null character binding from a complete snapshot', async () => {
    adminRpcMock.mockResolvedValue({
      data: [
        {
          ...completeVersion,
          proposed_category_id: 'category-old',
          proposed_character_id: null,
        },
      ],
      error: null,
    } as never);

    const articleQuery = createSingleQuery({ data: currentArticle, error: null });
    const editorQuery = createSingleQuery({
      data: { id: 'editor-1', nickname: '编辑者' },
      error: null,
    });

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery as never;
      if (table === 'users_public_view') return editorQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.preview.article.character_id).toBeNull();
    expect(body.preview.article.categories).toEqual({ name: '旧分类' });
  });

  it('falls back to all parent metadata for a legacy incomplete snapshot', async () => {
    adminRpcMock.mockResolvedValue({
      data: [
        {
          ...completeVersion,
          proposed_title: null,
          proposed_category_id: null,
          proposed_character_id: null,
        },
      ],
      error: null,
    } as never);

    const articleQuery = createSingleQuery({ data: currentArticle, error: null });
    const editorQuery = createSingleQuery({
      data: { id: 'editor-1', nickname: '编辑者' },
      error: null,
    });

    adminFromMock.mockImplementation((table: string) => {
      if (table === 'articles') return articleQuery as never;
      if (table === 'users_public_view') return editorQuery as never;
      throw new Error(`Unexpected table: ${table}`);
    });

    const response = await GET(createRequest());
    const body = await response.json();

    expect(body.preview.article).toMatchObject({
      title: '旧标题',
      category_id: 'category-old',
      character_id: '杰瑞',
      categories: { name: '旧分类' },
      version: { editor: { id: 'editor-1', nickname: '编辑者' } },
    });
  });
});
