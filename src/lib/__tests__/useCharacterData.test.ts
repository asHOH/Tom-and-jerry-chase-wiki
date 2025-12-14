import { renderHook } from '@testing-library/react';
import useSWR from 'swr';

import { useCharacterData } from '@/features/characters/hooks/useCharacterData';

// Mock SWR
jest.mock('swr');
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>;

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

  it('should create correct SWR key for cat faction', () => {
    renderHook(() => useCharacterData('cat'));

    expect(mockUseSWR).toHaveBeenCalledWith(
      'characters-cat',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );
  });

  it('should create correct SWR key for mouse faction', () => {
    renderHook(() => useCharacterData('mouse'));

    expect(mockUseSWR).toHaveBeenCalledWith(
      'characters-mouse',
      expect.any(Function),
      expect.objectContaining({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      })
    );
  });

  it('should return SWR response structure', () => {
    const { result } = renderHook(() => useCharacterData('cat'));

    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('mutate');
  });
});
