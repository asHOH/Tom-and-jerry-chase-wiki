import { revalidateTag } from 'next/cache';

import {
  getPublicGameDataDomainCacheTag,
  invalidatePublicGameDataActionsCache,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from './publicActionsCache';
import { PUBLISHABLE_ENTITY_TYPES } from './publishableEntityTypes';

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
    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      expect(revalidateTagMock).toHaveBeenCalledWith(getPublicGameDataDomainCacheTag(entityType), {
        expire: 0,
      });
    }
  });

  it('expires only affected domains and aggregate readers after a scoped mutation', () => {
    invalidatePublicGameDataActionsCache(['items', 'items', 'maps']);
    expect(revalidateTagMock.mock.calls).toEqual([
      [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, { expire: 0 }],
      [getPublicGameDataDomainCacheTag('items'), { expire: 0 }],
      [getPublicGameDataDomainCacheTag('maps'), { expire: 0 }],
    ]);
  });

  it.each([
    ['1', 'preview', 28800],
    ['1', 'production', 3600],
    ['0', 'preview', 3600],
    [undefined, undefined, 3600],
  ])('uses the correct freshness interval for VERCEL=%s / %s', (vercel, environment, expected) => {
    const previous = process.env;
    try {
      process.env = { ...previous, VERCEL: vercel, VERCEL_ENV: environment };
      jest.isolateModules(() => {
        expect(
          jest.requireActual<typeof import('./publicActionsCache')>('./publicActionsCache')
            .PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS
        ).toBe(expected);
      });
    } finally {
      process.env = previous;
    }
  });
});
