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
  readError = null as { message: string } | null,
  writeError = null as { message: string } | null,
} = {}) => {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: row, error: readError }),
    upsert: jest.fn(),
    single: jest.fn().mockResolvedValue({ data: row, error: writeError }),
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

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('rejects unauthenticated requests before loading preferences or permissions', async () => {
    const supabase = buildSupabaseClient({ userId: '' });
    createClientMock.mockResolvedValue(supabase as never);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(response.status).toBe(401);
    expect(loadPermissionGrantsMock).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty object', async () => ({})],
    ['a non-boolean preference', async () => ({ discussionCommentEnabled: 'yes' })],
    ['invalid JSON', async () => Promise.reject(new SyntaxError('Invalid JSON'))],
  ])('rejects %s request body', async (_description, json) => {
    const supabase = buildSupabaseClient();
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([]);

    const response = await PATCH({ json } as never);

    await expect(response.json()).resolves.toEqual({ error: 'Invalid request body' });
    expect(response.status).toBe(400);
    expect(supabase.query.upsert).not.toHaveBeenCalled();
  });

  it('returns a structured error when loading preferences fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const supabase = buildSupabaseClient({ readError: { message: 'read failed' } });
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([]);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load notification preferences',
    });
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load notification subscription settings:',
      { message: 'read failed' }
    );
  });

  it('returns a structured error when updating preferences fails', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const supabase = buildSupabaseClient({ writeError: { message: 'write failed' } });
    createClientMock.mockResolvedValue(supabase as never);
    loadPermissionGrantsMock.mockResolvedValue([]);

    const response = await PATCH({
      json: async () => ({ discussionCommentEnabled: true }),
    } as never);

    await expect(response.json()).resolves.toEqual({
      error: 'Failed to update notification preferences',
    });
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to update notification subscription settings:',
      { message: 'write failed' }
    );
  });
});
