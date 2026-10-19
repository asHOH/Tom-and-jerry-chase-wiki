import {
  getAvatarFilterColors,
  getCardCostColors,
  getCardRankColors,
  getEntityTypeColors,
  getFactionButtonColors,
  getMapLevelColors,
  getMapTypeColors,
  getPositioningTagColors,
  getSkillLevelColors,
} from './colorStyles';

it('adds an optional border without changing the card foreground or background', () => {
  const plain = getCardRankColors('S', false);
  const bordered = getCardRankColors('S', true);
  expect(plain).not.toHaveProperty('borderColor');
  expect(bordered).toMatchObject(plain);
  expect(bordered.borderColor).toEqual(expect.any(String));
});

it('uses fallback map colors', () => {
  expect(getMapLevelColors('未知学业')).toEqual(getMapLevelColors('见习学业'));
  expect(getMapTypeColors('未知地图')).toEqual(getPositioningTagColors('后期', 3, true, 'mouse'));
});

it('keeps levels 3 and 4 on the same major-tag presentation', () => {
  expect(getPositioningTagColors('进攻', 3, true, 'cat')).toEqual(
    getPositioningTagColors('进攻', 4, true, 'cat')
  );
});

it('distinguishes minor tags with a gradient', () => {
  const styles = getPositioningTagColors('进攻', 2, true, 'cat');
  expect(styles).toMatchObject({ background: expect.stringContaining('linear-gradient') });
  expect(styles).not.toHaveProperty('backgroundColor');
});

it.each([
  [0, 3],
  [3.99, 3],
  [4, 4.99],
  [5, 5.99],
  [6, 10],
])('keeps costs %s and %s in the same color band', (cost, equivalent) => {
  expect(getCardCostColors(cost, true)).toEqual(getCardCostColors(equivalent, true));
});

it.each([4, 5, 6])('changes the cost color at %s', (threshold) => {
  expect(getCardCostColors(threshold, false)).not.toEqual(
    getCardCostColors(threshold - 0.01, false)
  );
});

it('retains rank and skill-level fallbacks', () => {
  expect(getCardRankColors('unknown', true)).toEqual(getCardRankColors('default', true));
  expect(getSkillLevelColors(0, true)).toEqual(getSkillLevelColors(1, true));
  expect(getSkillLevelColors(4, true)).toEqual(getSkillLevelColors(1, true));
});

it('keeps avatar filters aligned with their factions', () => {
  expect(getAvatarFilterColors('杰瑞')).toEqual(getFactionButtonColors('mouse'));
  expect(getAvatarFilterColors('汤姆')).toEqual(getFactionButtonColors('cat'));
});

it('uses neutral solid styling for unknown positioning tags', () => {
  const minor = getPositioningTagColors('unknown', 2, false, 'cat');
  expect(minor).toEqual(getPositioningTagColors('unknown', 3, false, 'cat'));
  expect(minor).not.toHaveProperty('background');
  expect(minor.borderColor).toBe('transparent');
});

it('changes only the background opacity for minor entity tags', () => {
  const major = getEntityTypeColors('投射类');
  const minor = getEntityTypeColors('投射类', true);
  expect(getEntityTypeColors('投射类', false)).toEqual(major);
  expect(minor).toEqual({
    color: major.color,
    backgroundColor: `color-mix(in srgb, ${major.backgroundColor} 50%, transparent)`,
  });
});
