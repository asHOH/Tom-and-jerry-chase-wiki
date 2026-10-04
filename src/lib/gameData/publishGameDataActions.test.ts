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

  it('should invalidate public actions after a public replay row is published', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 'action-1', is_public: true, status: 'pending' }],
        error: null,
      }),
    };

    await publishGameDataActions(supabase as never, [{ entityType: 'characters', entries: [] }]);

    expect(invalidatePublicGameDataActionsCacheMock).toHaveBeenCalledTimes(1);
    expect(invalidatePublicGameDataActionsCacheMock).toHaveBeenCalledWith(['characters']);
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

  it('invalidates completed public domains if a later publication fails', async () => {
    const supabase = {
      rpc: jest
        .fn()
        .mockResolvedValueOnce({
          data: [{ id: 'item-1', is_public: true, status: 'approved' }],
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: new Error('publish failed') }),
    };
    await expect(
      publishGameDataActions(supabase as never, [
        { entityType: 'items', entries: [] },
        { entityType: 'maps', entries: [] },
      ])
    ).rejects.toThrow('Failed to publish actions for maps');
    expect(invalidatePublicGameDataActionsCacheMock).toHaveBeenCalledWith(['items']);
  });
});
