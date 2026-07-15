import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';

describe('resourceContexts', () => {
  it('collects every canonical root from mixed entry shapes', () => {
    expect(
      getGameActionResourceContexts('characters', [
        { path: ['Tom', 'skills', 'attack'], value: 1 },
        { id: 'Jerry', value: 2 },
        { path: 'Tuffy.stats.health', value: 3 },
      ])
    ).toEqual([
      { resourceType: 'characters', resourceId: 'Tom' },
      { resourceType: 'characters', resourceId: 'Jerry' },
      { resourceType: 'characters', resourceId: 'Tuffy' },
    ]);
  });

  it('returns a type context when entries contain no stable resource ID', () => {
    expect(getGameActionResourceContexts('maps', [{ value: 1 }])).toEqual([
      { resourceType: 'maps' },
    ]);
  });

  it('uses the skill ID instead of the faction as the special-skill root', () => {
    expect(
      getGameActionResourceContexts('specialSkills', [{ path: 'cat.主动技能.冷却时间', value: 1 }])
    ).toEqual([{ resourceType: 'specialSkills', resourceId: '主动技能' }]);
  });
});
