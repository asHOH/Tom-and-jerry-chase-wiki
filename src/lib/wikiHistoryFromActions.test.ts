import { WikiChangeType } from '@/data/types';

import type { PublicActionRow } from './gameData/publicActionsTypes';
import { publicActionsToWikiHistory } from './wikiHistoryFromActions';

const row = (
  id: string,
  entry: unknown,
  entityType = 'characters',
  message: string | null = null
): PublicActionRow => ({
  id,
  entity_type: entityType,
  entry,
  created_at: '2026-05-09T00:00:00.000Z',
  status: 'approved',
  message,
  reviewed_at: null,
  created_by: null,
});

function getBatchChanges(actions: PublicActionRow[]) {
  return (
    publicActionsToWikiHistory(actions)[0]?.events[0]?.details.data?.batchChanges?.[0]?.changes ??
    []
  );
}

describe('publicActionsToWikiHistory', () => {
  it('should convert a single action row into batch changes', () => {
    const changes = getBatchChanges([
      row('single-action', {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
      }),
    ]);

    expect(changes).toEqual([
      expect.objectContaining({
        item: { name: 'Tom', type: 'character' },
        changeType: WikiChangeType.UPDATE,
      }),
    ]);
  });

  it('should convert a plain action array into batch changes', () => {
    const changes = getBatchChanges([
      row(
        'plain-action-array',
        [
          {
            op: 'set',
            path: 'Tom.description',
            oldValue: 'old',
            newValue: 'new',
          },
          {
            op: 'set',
            path: 'Tom.EnglishName',
            oldValue: 'old',
            newValue: 'new',
          },
        ],
        'characters',
        '  完善角色资料  '
      ),
    ]);

    expect(changes).toEqual([
      expect.objectContaining({
        item: { name: 'Tom', type: 'character' },
        changeType: WikiChangeType.UPDATE,
        description: '完善角色资料',
      }),
    ]);
  });

  it('should convert mixed action history entries into batch changes', () => {
    const changes = getBatchChanges([
      row('mixed-entries', [
        {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        },
        [
          {
            op: 'delete',
            path: 'Jerry.counteredBy.0.tags.1.counteredBy',
            oldValue: '怕拉扯',
            newValue: undefined,
          },
        ],
      ]),
    ]);

    expect(changes.map((change) => change.item.name)).toEqual(['Tom', 'Jerry']);
    expect(changes[1]?.description).toBe('更新 第1个被克制对象的第2个关系标签的被克制方标签');
  });

  it('should skip invalid payloads', () => {
    const changes = getBatchChanges([
      row('valid-action', {
        op: 'set',
        path: 'Tom.description',
        oldValue: 'old',
        newValue: 'new',
      }),
      row('invalid-action', {
        op: 'replace',
        path: 'Spike.description',
      }),
    ]);

    expect(changes.map((change) => change.item.name)).toEqual(['Tom']);
  });

  it('should skip unknown entity types', () => {
    const changes = getBatchChanges([
      row(
        'unknown-entity-type',
        {
          op: 'set',
          path: 'Tom.description',
          oldValue: 'old',
          newValue: 'new',
        },
        'unknown'
      ),
    ]);

    expect(changes).toEqual([]);
  });

  it('should preserve faction-scoped achievement identity and field paths', () => {
    const changes = getBatchChanges([
      row(
        'achievement-action',
        {
          op: 'set',
          path: 'cat.翻盘.description',
          oldValue: 'old',
          newValue: 'new',
        },
        'achievements'
      ),
    ]);

    expect(changes).toEqual([
      expect.objectContaining({
        item: { name: '翻盘', type: 'achievement', factionId: 'cat' },
        changeType: WikiChangeType.UPDATE,
        description: '更新 描述',
      }),
    ]);
  });

  it('should preserve faction-scoped special-skill identity', () => {
    const changes = getBatchChanges([
      row(
        'special-skill-action',
        {
          op: 'set',
          path: 'mouse.急速翻滚.cooldown',
          oldValue: 1,
          newValue: 2,
        },
        'specialSkills'
      ),
    ]);

    expect(changes[0]).toEqual(
      expect.objectContaining({
        item: { name: '急速翻滚', type: 'specialSkill', factionId: 'mouse' },
        description: '更新 冷却时间',
      })
    );
  });
});
