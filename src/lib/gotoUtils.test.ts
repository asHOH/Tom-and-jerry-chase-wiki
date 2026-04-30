import { getGotoResult } from './gotoUtils';

describe('getGotoResult', () => {
  it('should resolve level 3 skill links with skill metadata', async () => {
    const result = await getGotoResult('3级旋转桶盖', '技能');

    expect(result).not.toBeNull();
    expect(result).toEqual(
      expect.objectContaining({
        type: 'character-skill',
        name: '旋转桶盖',
        skillLevel: 3,
        skillType: 'weapon2',
      })
    );
  });
});
