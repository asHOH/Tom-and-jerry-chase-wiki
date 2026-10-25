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

  it('requires both character scopes for pair writes, including removal and nested legacy paths', () => {
    expect(
      getGameActionResourceContexts('characters', [
        { path: 'Jerry.characterRelationOverrides.Tom', newValue: null },
        { path: ['Jerry', 'characterRelationOverrides', 'Tom', 'description'], newValue: 'shared' },
      ])
    ).toEqual([
      { resourceType: 'characters', resourceId: 'Jerry' },
      { resourceType: 'characters', resourceId: 'Tom' },
    ]);
  });

  it('includes old and new pair targets when replacing a character or its override map', () => {
    expect(
      getGameActionResourceContexts('characters', [
        {
          path: 'Jerry.characterRelationOverrides',
          oldValue: { Tom: null },
          newValue: { Tuffy: { kind: 'collaborators', isMinor: false } },
        },
        {
          path: 'Jerry',
          oldValue: { characterRelationOverrides: { Spike: null } },
          newValue: { characterRelationOverrides: { Nibbles: null } },
        },
      ])
    ).toEqual(
      ['Jerry', 'Tom', 'Tuffy', 'Spike', 'Nibbles'].map((resourceId) => ({
        resourceType: 'characters',
        resourceId,
      }))
    );
  });

  it('preserves legacy-array authorization scope while adding only shared-record endpoints', () => {
    expect(
      getGameActionResourceContexts('characters', [
        { path: 'Jerry.counters', newValue: [{ id: 'Tom', isMinor: false }] },
        {
          path: 'Jerry',
          newValue: {
            counters: [{ id: 'Tom', isMinor: false }],
            characterRelationOverrides: { Tuffy: null },
          },
        },
      ])
    ).toEqual([
      { resourceType: 'characters', resourceId: 'Jerry' },
      { resourceType: 'characters', resourceId: 'Tuffy' },
    ]);
  });
});
