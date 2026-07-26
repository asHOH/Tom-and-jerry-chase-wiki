import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { createClient } from '@/lib/supabase/server';

import { GET, PATCH } from './route';

function jsonResponse(body: unknown, init?: { status?: number }): Response {
  return { status: init?.status ?? 200, json: async () => body } as Response;
}

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('@/lib/auth/requirePermission', () => ({
  loadPermissionGrants: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const loadPermissionGrantsMock = jest.mocked(loadPermissionGrants);
const createClientMock = jest.mocked(createClient);

const buildSupabaseClient = ({
  userId = 'user-1',
  row = null as {
    article_version_pending_enabled?: boolean;
    game_data_action_pending_enabled?: boolean;
    discussion_comment_enabled?: boolean;
  } | null,
} = {}) => {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
    upsert: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: row, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.upsert.mockReturnValue(query);

  return {
    auth: {
      getClaims: jest.fn().mockResolvedValue({ data: { claims: { sub: userId } } }),
    },
    from: jest.fn(() => query),
    query,
  };
};

describe('notification preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns default settings and computed availability', async () => {
    const supabase = buildSupabaseClient();
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([
      {
        permission: 'article_version.approve',
        scope: 'global',
        resourceType: null,
        resourceId: null,
      },
    ]);

    const response = await GET();
    const body = (await response.json()) as {
      articleVersionPendingEnabled: boolean;
      gameDataActionPendingEnabled: boolean;
      discussionCommentEnabled: boolean;
      availability: {
        articleVersionPendingAvailable: boolean;
        gameDataActionPendingAvailable: boolean;
        discussionCommentAvailable: boolean;
      };
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      articleVersionPendingEnabled: false,
      gameDataActionPendingEnabled: false,
      discussionCommentEnabled: false,
      availability: {
        articleVersionPendingAvailable: true,
        gameDataActionPendingAvailable: false,
        discussionCommentAvailable: true,
      },
    });
  });

  it('updates allowed preferences', async () => {
    const supabase = buildSupabaseClient({
      row: {
        article_version_pending_enabled: true,
        game_data_action_pending_enabled: false,
        discussion_comment_enabled: false,
      },
    });
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([
      {
        permission: 'article_version.approve',
        scope: 'global',
        resourceType: null,
        resourceId: null,
      },
    ]);

    const response = await PATCH({
      json: async () => ({ articleVersionPendingEnabled: true }),
    } as never);

    expect(response.status).toBe(200);
    expect(supabase.query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        article_version_pending_enabled: true,
        updated_at: expect.any(String),
      }),
      { onConflict: 'user_id' }
    );
  });

  it('rejects unavailable moderator-only preferences', async () => {
    const supabase = buildSupabaseClient();
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([]);

    const response = await PATCH({
      json: async () => ({ articleVersionPendingEnabled: true }),
    } as never);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(403);
    expect(body.error).toBe('Insufficient permissions to update this notification preference');
    expect(supabase.query.upsert).not.toHaveBeenCalled();
  });
});
