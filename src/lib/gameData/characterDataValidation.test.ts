import { InvalidGameDataValueError, validateCharacterData } from './characterDataValidation';

const valid = () => ({
  Tom: {
    id: 'Tom',
    description: '',
    skills: [
      {
        id: 'passive',
        name: 'Passive',
        type: 'passive',
        skillLevels: [{ level: 1, description: '' }],
      },
    ],
    knowledgeCardGroups: [{ cards: [] }],
    skillAllocations: [{ id: 'plan', pattern: '012', weaponType: 'weapon1', description: '' }],
  },
});

it('accepts absent optional descriptions and empty required text without changing data', () => {
  const target = valid();
  const before = structuredClone(target);
  expect(() => validateCharacterData(target, ['Tom'])).not.toThrow();
  expect(target).toEqual(before);
  expect(() =>
    validateCharacterData({ Tom: { ...target.Tom, skillAllocations: undefined } }, [
      'Tom.skillAllocations',
    ])
  ).not.toThrow();
});

it.each(['id', 'pattern', 'weaponType', 'description'])(
  'rejects a missing or mistyped allocation %s in whole-list and whole-character replacements',
  (field) => {
    const target = valid();
    const allocation = target.Tom.skillAllocations[0] as Record<string, unknown>;
    for (const invalid of [undefined, null, 123]) {
      allocation[field] = invalid;
      for (const path of ['Tom.skillAllocations', 'Tom']) {
        expect(() => validateCharacterData(target, [path])).toThrow(InvalidGameDataValueError);
      }
    }
  }
);

it('checks nested required fields and permits unrelated edits despite pre-existing invalid data', () => {
  const target = valid();
  const level = target.Tom.skills[0]!.skillLevels[0] as Record<string, unknown>;
  delete level.description;
  expect(() => validateCharacterData(target, ['Tom.skills.0.skillLevels.0'])).toThrow(
    InvalidGameDataValueError
  );
  expect(() => validateCharacterData(target, ['Tom.description'])).not.toThrow();
});

it('checks required fields in newly added recommendation records and group sets', () => {
  for (const [field, value] of Object.entries({
    specialSkills: [{ name: 'skill' }],
    recommendedStorePlans: [{ items: ['a', 'b', 'c', 'd'] }],
    catPositioningTags: [{ tagName: '追击', description: '' }],
    knowledgeCardGroups: [{ id: 'set', groups: [], defaultFolded: false }],
  })) {
    expect(() =>
      validateCharacterData({ Tom: { ...valid().Tom, [field]: value } }, [`Tom.${field}`])
    ).toThrow(InvalidGameDataValueError);
  }
});
