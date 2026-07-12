import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';

import { requireAbility } from '@/lib/auth/requireAbility';
import { sendPushNotification } from '@/lib/push';

const jsonResponse = (body: unknown, init?: { status?: number }) =>
  ({
    status: init?.status ?? 200,
    json: async () => body,
  }) as Response;

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(jsonResponse),
  },
}));

jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

jest.mock('@/lib/gameData/publicActions', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));

jest.mock('@/lib/auth/requireAbility', () => ({
  requireAbility: jest.fn(),
}));

jest.mock('@/lib/push', () => ({
  sendPushNotification: jest.fn(),
}));

const requireAbilityMock = jest.mocked(requireAbility);
const sendPushNotificationMock = jest.mocked(sendPushNotification);
const revalidateTagMock = jest.mocked(revalidateTag);

type SupabaseMockOptions = {
  currentUserId?: string;
  existingStatus?: 'pending' | 'approved' | 'rejected' | 'synced';
  updateError?: { message: string };
};

type RecordQuery = {
  eq: (column: string, value: string) => RecordQuery;
  select: (columns: string) => RecordQuery;
  single: () => Promise<{
    data: {
      created_by: string;
      entity_type: string;
      status: SupabaseMockOptions['existingStatus'];
    };
    error: null;
  }>;
  update: (payload: unknown) => UpdateQuery;
};

type UpdateQuery = {
  eq: (column: string, value: string) => UpdateQuery;
  select: (columns: string) => UpdateQuery;
  single: () => Promise<{
    data: { id: string } | null;
    error: SupabaseMockOptions['updateError'] | null;
  }>;
};

const createSupabaseMock = ({
  currentUserId = 'coordinator-1',
  existingStatus = 'approved',
  updateError,
}: SupabaseMockOptions = {}) => {
  const updatePayloads: unknown[] = [];
  const updateEqCalls: [string, string][] = [];
  const rpc = jest.fn().mockResolvedValue({ error: null });

  const updateQuery: UpdateQuery = {
    eq: (column: string, value: string) => {
      updateEqCalls.push([column, value]);
      return updateQuery;
    },
    select: () => updateQuery,
    single: async () => ({
      data: updateError ? null : { id: 'action-1' },
      error: updateError ?? null,
    }),
  };
  const recordQuery: RecordQuery = {
    eq: () => recordQuery,
    select: () => recordQuery,
    single: async () => ({
      data: {
        created_by: 'user-2',
        entity_type: 'characters',
        status: existingStatus,
      },
      error: null,
    }),
    update: (payload: unknown) => {
      updatePayloads.push(payload);
      return updateQuery;
    },
  };
  const supabase = {
    auth: {
      getClaims: jest.fn().mockResolvedValue({ data: { claims: { sub: currentUserId } } }),
    },
    from: jest.fn(() => recordQuery),
    rpc,
  };

  return {
    supabase,
    updateEqCalls,
    updatePayloads,
  };
};

const createRequest = (action: string, body?: unknown) =>
  ({
    json: async () => body ?? {},
    url: `https://tjwiki.test/api/game-data-actions/moderation/action-1?action=${action}`,
  }) as NextRequest;

describe('game data action moderation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendPushNotificationMock.mockResolvedValue(undefined);
  });

  it('marks approved actions as synced for coordinators', async () => {
    const { POST } = await import('./route');
    const { supabase, updateEqCalls, updatePayloads } = createSupabaseMock();
    requireAbilityMock.mockResolvedValue({ supabase, userId: 'coordinator-1' } as never);

    const response = await POST(createRequest('mark-synced'), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      action: 'mark-synced',
      action_id: 'action-1',
      message: 'Action marked as synced',
    });
    expect(requireAbilityMock).toHaveBeenCalledWith('mark_synced', 'GameDataAction');
    expect(updatePayloads).toEqual([
      {
        is_public: true,
        rejection_reason: null,
        reviewed_at: expect.any(String),
        reviewed_by: 'coordinator-1',
        status: 'synced',
      },
    ]);
    expect(updateEqCalls).toEqual([
      ['id', 'action-1'],
      ['status', 'approved'],
    ]);
    expect(revalidateTagMock).toHaveBeenCalledWith('public-game-data-actions', 'max');
  });

  it('keeps regular approve available to reviewers', async () => {
    const { POST } = await import('./route');
    const { supabase } = createSupabaseMock({ existingStatus: 'pending' });
    requireAbilityMock.mockResolvedValue({ supabase, userId: 'reviewer-1' } as never);

    const response = await POST(createRequest('approve'), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(requireAbilityMock).toHaveBeenCalledWith('approve', 'GameDataAction');
    expect(supabase.rpc).toHaveBeenCalledWith('approve_game_data_action', {
      p_action_id: 'action-1',
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('public-game-data-actions', 'max');
  });

  it('keeps regular reject available to reviewers', async () => {
    const { POST } = await import('./route');
    const { supabase } = createSupabaseMock({ existingStatus: 'pending' });
    requireAbilityMock.mockResolvedValue({ supabase, userId: 'reviewer-1' } as never);

    const response = await POST(createRequest('reject', { reason: '不通过' }), {
      params: Promise.resolve({ actionId: 'action-1' }),
    });

    expect(response.status).toBe(200);
    expect(requireAbilityMock).toHaveBeenCalledWith('approve', 'GameDataAction');
    expect(supabase.rpc).toHaveBeenCalledWith('reject_game_data_action', {
      p_action_id: 'action-1',
      p_reason: '不通过',
    });
  });
});
