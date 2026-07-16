import { revalidateTag } from 'next/cache';

import {
  invalidatePublicGameDataActionsCache,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from './publicActionsCache';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

const revalidateTagMock = jest.mocked(revalidateTag);

describe('publicActionsCache', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should expire cached public actions before the next read', () => {
    invalidatePublicGameDataActionsCache();

    expect(revalidateTagMock).toHaveBeenCalledWith(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, {
      expire: 0,
    });
  });
});
