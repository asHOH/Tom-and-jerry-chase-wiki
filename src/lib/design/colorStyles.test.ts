import {
  getCardCostColors,
  getCardRankColors,
  getFactionButtonColors,
  getKnowledgeCardGroupMetaColors,
  getMapLevelColors,
  getMapTypeColors,
  getPositioningTagColors,
  getSkillLevelColors,
} from './colorStyles';

describe('game color styles', () => {
  it('preserves card rank and cost colors across themes', () => {
    expect(getCardRankColors('S', true, false)).toEqual({
      color: '#ea580c',
      backgroundColor: '#fef3e2',
      borderColor: '#fdba74',
    });
    expect(getCardCostColors(6, true, true)).toEqual({
      color: '#fca5a5',
      backgroundColor: '#7f1d1d',
      borderColor: '#dc2626',
    });
  });

  it('preserves skill-level and knowledge-card metadata colors', () => {
    expect(getSkillLevelColors(2, true, false)).toEqual({
      color: '#d97706',
      backgroundColor: '#fffbeb',
      borderColor: '#f59e0b',
    });
    expect(getKnowledgeCardGroupMetaColors('missingWarning', true)).toEqual({
      color: '#fef2f2',
      backgroundColor: '#dc2626',
    });
  });

  it('preserves faction button colors', () => {
    expect(getFactionButtonColors('cat', false)).toEqual({
      backgroundColor: '#E0F2FF',
      color: '#0369A1',
    });
    expect(getFactionButtonColors('mouse', true)).toEqual({
      backgroundColor: '#7c2d12',
      color: '#fdbf74',
    });
  });

  it('preserves map fallbacks without a parallel skill-type palette', () => {
    expect(getMapTypeColors('未知地图', false)).toEqual({
      color: '#111111',
      backgroundColor: '#dbdee3',
      borderColor: '#ffffff',
    });
    expect(getMapLevelColors('未知学业', true)).toEqual({
      color: '#86efac',
      backgroundColor: '#065f46',
      borderColor: '#16a34a',
    });
  });
});

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
