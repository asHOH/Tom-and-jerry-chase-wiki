import { revalidateTag } from 'next/cache';

import { publishGameDataActions } from './publishGameDataActions';

jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

jest.mock('./publicActions', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));

const revalidateTagMock = jest.mocked(revalidateTag);

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

    expect(revalidateTagMock).toHaveBeenCalledWith('public-game-data-actions', 'max');
  });

  it('should keep the cache when publishing creates pending actions', async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({
        data: [{ id: 'action-1', is_public: false, status: 'pending' }],
        error: null,
      }),
    };

    await publishGameDataActions(supabase as never, [{ entityType: 'characters', entries: [] }]);

    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
