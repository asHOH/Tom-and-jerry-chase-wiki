import { getFactionLabel } from './factions';

it.each([
  ['cat', '猫'],
  ['mouse', '鼠'],
  [undefined, undefined],
  ['unknown', undefined],
  ['toString', undefined],
])('formats optional faction %s as %s', (factionId, label) => {
  expect(getFactionLabel(factionId)).toBe(label);
});
