import { mouseCharactersWithImages } from './mouseCharacters';

describe('mouseCharacters', () => {
  it('should preserve the confirmed English name for Pilgrim Tuffy', () => {
    expect(mouseCharactersWithImages.朝圣者泰菲?.EnglishName).toBe('Pilgrim Tuffy');
  });
});
