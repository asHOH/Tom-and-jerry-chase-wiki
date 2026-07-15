import { getPositioningTagColors } from './colorStyles';

describe('getPositioningTagColors', () => {
  it('keeps levels 3 and 4 on the same major-tag presentation', () => {
    expect(getPositioningTagColors('进攻', 3, true, 'cat', false)).toEqual(
      getPositioningTagColors('进攻', 4, true, 'cat', false)
    );
  });

  it('keeps level 2 on the existing minor-tag gradient presentation', () => {
    const styles = getPositioningTagColors('进攻', 2, true, 'cat', false);

    expect(styles).toHaveProperty('background');
    expect(styles).not.toHaveProperty('backgroundColor');
    if ('background' in styles) {
      expect(styles.background).toContain('linear-gradient');
    }
  });
});
