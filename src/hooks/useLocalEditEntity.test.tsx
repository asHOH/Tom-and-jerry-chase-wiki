import { usePathname } from 'next/navigation';
import { renderHook } from '@testing-library/react';

import {
  useLocalAchievement,
  useLocalBuff,
  useLocalCard,
  useLocalCharacter,
  useLocalEntity,
  useLocalFixture,
  useLocalItem,
  useLocalMap,
  useLocalMode,
  useLocalSpecialSkill,
} from './useLocalEditEntity';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe('useLocalEditEntity', () => {
  it('should derive single-segment entity ids from the current route tail', () => {
    mockUsePathname.mockReturnValue('/items/%E5%8F%89%E5%AD%90/');

    expect(renderHook(() => useLocalItem()).result.current).toEqual({ itemName: '叉子' });
    expect(renderHook(() => useLocalCharacter()).result.current).toEqual({ characterId: '叉子' });
    expect(renderHook(() => useLocalCard()).result.current).toEqual({ cardId: '叉子' });
    expect(renderHook(() => useLocalEntity()).result.current).toEqual({ entityName: '叉子' });
    expect(renderHook(() => useLocalBuff()).result.current).toEqual({ buffName: '叉子' });
    expect(renderHook(() => useLocalFixture()).result.current).toEqual({ fixtureName: '叉子' });
    expect(renderHook(() => useLocalMap()).result.current).toEqual({ mapName: '叉子' });
    expect(renderHook(() => useLocalMode()).result.current).toEqual({ modeName: '叉子' });
    expect(renderHook(() => useLocalAchievement()).result.current).toEqual({
      achievementName: '叉子',
    });
  });

  it('should derive special skill faction id from the previous route segment', () => {
    mockUsePathname.mockReturnValue('/special-skills/cat/%E6%AD%A6%E5%99%A8/');

    expect(renderHook(() => useLocalSpecialSkill()).result.current).toEqual({
      factionId: 'cat',
      skillId: '武器',
    });
  });

  it('should return empty strings when the current route has no matching segment', () => {
    mockUsePathname.mockReturnValue('/');

    expect(renderHook(() => useLocalItem()).result.current).toEqual({ itemName: '' });
    expect(renderHook(() => useLocalSpecialSkill()).result.current).toEqual({
      factionId: '',
      skillId: '',
    });
  });
});
