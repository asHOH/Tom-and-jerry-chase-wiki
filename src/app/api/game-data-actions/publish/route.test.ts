import { publishAttributedGameDataActions } from '@/lib/gameData/publishGameDataActions';
import { createClient } from '@/lib/supabase/server';

import { POST } from './route';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));
jest.mock('@/lib/gameData/publishGameDataActions', () => {
  const actual = jest.requireActual('@/lib/gameData/publishGameDataActions');
  return { ...actual, publishAttributedGameDataActions: jest.fn() };
});
jest.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { admin: true } }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/config', () => ({ hasSupabasePublicConfig: () => true }));

const publishMock = jest.mocked(publishAttributedGameDataActions);
const createClientMock = jest.mocked(createClient);

function publishRequest(body: unknown, headers: Record<string, string> = {}) {
  return {
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  } as Request;
}

describe('POST /api/game-data-actions/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    publishMock.mockResolvedValue([]);
  });

  it('should attribute an anonymous batch to the validated request IP', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const response = await POST(
      publishRequest(
        {
          actions: [
            { entityType: 'characters', entries: [{ op: 'set' }] },
            { entityType: 'characters', entries: [{ op: 'add' }] },
            { entityType: 'cards', entries: [{ op: 'delete' }] },
          ],
        },
        { 'x-forwarded-for': '2001:db8::1, 198.51.100.2' }
      )
    );

    expect(response.status).toBe(200);
    expect(publishMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        { entityType: 'characters', entries: [{ op: 'set' }, { op: 'add' }] },
        { entityType: 'cards', entries: [{ op: 'delete' }] },
      ],
      { createdBy: null, anonymousIp: '2001:db8::1' },
      undefined
    );
  });

  it('should use the account identity without storing its IP', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    } as never);

    await POST(
      publishRequest(
        { entityType: 'characters', entries: [{ op: 'set' }] },
        { 'cf-connecting-ip': '203.0.113.42' }
      )
    );

    expect(publishMock).toHaveBeenCalledWith(
      expect.anything(),
      [{ entityType: 'characters', entries: [{ op: 'set' }] }],
      { createdBy: 'user-1', anonymousIp: null },
      undefined
    );
  });

  it('should leave attribution empty when no valid address is available', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    await POST(
      publishRequest(
        { entityType: 'characters', entries: [{ op: 'set' }] },
        { 'cf-connecting-ip': 'not-an-ip' }
      )
    );

    expect(publishMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { createdBy: null, anonymousIp: null },
      undefined
    );
  });
});
