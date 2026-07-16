import { invalidatePublicGameDataActionsCache } from './publicActionsCache';
import { publishGameDataActions } from './publishGameDataActions';

jest.mock('./publicActionsCache', () => ({
  invalidatePublicGameDataActionsCache: jest.fn(),
}));

const invalidatePublicGameDataActionsCacheMock = jest.mocked(invalidatePublicGameDataActionsCache);

describe('publishGameDataActions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should invalidate public actions after a reviewer or coordinator publishes one', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 'action-1', is_public: true, status: 'approved' }],
        error: null,
      }),
    };

    await publishGameDataActions(supabase as never, [{ entityType: 'characters', entries: [] }]);

    expect(invalidatePublicGameDataActionsCacheMock).toHaveBeenCalledTimes(1);
  });

  it('should keep the cache when publishing creates pending actions', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 'action-1', is_public: false, status: 'pending' }],
        error: null,
      }),
    };

    await publishGameDataActions(supabase as never, [{ entityType: 'characters', entries: [] }]);

    expect(invalidatePublicGameDataActionsCacheMock).not.toHaveBeenCalled();
  });
});
