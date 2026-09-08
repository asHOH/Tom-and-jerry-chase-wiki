import singleItemRreverse from './singleItemReverse';

jest.mock('@/data/autoWrapNames', () => ({ autoWrapNames: [] }));
jest.mock('@/data', () => ({
  characters: {
    owner: {
      skills: [{ name: 'level-skill', skillLevels: [{ detailedDescription: '{target}' }] }],
    },
  },
  cards: { card: { id: 'card-id', name: 'card-name', description: '{target}' } },
  specialSkills: {
    cat: { shared: { name: 'shared', description: '{target} {shared}' } },
    mouse: { shared: { name: 'shared', description: '{target} {shared}' } },
  },
  items: {
    target: { name: 'target', aliases: ['alias'], description: '{target}' },
    alias: {
      name: 'alias-reference',
      description: 'plain target',
      detailedDescription: '《alias》',
    },
    group: { name: 'group-reference', description: '{group}' },
    absent: { name: 'absent', description: null },
    plain: { name: 'plain', description: 'target without brackets' },
  },
  entities: { entity: { name: 'entity', description: '{target}' } },
  buffs: { buff: { name: 'buff', detailedDescription: '{target}' } },
  maps: { map: { name: 'map', description: '前'.repeat(40) + '{target}' + '后'.repeat(120) } },
  modes: {
    rules: { name: 'rules', description: '\n\nmode summary', rules: '{target}' },
    detailedRules: { name: 'detailed-rules', detailedRules: '{target}' },
  },
  fixtures: { fixture: { name: 'fixture', description: '{target}' } },
  achievements: {
    cat: { shared: { name: 'achievement', factionId: 'cat', description: '{target}' } },
    mouse: { shared: { name: 'achievement', factionId: 'mouse', description: '{target}' } },
  },
  itemGroups: { group: { name: 'group', group: [{ name: 'target', type: 'item' }] } },
}));

describe('singleItemRreverse', () => {
  it('preserves result order, identities, aliases, groups, and per-type searchable fields', () => {
    const results = singleItemRreverse({ name: 'target', type: 'item' });
    expect(results).toEqual([
      { name: 'level-skill', type: 'skill', description: '{target}' },
      { name: 'card-id', type: 'knowledgeCard', description: '{target}' },
      { name: 'shared', type: 'specialSkill', factionId: 'cat', description: '{target} {shared}' },
      {
        name: 'shared',
        type: 'specialSkill',
        factionId: 'mouse',
        description: '{target} {shared}',
      },
      { name: 'alias-reference', type: 'item', description: '《alias》' },
      { name: 'group-reference', type: 'item', description: '{group}' },
      { name: 'entity', type: 'entity', description: '{target}' },
      { name: 'buff', type: 'buff', description: '{target}' },
      {
        name: 'map',
        type: 'map',
        description: '...' + '前'.repeat(30) + '{target}' + '后'.repeat(100) + '...',
      },
      { name: 'rules', type: 'mode', description: '\nmode summary' },
      { name: 'detailed-rules', type: 'mode', description: '' },
      { name: 'fixture', type: 'fixture', description: '{target}' },
      { name: 'achievement', type: 'achievement', factionId: 'cat', description: '{target}' },
      { name: 'achievement', type: 'achievement', factionId: 'mouse', description: '{target}' },
    ]);
  });

  it('keeps mobile excerpts shorter and excludes only the matching faction of a self-reference', () => {
    expect(
      singleItemRreverse({ name: 'target', type: 'item' }, true).find((item) => item.type === 'map')
        ?.description
    ).toBe('...' + '前'.repeat(10) + '{target}' + '后'.repeat(100) + '...');
    expect(singleItemRreverse({ name: 'shared', type: 'specialSkill', factionId: 'cat' })).toEqual([
      {
        name: 'shared',
        type: 'specialSkill',
        factionId: 'mouse',
        description: '{target} {shared}',
      },
    ]);
  });
});
