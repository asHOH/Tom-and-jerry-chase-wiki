import {
  getPositioningTagChartData,
  normalizePositioningTagViewMode,
} from './positioningTagViewModel';

describe('positioningTagViewModel', () => {
  it('builds all seven cat axes in canonical order with absent axes at level zero', () => {
    expect(
      getPositioningTagChartData(
        [
          { tagName: '后期', level: 3 },
          { tagName: '进攻', level: 4 },
        ],
        'cat'
      )
    ).toEqual([
      { tagName: '进攻', level: 4 },
      { tagName: '防守', level: 0 },
      { tagName: '追击', level: 0 },
      { tagName: '打架', level: 0 },
      { tagName: '速通', level: 0 },
      { tagName: '后期', level: 3 },
      { tagName: '翻盘', level: 0 },
    ]);
  });

  it('uses the mouse canonical order', () => {
    expect(getPositioningTagChartData([], 'mouse').map((datum) => datum.tagName)).toEqual([
      '奶酪',
      '干扰',
      '救援',
      '辅助',
      '破局',
      '砸墙',
      '后期',
    ]);
  });

  it('treats edit-only and absent levels as zero and keeps minor levels', () => {
    expect(
      getPositioningTagChartData(
        [
          { tagName: '进攻', level: 1 },
          { tagName: '防守', level: 2 },
          { tagName: '追击', level: 0 },
        ],
        'cat'
      ).slice(0, 3)
    ).toEqual([
      { tagName: '进攻', level: 0 },
      { tagName: '防守', level: 2 },
      { tagName: '追击', level: 0 },
    ]);
  });

  it('uses the highest level when a tag appears more than once', () => {
    expect(
      getPositioningTagChartData(
        [
          { tagName: '进攻', level: 2 },
          { tagName: '进攻', level: 4 },
        ],
        'cat'
      )[0]
    ).toEqual({ tagName: '进攻', level: 4 });
  });

  it.each([
    ['text', 'text'],
    ['bar', 'bar'],
    ['rose', 'radar'],
    ['radar', 'radar'],
    ['unsupported', 'text'],
    [null, 'text'],
  ])('normalizes stored view mode %s', (value, expected) => {
    expect(normalizePositioningTagViewMode(value)).toBe(expected);
  });
});
