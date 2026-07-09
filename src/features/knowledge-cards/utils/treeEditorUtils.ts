/**
 * Pure utility functions for immutable CardGroup[] tree mutations.
 *
 * Path notation: `[2, 0, 1]` means cards[2] is a tuple, then its
 * children[0], then that child's children[1]. An empty path `[]`
 * refers to the root-level cards array itself.
 */

import type { CardGroup, CardGroupType } from '@/data/types';

/** Maximum nesting depth for CardGroup tuples (matches TypeScript type recursion limit). */
const MAX_DEPTH = 5;

/** Deep clone a readonly CardGroup[] for local mutable state (dereferences Valtio frozen proxies). */
export function cloneCardGroup(cards: readonly CardGroup[]): CardGroup[] {
  return cards.map((item) => {
    if (typeof item === 'string') return item;
    const [type, ...children] = item;
    return [type, ...cloneCardGroup(children)] as unknown as CardGroup;
  });
}

/** Return the nesting depth of a path (number of segments). */
export function getPathDepth(path: readonly number[]): number {
  return path.length;
}

/** Get item at a path. Returns undefined if path is invalid. */
export function getNodeAtPath(
  cards: readonly CardGroup[],
  path: readonly number[]
): CardGroup | undefined {
  if (path.length === 0) return undefined;
  const [head, ...tail] = path;
  if (head === undefined || head < 0 || head >= cards.length) return undefined;
  const item = cards[head]!;
  if (tail.length === 0) return item;
  if (typeof item === 'string') return undefined;
  const [, ...children] = item;
  return getNodeAtPath(children, tail);
}

/** Remove item at a path. Returns new CardGroup[]. */
export function removeNodeAtPath(cards: CardGroup[], path: readonly number[]): CardGroup[] {
  if (path.length === 0) return cards;
  const [head, ...tail] = path;
  if (head === undefined || head < 0 || head >= cards.length) return cards;

  if (tail.length === 0) {
    const result = [...cards];
    result.splice(head, 1);
    return result;
  }

  const item = cards[head]!;
  if (typeof item === 'string') return cards;
  const [type, ...children] = item;
  const newChildren = removeNodeAtPath(children as CardGroup[], tail);
  const result = [...cards];
  result[head] = [type, ...newChildren] as unknown as CardGroup;
  return result;
}

/** Append a new CardGroup item to a parent level specified by path. Returns new CardGroup[]. */
export function appendToPath(
  cards: CardGroup[],
  parentPath: readonly number[],
  value: CardGroup
): CardGroup[] {
  if (parentPath.length === 0) return [...cards, value];

  const [head, ...tail] = parentPath;
  if (head === undefined || head < 0 || head >= cards.length) return cards;
  const item = cards[head]!;
  if (typeof item === 'string') return cards;
  const [type, ...children] = item;
  const newChildren = appendToPath(children as CardGroup[], tail, value);
  const result = [...cards];
  result[head] = [type, ...newChildren] as unknown as CardGroup;
  return result;
}

/** Change the group type of a tuple at path. Returns new CardGroup[]. */
export function changeGroupType(
  cards: CardGroup[],
  path: readonly number[],
  newType: CardGroupType
): CardGroup[] {
  if (path.length === 0) return cards;

  const [head, ...tail] = path;
  if (head === undefined || head < 0 || head >= cards.length) return cards;

  const item = cards[head]!;
  if (typeof item === 'string') return cards;

  if (tail.length === 0) {
    const [, ...children] = item;
    const result = [...cards];
    result[head] = [newType, ...children] as unknown as CardGroup;
    return result;
  }

  const [type, ...children] = item;
  const newChildren = changeGroupType(children as CardGroup[], tail, newType);
  const result = [...cards];
  result[head] = [type, ...newChildren] as unknown as CardGroup;
  return result;
}

/**
 * Remove a group wrapper at path but keep its children at the parent level.
 * Path points to the group tuple to unwrap.
 */
export function unwrapGroup(cards: CardGroup[], path: readonly number[]): CardGroup[] {
  if (path.length === 0) return cards;

  const parentPath = path.slice(0, -1);
  const itemIndex = path[path.length - 1]!;

  let currentParent: CardGroup[] = cards;
  for (const idx of parentPath) {
    const it = currentParent[idx];
    if (it === undefined || typeof it === 'string') return cards;
    const [, ...ch] = it;
    currentParent = ch as CardGroup[];
  }

  const target = currentParent[itemIndex];
  if (target === undefined || typeof target === 'string') return cards;

  const [, ...groupChildren] = target;
  const unwrappedChildren: CardGroup[] = [...groupChildren];

  const newParent = [...currentParent];
  newParent.splice(itemIndex, 1, ...unwrappedChildren);

  return setItemsAtParentPath(cards, parentPath, newParent);
}

/** Helper: set items at parentPath level, returning new root cards. */
function setItemsAtParentPath(
  cards: CardGroup[],
  parentPath: readonly number[],
  newItems: CardGroup[]
): CardGroup[] {
  if (parentPath.length === 0) return newItems;

  const [head, ...tail] = parentPath;
  if (head === undefined || head < 0 || head >= cards.length) return cards;
  const item = cards[head]!;
  if (typeof item === 'string') return cards;
  const [type, ...children] = item;
  const newChildren = setItemsAtParentPath(children as CardGroup[], tail, newItems);
  const result = [...cards];
  result[head] = [type, ...newChildren] as unknown as CardGroup;
  return result;
}

/** Check if creating a subgroup at parentPath would exceed the max depth. */
export function wouldExceedDepth(
  _cards: readonly CardGroup[],
  parentPath: readonly number[]
): boolean {
  return parentPath.length >= MAX_DEPTH;
}
