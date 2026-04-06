import { renderHook } from '@testing-library/react';
import useSWR from 'swr';

import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';
import { useCharacterData } from '@/features/characters/hooks/useCharacterData';

jest.mock('swr');

const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

const getLatestFetcher = () => {
  const fetcher = mockUseSWR.mock.calls.at(-1)?.[1];
  expect(fetcher).toEqual(expect.any(Function));
  return fetcher as () => Promise<unknown>;
};

describe('useCharacterData', () => {
  beforeEach(() => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: jest.fn(),
      isValidating: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the cat SWR key and fetcher branch', async () => {
    renderHook(() => useCharacterData('cat'));

    expect(mockUseSWR).toHaveBeenCalledWith(
      'characters-cat',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );

    await expect(getLatestFetcher()()).resolves.toEqual(catCharactersWithImages);
  });

  it('uses the mouse SWR key and fetcher branch', async () => {
    renderHook(() => useCharacterData('mouse'));

    expect(mockUseSWR).toHaveBeenCalledWith(
      'characters-mouse',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );

    await expect(getLatestFetcher()()).resolves.toEqual(mouseCharactersWithImages);
  });

  it('returns the current SWR response object', () => {
    const swrResponse = {
      data: { tom: { id: 'tom' } },
      error: undefined,
      isLoading: false,
      mutate: jest.fn(),
      isValidating: false,
    };

    mockUseSWR.mockReturnValueOnce(swrResponse);

    const { result } = renderHook(() => useCharacterData('cat'));

    expect(result.current).toBe(swrResponse);
  });
});
