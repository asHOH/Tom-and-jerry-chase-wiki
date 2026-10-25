import {
  getCharacterRelationActionTargetIds,
  getCharacterRelationOverrideActionTargetIds,
} from './characterRelationActionTargets';

it('finds both endpoints in changed legacy arrays, including removed entries', () => {
  const action = {
    path: 'Jerry.counters',
    oldValue: [{ id: 'Tom' }],
    newValue: [{ id: 'Spike' }],
  };
  expect(getCharacterRelationActionTargetIds(action)).toEqual(['Jerry', 'Tom', 'Spike']);
  expect(getCharacterRelationOverrideActionTargetIds(action)).toEqual([]);
});

it('finds legacy and shared endpoints in whole-character replacements', () => {
  const action = {
    path: 'Jerry',
    oldValue: { counteredBy: [{ id: 'Tom' }], characterRelationOverrides: { Tuffy: null } },
    newValue: { counters: [{ id: 'Spike' }] },
  };
  expect(getCharacterRelationActionTargetIds(action)).toEqual(['Jerry', 'Tuffy', 'Tom', 'Spike']);
  expect(getCharacterRelationOverrideActionTargetIds(action)).toEqual(['Jerry', 'Tuffy']);
});

it('ignores unrelated fields and non-character relation collections', () => {
  for (const path of ['Jerry.description', 'Jerry.advantageMaps']) {
    expect(
      getCharacterRelationActionTargetIds({ path, oldValue: undefined, newValue: [{ id: 'Tom' }] })
    ).toEqual([]);
  }
});
