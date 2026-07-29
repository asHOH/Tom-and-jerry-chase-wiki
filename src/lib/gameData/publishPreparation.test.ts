import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';

import { applyCheckedActionRow } from './checkedActionReplay';
import { PUBLISH_LIMITS } from './publishLimits';
import {
  preparePublishActionItems,
  PublishPreparationError,
  readBoundedJsonBody,
} from './publishPreparation';

jest.mock('server-only', () => ({}), { virtual: true });

function createRequest(body: string): Request {
  const bytes = new TextEncoder().encode(body);
  let delivered = false;

  return {
    headers: { get: () => null },
    body: {
      getReader: () => ({
        read: async () => {
          if (delivered) return { done: true as const, value: undefined };
          delivered = true;
          return { done: false as const, value: bytes };
        },
        cancel: async () => undefined,
      }),
    },
  } as unknown as Request;
}

describe('readBoundedJsonBody', () => {
  it('parses a body within the byte limit', async () => {
    const request = createRequest(JSON.stringify({ entries: [] }));

    await expect(readBoundedJsonBody(request)).resolves.toEqual({ entries: [] });
  });

  it('rejects an oversized streamed body without trusting Content-Length', async () => {
    const request = createRequest(
      JSON.stringify({ value: 'x'.repeat(PUBLISH_LIMITS.requestBytes) })
    );

    await expect(readBoundedJsonBody(request)).rejects.toMatchObject({
      detail: { code: 'request_too_large' },
    });
  });
});

describe('preparePublishActionItems', () => {
  it('strictly decodes rows and returns canonical persistence values', () => {
    const result = preparePublishActionItems(
      [
        {
          entityType: ' characters ',
          entries: [{ op: 'set', path: ' 汤姆.description ', newValue: 'new' }],
        },
      ],
      '  message  '
    );

    expect(result).toEqual({
      actions: [
        {
          entityType: 'characters',
          rows: [
            {
              canonicalEntry: { op: 'set', path: '汤姆.description', newValue: 'new' },
              actions: [
                { op: 'set', path: '汤姆.description', oldValue: undefined, newValue: 'new' },
              ],
            },
          ],
        },
      ],
      message: 'message',
    });
  });

  it('rejects unknown fields instead of dropping them', () => {
    expect(() =>
      preparePublishActionItems([
        {
          entityType: 'items',
          entries: [{ op: 'set', path: '道具.description', newValue: 'new', unexpected: true }],
        },
      ])
    ).toThrow(PublishPreparationError);
  });

  it('materializes dependent top-level rows as one ordered canonical row', () => {
    const result = preparePublishActionItems([
      {
        entityType: 'characters',
        entries: [
          { op: 'set', path: '汤姆.description', newValue: 'first' },
          { op: 'set', path: '汤姆.description', newValue: 'second' },
        ],
      },
    ]);

    expect(result.actions[0]?.rows).toEqual([
      {
        canonicalEntry: [
          { op: 'set', path: '汤姆.description', newValue: 'first' },
          { op: 'set', path: '汤姆.description', newValue: 'second' },
        ],
        actions: [
          {
            op: 'set',
            path: '汤姆.description',
            oldValue: undefined,
            newValue: 'first',
          },
          {
            op: 'set',
            path: '汤姆.description',
            oldValue: undefined,
            newValue: 'second',
          },
        ],
      },
    ]);
  });

  it('groups a sanitized child-then-parent structural-array reproduction', () => {
    const result = preparePublishActionItems([
      {
        entityType: 'characters',
        entries: [
          {
            op: 'set',
            path: '汤姆.knowledgeCardGroups.5',
            newValue: { name: 'new group' },
          },
          {
            op: 'set',
            path: '汤姆.knowledgeCardGroups',
            newValue: [{ name: 'replacement' }],
          },
        ],
      },
    ]);

    expect(result.actions[0]?.rows).toHaveLength(1);
    expect(result.actions[0]?.rows[0]?.canonicalEntry).toEqual([
      {
        op: 'set',
        path: '汤姆.knowledgeCardGroups.5',
        newValue: { name: 'new group' },
      },
      {
        op: 'set',
        path: '汤姆.knowledgeCardGroups',
        newValue: [{ name: 'replacement' }],
      },
    ]);
  });

  it('moves a noncontiguous transitive group to its earliest member without changing replay', () => {
    const entries: ActionHistoryEntry[] = [
      { op: 'set', path: 'Tom.profile.name', oldValue: 'Tom', newValue: 'Thomas' },
      { op: 'set', path: 'Jerry.description', oldValue: 'old', newValue: 'independent' },
      {
        op: 'set',
        path: 'Tom.profile',
        oldValue: { name: 'Thomas', title: 'Cat' },
        newValue: { name: 'Tommy', title: 'Mouse catcher' },
      },
      {
        op: 'set',
        path: 'Tom.profile.title',
        oldValue: 'Mouse catcher',
        newValue: 'Champion',
      },
    ];
    const result = preparePublishActionItems([{ entityType: 'characters', entries }]);

    expect(result.actions[0]?.rows.map((row) => row.canonicalEntry)).toEqual([
      [entries[0], entries[2], entries[3]],
      entries[1],
    ]);

    const originalTarget = {
      Tom: { profile: { name: 'Tom', title: 'Cat' } },
      Jerry: { description: 'old' },
    };
    const groupedTarget = structuredClone(originalTarget);
    for (const [rowIndex, entry] of entries.entries()) {
      expect(
        applyCheckedActionRow({
          rowId: `original:${rowIndex}`,
          actions: Array.isArray(entry) ? entry : [entry],
          targets: [originalTarget],
        })
      ).toMatchObject({ success: true });
    }
    for (const row of result.actions[0]!.rows) {
      expect(
        applyCheckedActionRow({
          rowId: 'grouped',
          actions: row.actions,
          targets: [groupedTarget],
        })
      ).toMatchObject({ success: true });
    }
    expect(groupedTarget).toEqual(originalTarget);
  });

  it('accepts distinct direct array-index assignments as separate canonical rows', () => {
    const result = preparePublishActionItems([
      {
        entityType: 'characters',
        entries: [
          { op: 'set', path: '汤姆.aliases.2', newValue: { name: '侦探汤姆' } },
          { op: 'set', path: '汤姆.aliases.3', newValue: { name: '海盗汤姆' } },
        ],
      },
    ]);

    expect(result.actions[0]?.rows).toHaveLength(2);
    expect(result.actions[0]?.rows.map((row) => row.canonicalEntry)).toEqual([
      { op: 'set', path: '汤姆.aliases.2', newValue: { name: '侦探汤姆' } },
      { op: 'set', path: '汤姆.aliases.3', newValue: { name: '海盗汤姆' } },
    ]);
  });

  it.each(['foo', '01', '1e2', '4294967295'])(
    'groups a direct index assignment paired with dependent sibling %s',
    (sibling) => {
      const result = preparePublishActionItems([
        {
          entityType: 'characters',
          entries: [
            { op: 'set', path: '汤姆.aliases.0', newValue: 'first' },
            { op: 'set', path: `汤姆.aliases.${sibling}.name`, newValue: 'second' },
          ],
        },
      ]);

      expect(result.actions[0]?.rows).toHaveLength(1);
      expect(result.actions[0]?.rows[0]?.canonicalEntry).toEqual([
        { op: 'set', path: '汤姆.aliases.0', newValue: 'first' },
        { op: 'set', path: `汤姆.aliases.${sibling}.name`, newValue: 'second' },
      ]);
    }
  );

  it('groups dependencies across repeated items for the same entity type', () => {
    const result = preparePublishActionItems([
      {
        entityType: 'characters',
        entries: [{ op: 'set', path: '汤姆.description', newValue: 'first' }],
      },
      {
        entityType: 'characters',
        entries: [{ op: 'set', path: '汤姆.description', newValue: 'second' }],
      },
    ]);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.rows).toHaveLength(1);
    expect(result.actions[0]?.rows[0]?.canonicalEntry).toEqual([
      { op: 'set', path: '汤姆.description', newValue: 'first' },
      { op: 'set', path: '汤姆.description', newValue: 'second' },
    ]);
  });

  it('accepts distinct direct indexes across repeated items for the same entity type', () => {
    const result = preparePublishActionItems([
      {
        entityType: 'characters',
        entries: [{ op: 'set', path: '汤姆.aliases.2', newValue: 'third' }],
      },
      {
        entityType: 'characters',
        entries: [{ op: 'set', path: '汤姆.aliases.3', newValue: 'fourth' }],
      },
    ]);

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]?.rows).toHaveLength(2);
  });

  it('rejects a dependency group that exceeds the per-row action limit', () => {
    const firstRow = Array.from(
      { length: Math.floor(PUBLISH_LIMITS.actionsPerRow / 2) + 1 },
      (_, index) => ({
        op: 'set' as const,
        path: `Tom.profile.field${index}`,
        newValue: `first-${index}`,
      })
    );
    const secondRow = Array.from(
      { length: Math.ceil(PUBLISH_LIMITS.actionsPerRow / 2) },
      (_, index) => ({
        op: 'set' as const,
        path: index === 0 ? 'Tom.profile' : `Tom.profile.extra${index}`,
        newValue: index === 0 ? {} : `second-${index}`,
      })
    );

    expect(() =>
      preparePublishActionItems([
        {
          entityType: 'characters',
          entries: [firstRow, secondRow],
        },
      ])
    ).toThrow(
      expect.objectContaining({
        detail: {
          code: 'too_many_actions_per_row',
          entityType: 'characters',
          entryIndex: 0,
        },
      })
    );
  });

  it('freezes path and message boundaries', () => {
    expect(() =>
      preparePublishActionItems([
        {
          entityType: 'items',
          entries: [
            {
              op: 'set',
              path: `item.${'x'.repeat(PUBLISH_LIMITS.pathCharacters)}`,
              newValue: true,
            },
          ],
        },
      ])
    ).toThrow(
      expect.objectContaining({
        detail: { code: 'path_too_long', entityType: 'items', entryIndex: 0 },
      })
    );

    expect(() =>
      preparePublishActionItems(
        [{ entityType: 'items', entries: [{ op: 'set', path: 'item.value', newValue: true }] }],
        'x'.repeat(PUBLISH_LIMITS.messageCharacters + 1)
      )
    ).toThrow(expect.objectContaining({ detail: { code: 'message_too_long' } }));
  });
});
