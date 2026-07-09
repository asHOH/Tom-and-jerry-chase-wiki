import type { CardGroup } from '@/data/types';

import {
  appendToPath,
  changeGroupType,
  cloneCardGroup,
  getNodeAtPath,
  getPathDepth,
  removeNodeAtPath,
  unwrapGroup,
  wouldExceedDepth,
} from './treeEditorUtils';

// CardGroupType is a const enum (And=0, Or=1) — inlined by TS, not available in Jest.
// Use numeric literals directly.
const And = 0;
const Or = 1;

describe('treeEditorUtils', () => {
  describe('cloneCardGroup', () => {
    it('should deep clone a flat array of strings', () => {
      const original = ['S-铁血', 'S-护佑', 'C-救救我'];
      const cloned = cloneCardGroup(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should deep clone nested groups', () => {
      const original: CardGroup[] = ['S-铁血', [Or, 'S-回家', 'S-护佑'], 'C-救救我'];
      const cloned = cloneCardGroup(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should clone deeply nested structures', () => {
      const original: CardGroup[] = [
        'S-蓄势一击',
        [Or, 'A-加大火力', [And, 'B-攻其不备', 'C-猫是液体']],
      ];
      const cloned = cloneCardGroup(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });

    it('should clone an empty array', () => {
      expect(cloneCardGroup([])).toEqual([]);
    });
  });

  describe('getPathDepth', () => {
    it('should return 0 for empty path', () => {
      expect(getPathDepth([])).toBe(0);
    });

    it('should return correct depth', () => {
      expect(getPathDepth([0])).toBe(1);
      expect(getPathDepth([2, 0, 1])).toBe(3);
    });
  });

  describe('getNodeAtPath', () => {
    const cards: CardGroup[] = ['S-铁血', [Or, 'S-回家', 'S-护佑']];

    it('should return undefined for empty path', () => {
      expect(getNodeAtPath(cards, [])).toBeUndefined();
    });

    it('should get a card string at path', () => {
      expect(getNodeAtPath(cards, [0])).toBe('S-铁血');
    });

    it('should get a group tuple at path', () => {
      const node = getNodeAtPath(cards, [1]);
      expect(Array.isArray(node)).toBe(true);
    });

    it('should get a nested card inside a group', () => {
      expect(getNodeAtPath(cards, [1, 0])).toBe('S-回家');
      expect(getNodeAtPath(cards, [1, 1])).toBe('S-护佑');
    });

    it('should return undefined for out-of-bounds path', () => {
      expect(getNodeAtPath(cards, [99])).toBeUndefined();
      expect(getNodeAtPath(cards, [1, 99])).toBeUndefined();
    });

    it('should return undefined when indexing into a string', () => {
      expect(getNodeAtPath(cards, [0, 0])).toBeUndefined();
    });
  });

  describe('removeNodeAtPath', () => {
    it('should return same array for empty path', () => {
      const cards: CardGroup[] = ['S-铁血', 'S-护佑'];
      const result = removeNodeAtPath(cards, []);
      expect(result).toBe(cards);
    });

    it('should remove a card at root level', () => {
      const cards: CardGroup[] = ['S-铁血', 'S-护佑', 'C-救救我'];
      const result = removeNodeAtPath(cards, [1]);
      expect(result).toEqual(['S-铁血', 'C-救救我']);
    });

    it('should remove first item', () => {
      const cards: CardGroup[] = ['S-铁血', 'S-护佑'];
      expect(removeNodeAtPath(cards, [0])).toEqual(['S-护佑']);
    });

    it('should remove last item', () => {
      const cards: CardGroup[] = ['S-铁血', 'S-护佑'];
      expect(removeNodeAtPath(cards, [1])).toEqual(['S-铁血']);
    });

    it('should remove a card inside a group', () => {
      const cards: CardGroup[] = [[Or, 'S-回家', 'S-护佑']];
      const result = removeNodeAtPath(cards, [0, 0]);
      const [, ...children] = result[0]! as readonly [number, ...string[]];
      expect(children).toEqual(['S-护佑']);
    });

    it('should remove a nested group tuple', () => {
      const cards: CardGroup[] = [
        'S-蓄势一击',
        [Or, 'A-加大火力', [And, 'B-攻其不备', 'C-猫是液体']],
      ];
      const result = removeNodeAtPath(cards, [1, 1]);
      const [, ...children] = result[1]! as readonly [number, ...CardGroup[]];
      expect(children).toEqual(['A-加大火力']);
    });
  });

  describe('appendToPath', () => {
    it('should append to root level', () => {
      const cards: CardGroup[] = ['S-铁血'];
      const result = appendToPath(cards, [], 'S-护佑');
      expect(result).toEqual(['S-铁血', 'S-护佑']);
    });

    it('should append inside a group tuple', () => {
      const cards: CardGroup[] = [[Or, 'S-回家']];
      const result = appendToPath(cards, [0], 'S-护佑');
      const [, ...children] = result[0]! as readonly [number, ...string[]];
      expect(children).toEqual(['S-回家', 'S-护佑']);
    });

    it('should append to deep nested level', () => {
      const cards: CardGroup[] = ['S-蓄势一击', [Or, 'A-加大火力']];
      const result = appendToPath(cards, [1], 'A-细心');
      const [, ...children] = result[1]! as readonly [number, ...string[]];
      expect(children).toEqual(['A-加大火力', 'A-细心']);
    });

    it('should not mutate the original', () => {
      const cards: CardGroup[] = ['S-铁血'];
      const result = appendToPath(cards, [], 'S-护佑');
      expect(cards).toEqual(['S-铁血']);
      expect(result).toEqual(['S-铁血', 'S-护佑']);
    });
  });

  describe('changeGroupType', () => {
    it('should toggle AND to OR', () => {
      const cards: CardGroup[] = [[And, 'S-回家', 'S-护佑']];
      const result = changeGroupType(cards, [0], Or);
      expect(result[0]![0]).toBe(Or);
    });

    it('should toggle OR to AND', () => {
      const cards: CardGroup[] = [[Or, 'S-回家', 'S-护佑']];
      const result = changeGroupType(cards, [0], And);
      expect(result[0]![0]).toBe(And);
    });

    it('should not mutate original', () => {
      const cards: CardGroup[] = [[Or, 'S-回家']];
      const result = changeGroupType(cards, [0], And);
      expect(cards[0]![0]).toBe(Or);
      expect(result[0]![0]).toBe(And);
    });

    it('should change type of nested group', () => {
      const cards: CardGroup[] = ['S-蓄势一击', [Or, [And, 'B-攻其不备', 'C-猫是液体']]];
      const result = changeGroupType(cards, [1, 0], Or);
      const [, ...children] = result[1]! as readonly [number, ...CardGroup[]];
      const innerGroup = children[0]! as readonly [number, ...CardGroup[]];
      expect(innerGroup[0]).toBe(Or);
    });
  });

  describe('unwrapGroup', () => {
    it('should unwrap a group, promoting children to parent level', () => {
      const cards: CardGroup[] = ['S-铁血', [Or, 'S-回家', 'S-护佑'], 'C-救救我'];
      const result = unwrapGroup(cards, [1]);
      expect(result).toEqual(['S-铁血', 'S-回家', 'S-护佑', 'C-救救我']);
    });

    it('should unwrap a group at the end', () => {
      const cards: CardGroup[] = ['S-铁血', [Or, 'S-回家']];
      const result = unwrapGroup(cards, [1]);
      expect(result).toEqual(['S-铁血', 'S-回家']);
    });

    it('should unwrap an empty group', () => {
      const cards: CardGroup[] = ['S-铁血', [Or]];
      const result = unwrapGroup(cards, [1]);
      expect(result).toEqual(['S-铁血']);
    });
  });

  describe('wouldExceedDepth', () => {
    it('should return false at depth 0', () => {
      expect(wouldExceedDepth([], [])).toBe(false);
    });

    it('should return false at shallow depth', () => {
      expect(wouldExceedDepth([], [0, 1])).toBe(false);
    });

    it('should return true at depth 5', () => {
      expect(wouldExceedDepth([], [0, 1, 2, 3, 4])).toBe(true);
    });
  });
});
