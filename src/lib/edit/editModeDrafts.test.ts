import type { ActionHistoryEntry } from './diffUtils';
import {
  buildDraftSummaryItemsForType,
  sortDraftSummaryItems,
  splitActionHistoryByEntity,
} from './editModeDrafts';

describe('editModeDrafts', () => {
  describe('splitActionHistoryByEntity', () => {
    it('should split matching and remaining action history by root entity id', () => {
      const history: ActionHistoryEntry[] = [
        {
          op: 'set',
          path: 'tom.description',
          oldValue: 'old tom',
          newValue: 'new tom',
        },
        [
          {
            op: 'set',
            path: 'tom.name',
            oldValue: 'Tom',
            newValue: '汤姆',
          },
          {
            op: 'set',
            path: 'jerry.name',
            oldValue: 'Jerry',
            newValue: '杰瑞',
          },
        ],
        {
          op: 'delete',
          path: 'jerry.description',
          oldValue: 'old jerry',
          newValue: undefined,
        },
      ];

      expect(splitActionHistoryByEntity(history, 'tom')).toEqual({
        matching: [
          {
            op: 'set',
            path: 'tom.description',
            oldValue: 'old tom',
            newValue: 'new tom',
          },
          {
            op: 'set',
            path: 'tom.name',
            oldValue: 'Tom',
            newValue: '汤姆',
          },
        ],
        remaining: [
          {
            op: 'set',
            path: 'jerry.name',
            oldValue: 'Jerry',
            newValue: '杰瑞',
          },
          {
            op: 'delete',
            path: 'jerry.description',
            oldValue: 'old jerry',
            newValue: undefined,
          },
        ],
      });
    });

    it('should treat an empty entity id as matching all actions', () => {
      const history: ActionHistoryEntry[] = [
        {
          op: 'set',
          path: 'fork.description',
          oldValue: 'old',
          newValue: 'new',
        },
      ];

      expect(splitActionHistoryByEntity(history, '')).toEqual({
        matching: history,
        remaining: [],
      });
    });
  });

  describe('buildDraftSummaryItemsForType', () => {
    it('should build counted summary items using resolved item labels', () => {
      const history: ActionHistoryEntry[] = [
        {
          op: 'set',
          path: 'fork.description',
          oldValue: 'old',
          newValue: 'new',
        },
        {
          op: 'set',
          path: 'fork.cooldown',
          oldValue: 1,
          newValue: 2,
        },
        {
          op: 'set',
          path: 'plate.description',
          oldValue: 'old',
          newValue: 'new',
        },
      ];

      expect(
        buildDraftSummaryItemsForType('items', history, ({ entityId }) =>
          entityId === 'fork' ? '叉子' : undefined
        )
      ).toEqual([
        {
          entityType: 'items',
          entityLabel: '道具',
          entityId: 'fork',
          itemLabel: '叉子',
          count: 2,
        },
        {
          entityType: 'items',
          entityLabel: '道具',
          entityId: 'plate',
          itemLabel: 'plate',
          count: 1,
        },
      ]);
    });

    it('should include faction ids for special skill draft paths', () => {
      const history: ActionHistoryEntry[] = [
        {
          op: 'set',
          path: 'cat.weapon.description',
          oldValue: 'old cat',
          newValue: 'new cat',
        },
        {
          op: 'set',
          path: 'mouse.weapon.description',
          oldValue: 'old mouse',
          newValue: 'new mouse',
        },
      ];

      expect(
        buildDraftSummaryItemsForType(
          'specialSkills',
          history,
          ({ factionId, entityId }) => `${factionId}:${entityId}`
        )
      ).toEqual([
        {
          entityType: 'specialSkills',
          entityLabel: '特技',
          entityId: 'weapon',
          itemLabel: 'cat:weapon',
          count: 1,
          factionId: 'cat',
        },
        {
          entityType: 'specialSkills',
          entityLabel: '特技',
          entityId: 'weapon',
          itemLabel: 'mouse:weapon',
          count: 1,
          factionId: 'mouse',
        },
      ]);
    });
  });

  describe('sortDraftSummaryItems', () => {
    it('should sort by count, entity label, then item label using zh-CN collation', () => {
      expect(
        sortDraftSummaryItems([
          {
            entityType: 'items',
            entityLabel: '道具',
            entityId: 'plate',
            itemLabel: '盘子',
            count: 1,
          },
          {
            entityType: 'characters',
            entityLabel: '角色',
            entityId: 'tom',
            itemLabel: '汤姆',
            count: 3,
          },
          {
            entityType: 'items',
            entityLabel: '道具',
            entityId: 'fork',
            itemLabel: '叉子',
            count: 1,
          },
        ])
      ).toEqual([
        expect.objectContaining({ entityId: 'tom' }),
        expect.objectContaining({ entityId: 'fork' }),
        expect.objectContaining({ entityId: 'plate' }),
      ]);
    });
  });
});
