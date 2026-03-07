import { getDecodedPathSegments, getPathSegmentFromEnd } from './editModeRouteUtils';

describe('editModeRouteUtils', () => {
  it('handles trailing and non-trailing slashes consistently', () => {
    expect(getPathSegmentFromEnd('/characters/%E6%B1%A4%E5%A7%86/', 0)).toBe('汤姆');
    expect(getPathSegmentFromEnd('/characters/%E6%B1%A4%E5%A7%86', 0)).toBe('汤姆');
  });

  it('extracts the last route segment for user character drafts', () => {
    expect(getDecodedPathSegments('/characters/user/%E6%96%B0%E8%A7%92%E8%89%B2/')).toEqual([
      'characters',
      'user',
      '新角色',
    ]);
    expect(getPathSegmentFromEnd('/characters/user/%E6%96%B0%E8%A7%92%E8%89%B2/', 0)).toBe(
      '新角色'
    );
  });

  it('extracts nested special skill route params from the end of the pathname', () => {
    const pathname = '/special-skills/cat/%E5%86%B2%E5%88%BA/';

    expect(getPathSegmentFromEnd(pathname, 0)).toBe('冲刺');
    expect(getPathSegmentFromEnd(pathname, 1)).toBe('cat');
  });
});
