import { resolveArticleCharacterForWrite } from '@/lib/articles/articleWriteRelations';
import { requirePermission } from '@/lib/auth/requirePermission';
import { requireNotBlocked } from '@/lib/blocks/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { POST } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
jest.mock('next/server', () => ({ NextResponse: { json: jest.fn(jsonResponse) } }));
jest.mock('@/lib/articles/articleWriteRelations', () => ({
  ArticleWriteValidationError: class ArticleWriteValidationError extends Error {},
  resolveArticleCharacterForWrite: jest.fn(),
}));
jest.mock('@/lib/auth/requirePermission', () => ({ requirePermission: jest.fn() }));
jest.mock('@/lib/blocks/server', () => ({
  getRequestIp: jest.fn(() => null),
  requireNotBlocked: jest.fn(),
}));
jest.mock('@/lib/rateLimit', () => ({ checkRateLimit: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn(), rpc: jest.fn() },
}));

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const requirePermissionMock = jest.mocked(requirePermission);
const requireNotBlockedMock = jest.mocked(requireNotBlocked);
const checkRateLimitMock = jest.mocked(checkRateLimit);
const resolveArticleCharacterForWriteMock = jest.mocked(resolveArticleCharacterForWrite);
const adminFromMock = jest.mocked(supabaseAdmin.from);
const adminRpcMock = jest.mocked(supabaseAdmin.rpc);

const versionQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
};

const createRequest = (body: unknown) => ({ json: async () => body }) as Request;

describe('pending article edit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ allowed: true });
    requirePermissionMock.mockResolvedValue({ userId: 'editor-1' } as never);
    requireNotBlockedMock.mockResolvedValue(null);
    resolveArticleCharacterForWriteMock.mockResolvedValue('Tom');
    versionQuery.select.mockReturnValue(versionQuery);
    versionQuery.eq.mockReturnValue(versionQuery);
    versionQuery.single.mockResolvedValue({ data: { article_id: 'article-1' }, error: null });
    adminFromMock.mockReturnValue(versionQuery as never);
    adminRpcMock.mockResolvedValue({ data: null, error: null } as never);
  });

  it('validates and forwards character metadata', async () => {
    const response = await POST(
      createRequest({
        title: '测试文章',
        category: CATEGORY_ID,
        content: '文章内容',
        character_id: 'Tom',
      }),
      { params: Promise.resolve({ versionId: 'version-1' }) }
    );

    expect(response.status).toBe(200);
    expect(adminRpcMock).toHaveBeenCalledWith(
      'prepared_update_pending_article',
      expect.objectContaining({ p_character_id: 'Tom', p_update_character: true })
    );
  });

  it('returns 429 before authorizing', async () => {
    checkRateLimitMock.mockResolvedValue({
      allowed: false,
      headers: { 'Retry-After': '60' },
      retryAfterSeconds: 60,
    });

    const response = await POST(createRequest(null), {
      params: Promise.resolve({ versionId: 'version-1' }),
    });

    expect(response.status).toBe(429);
    expect(requirePermissionMock).not.toHaveBeenCalled();
  });
});
