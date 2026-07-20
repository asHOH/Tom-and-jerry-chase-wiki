import { createClient } from '@/lib/supabase/server';

import { requirePermission, requirePermissionOrAnonymous } from './requirePermission';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const client = (authenticated: boolean, rows: unknown[]) =>
  ({
    auth: {
      getClaims: jest.fn().mockResolvedValue({
        data: authenticated ? { claims: { sub: 'user-1' } } : null,
      }),
    },
    rpc: jest.fn().mockResolvedValue({ data: rows, error: null }),
  }) as never;

describe('requirePermission', () => {
  it('returns 401 for an unauthenticated caller', async () => {
    mockCreateClient.mockResolvedValue(client(false, []));
    const result = await requirePermission('article.create');
    expect('error' in result && result.error.status).toBe(401);
  });

  it('preserves an anonymous caller for explicitly anonymous-capable routes', async () => {
    mockCreateClient.mockResolvedValue(client(false, []));
    const result = await requirePermissionOrAnonymous('game_data_action.create');
    expect(result).toMatchObject({ userId: null, grants: [] });
    expect('error' in result).toBe(false);
  });

  it('returns 403 when an instance grant does not match the context', async () => {
    mockCreateClient.mockResolvedValue(
      client(true, [
        {
          permission_key: 'article.update_any',
          scope: 'resource',
          resource_type: 'articles',
          resource_id: 'article-1',
        },
      ])
    );
    const result = await requirePermission('article.update_any', {
      resourceType: 'articles',
      resourceId: 'article-2',
    });
    expect('error' in result && result.error.status).toBe(403);
  });

  it('requires every resource in an atomic batch', async () => {
    mockCreateClient.mockResolvedValue(
      client(true, [
        {
          permission_key: 'relation.update',
          scope: 'resource',
          resource_type: 'characters',
          resource_id: 'Tom',
        },
      ])
    );
    const result = await requirePermission('relation.update', [
      { resourceType: 'characters', resourceId: 'Tom' },
      { resourceType: 'characters', resourceId: 'Jerry' },
    ]);
    expect('error' in result && result.error.status).toBe(403);
  });

  it('accepts a matching resource-type grant', async () => {
    mockCreateClient.mockResolvedValue(
      client(true, [
        {
          permission_key: 'comment.moderate',
          scope: 'resource_type',
          resource_type: 'comments/articles',
          resource_id: null,
        },
      ])
    );
    const result = await requirePermission('comment.moderate', {
      resourceType: 'comments/articles',
      resourceId: 'article-1',
    });
    expect('error' in result).toBe(false);
  });
});
