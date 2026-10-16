import type { CharacterDefinition, FactionId } from '@/data/types';

import { processCharacters } from './skillId';

const definition: CharacterDefinition = {
  description: '',
  skills: [{ name: 'Test skill', type: 'active', skillLevels: [] }],
  knowledgeCardGroups: [],
};

it.each(['cat', 'mouse'] as const)(
  'assigns the %s faction together with character and skill IDs',
  (factionId) => {
    const definitions = { Test: definition, Hidden: { hidden: true as const } };
    const before = structuredClone(definitions);

    expect(processCharacters(definitions, factionId)).toEqual({
      Test: {
        ...definition,
        id: 'Test',
        factionId,
        skills: [{ ...definition.skills[0], id: 'Test-active' }],
      },
    });
    expect(definitions).toEqual(before);
  }
);

it.each([undefined, 'unknown'])('rejects invalid faction %s at construction', (factionId) => {
  expect(() => processCharacters({ Test: definition }, factionId as FactionId)).toThrow(
    'Character faction must be cat or mouse'
  );
});
