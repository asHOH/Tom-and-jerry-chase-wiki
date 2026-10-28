import type { NextRequest } from 'next/server';

import { canAccess } from '@/lib/auth/permissions';
import { supabaseAdmin } from '@/lib/supabase/admin';

import { GET } from './route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));
jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: { claims: { sub: 'author' } } }) },
  }),
}));
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: jest.fn() } }));
jest.mock('@/lib/auth/requirePermission', () => ({ loadPermissionGrants: async () => [] }));
jest.mock('@/lib/auth/permissions', () => ({ canAccess: jest.fn(() => true) }));

const articleQuery = { select: jest.fn(), eq: jest.fn(), single: jest.fn() };
const pendingQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  maybeSingle: jest.fn(),
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(canAccess).mockReturnValue(true);
  articleQuery.select.mockReturnValue(articleQuery);
  articleQuery.eq.mockReturnValue(articleQuery);
  articleQuery.single.mockResolvedValue({
    data: {
      id: 'a',
      title: 'Current metadata',
      category_id: 'c',
      character_id: 'Tom',
      author_id: 'author',
      created_at: '',
      current_version: {
        id: 'published-first-submitted',
        content: '<p>Current content</p>',
        created_at: '2026-01-01',
      },
    },
    error: null,
  });
  for (const method of ['select', 'eq', 'order', 'limit'] as const)
    pendingQuery[method].mockReturnValue(pendingQuery);
  pendingQuery.maybeSingle.mockResolvedValue({
    data: {
      id: 'pending',
      content: '<p>Pending</p>',
      proposed_title: 'Pending title',
      proposed_category_id: 'c',
      proposed_character_id: null,
      metadata_snapshot_complete: true,
      base_version_id: 'older-publication',
      base_version_known: true,
      draft_revision: 'revision',
    },
    error: null,
  });
  jest
    .mocked(supabaseAdmin!.from)
    .mockImplementation(
      (table: string) => (table === 'articles' ? articleQuery : pendingQuery) as never
    );
});

it('returns one published snapshot and retains pending origin and explicit null metadata', async () => {
  const response = await GET({} as NextRequest, { params: Promise.resolve({ id: 'a' }) });
  expect(await response.json()).toMatchObject({
    edit_sources: {
      approved: {
        version_id: 'published-first-submitted',
        title: 'Current metadata',
        content: '<p>Current content</p>',
      },
      pending_mine: {
        character_id: null,
        base_version_id: 'older-publication',
        base_version_known: true,
        draft_revision: 'revision',
      },
    },
  });
  expect(articleQuery.select).toHaveBeenCalledWith(
    expect.stringContaining('!articles_current_version_id_fkey')
  );
  expect(supabaseAdmin!.from).toHaveBeenCalledTimes(2);
});

it('keeps edit-source reads behind authorization', async () => {
  jest.mocked(canAccess).mockReturnValue(false);
  expect((await GET({} as NextRequest, { params: Promise.resolve({ id: 'a' }) })).status).toBe(403);
  expect(pendingQuery.select).not.toHaveBeenCalled();
});
