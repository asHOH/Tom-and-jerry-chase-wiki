import { notFound, redirect } from 'next/navigation';

import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { getGotoResult } from '@/lib/gotoUtils';

import RootGotoPage from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock('@/lib/gotoUtils', () => ({
  getGotoResult: jest.fn(),
}));

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedGameDataSnapshot: jest.fn(),
}));

const mockGetGotoResult = jest.mocked(getGotoResult);
const mockGetPublishedGameDataSnapshot = jest.mocked(getPublishedGameDataSnapshot);
const publishedData = { characters: {} };

describe('root goto page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPublishedGameDataSnapshot.mockResolvedValue({ data: publishedData } as never);
  });

  it('redirects a matching root name to its resolved page', async () => {
    mockGetGotoResult.mockResolvedValue({
      type: 'character',
      name: '汤姆',
      url: '/characters/%E6%B1%A4%E5%A7%86',
      description: '汤姆角色介绍',
      imageUrl: '/images/characters/汤姆.png',
    });

    await expect(
      RootGotoPage({
        params: Promise.resolve({ name: '%E6%B1%A4%E5%A7%86' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_REDIRECT:/characters/%E6%B1%A4%E5%A7%86');

    expect(mockGetGotoResult).toHaveBeenCalledWith('汤姆', undefined, {
      gameData: publishedData,
    });
    expect(redirect).toHaveBeenCalledWith('/characters/%E6%B1%A4%E5%A7%86');
  });

  it('returns not found when the root name cannot be resolved', async () => {
    mockGetGotoResult.mockResolvedValue(null);

    await expect(
      RootGotoPage({
        params: Promise.resolve({ name: 'non-exist' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalledTimes(1);
    expect(redirect).not.toHaveBeenCalled();
  });
});
