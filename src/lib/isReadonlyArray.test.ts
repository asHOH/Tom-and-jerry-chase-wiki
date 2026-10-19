import { isReadonlyArray } from './isReadonlyArray';

type Item = { name: string };

function getNames(value: Item | readonly Item[]): string[] {
  return isReadonlyArray(value) ? value.map((item) => item.name) : [value.name];
}

it.each([
  { value: { name: 'single' }, expected: ['single'] },
  { value: Object.freeze([{ name: 'first' }, { name: 'second' }]), expected: ['first', 'second'] },
  { value: Object.freeze([]), expected: [] },
  { value: Object.assign([{ name: 'item' }], { name: 'array' }), expected: ['item'] },
])('distinguishes a single item from an array: $expected', ({ value, expected }) => {
  expect(getNames(value)).toEqual(expected);
});
