import uniq from 'lodash-es/uniq';

const nameBlacklist = [
  '破墙',
  '捕鼠夹',
  '爪刀',
  '迅',
  '三叉戟',
  '绝地反击',
  '追风',
  '兔子',
  '大表哥',
  '相助',
  '杰瑞',
  '泰菲',
  '速推',
  '汤姆',
];

/**
 * Precomputed list of character and card names that should be automatically
 * wrapped with curly braces. Sorted by length descending to ensure longer
 * names are matched first.
 */
export function createAutoWrapNames(
  characters: Readonly<Record<string, { id: string }>>,
  cards: Readonly<Record<string, { id: string }>>
) {
  const canonicalCharacterNames = [
    ...Object.keys(characters),
    ...Object.values(characters).map((character) => character.id),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  const canonicalCardNames = [
    ...Object.keys(cards),
    ...Object.values(cards).map((card) => card.id),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  const names = uniq([...canonicalCharacterNames, ...canonicalCardNames])
    .filter((name) => !nameBlacklist.includes(name))
    .sort((a, b) => b.length - a.length);

  return names;
}
