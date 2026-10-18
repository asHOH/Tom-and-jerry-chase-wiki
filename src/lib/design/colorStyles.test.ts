import {
  getCardRankColors,
  getMapLevelColors,
  getMapTypeColors,
  getPositioningTagColors,
} from './colorStyles';

it('adds an optional border without changing the card foreground or background', () => {
  const plain = getCardRankColors('S', false, false);
  const bordered = getCardRankColors('S', true, false);
  expect(plain).not.toHaveProperty('borderColor');
  expect(bordered).toMatchObject(plain);
  expect(bordered.borderColor).toEqual(expect.any(String));
});

it.each([false, true])('uses fallback map colors in dark mode=%s', (isDarkMode) => {
  expect(getMapLevelColors('未知学业', isDarkMode)).toEqual(
    getMapLevelColors('见习学业', isDarkMode)
  );
  expect(getMapTypeColors('未知地图', isDarkMode)).toEqual(
    getPositioningTagColors('后期', 3, true, 'mouse', isDarkMode)
  );
});

it('keeps levels 3 and 4 on the same major-tag presentation', () => {
  expect(getPositioningTagColors('进攻', 3, true, 'cat', false)).toEqual(
    getPositioningTagColors('进攻', 4, true, 'cat', false)
  );
});

it('distinguishes minor tags with a gradient', () => {
  const styles = getPositioningTagColors('进攻', 2, true, 'cat', false);
  expect(styles).toMatchObject({ background: expect.stringContaining('linear-gradient') });
  expect(styles).not.toHaveProperty('backgroundColor');
});
