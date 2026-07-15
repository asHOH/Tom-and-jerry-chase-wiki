import {
  getPositioningTagLevel,
  isPositioningTagMinor,
  isPositioningTagVisible,
  sortPositioningTags,
} from './positioningTagSequences';

describe('positioningTagSequences', () => {
  it('sorts tags by descending level and then by faction sequence', () => {
    const tags = [
      { tagName: '追击', level: 2 as const },
      { tagName: '防守', level: 4 as const },
      { tagName: '进攻', level: 2 as const },
      { tagName: '进攻', level: 4 as const },
    ];

    expect(sortPositioningTags(tags, 'cat')).toEqual([
      { tagName: '进攻', level: 4 },
      { tagName: '防守', level: 4 },
      { tagName: '进攻', level: 2 },
      { tagName: '追击', level: 2 },
    ]);
  });

  it('only exposes public tags from level 2 onward', () => {
    expect(isPositioningTagVisible(undefined)).toBe(false);
    expect(isPositioningTagVisible(0)).toBe(false);
    expect(isPositioningTagVisible(1)).toBe(false);
    expect(isPositioningTagVisible(2)).toBe(true);
    expect(isPositioningTagVisible(4)).toBe(true);
  });

  it('reads legacy public action tags without treating an ordinary missing level as present', () => {
    expect(getPositioningTagLevel({ isMinor: false })).toBe(4);
    expect(getPositioningTagLevel({ isMinor: true })).toBe(2);
    expect(getPositioningTagLevel({})).toBe(0);
    expect(getPositioningTagLevel({ level: 1, isMinor: false })).toBe(1);
  });

  it('exposes every stored tag while editing so its level can be changed', () => {
    expect(isPositioningTagVisible(undefined, true)).toBe(true);
    expect(isPositioningTagVisible(0, true)).toBe(true);
    expect(isPositioningTagVisible(1, true)).toBe(true);
  });

  it('maps only level 2 to the existing minor presentation', () => {
    expect(isPositioningTagMinor(1)).toBe(false);
    expect(isPositioningTagMinor(2)).toBe(true);
    expect(isPositioningTagMinor(3)).toBe(false);
    expect(isPositioningTagMinor(4)).toBe(false);
  });
});
