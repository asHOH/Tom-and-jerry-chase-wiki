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

  it('rejects dependent top-level rows before grouping is enabled', () => {
    try {
      preparePublishActionItems([
        {
          entityType: 'characters',
          entries: [
            { op: 'set', path: '汤姆.description', newValue: 'first' },
            { op: 'set', path: '汤姆.description', newValue: 'second' },
          ],
        },
      ]);
      throw new Error('Expected dependent rows to be rejected');
    } catch (error) {
      expect(error).toBeInstanceOf(PublishPreparationError);
      expect((error as PublishPreparationError).detail).toEqual({
        code: 'dependent_rows',
        entityType: 'characters',
        dependencyGroups: [
          {
            rowIndexes: [0, 1],
            rows: [
              {
                rowIndex: 0,
                actions: [{ op: 'set', path: '汤姆.description' }],
                omittedActionCount: 0,
              },
              {
                rowIndex: 1,
                actions: [{ op: 'set', path: '汤姆.description' }],
                omittedActionCount: 0,
              },
            ],
            omittedRowCount: 0,
          },
        ],
        omittedDependencyGroupCount: 0,
      });
    }
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
    'rejects a direct index assignment paired with sibling %s',
    (sibling) => {
      expect(() =>
        preparePublishActionItems([
          {
            entityType: 'characters',
            entries: [
              { op: 'set', path: '汤姆.aliases.0', newValue: 'first' },
              { op: 'set', path: `汤姆.aliases.${sibling}.name`, newValue: 'second' },
            ],
          },
        ])
      ).toThrow(
        expect.objectContaining({
          detail: expect.objectContaining({ code: 'dependent_rows' }),
        })
      );
    }
  );

  it('checks dependencies across repeated items for the same entity type', () => {
    expect(() =>
      preparePublishActionItems([
        {
          entityType: 'characters',
          entries: [{ op: 'set', path: '汤姆.description', newValue: 'first' }],
        },
        {
          entityType: 'characters',
          entries: [{ op: 'set', path: '汤姆.description', newValue: 'second' }],
        },
      ])
    ).toThrow(
      expect.objectContaining({
        detail: expect.objectContaining({ code: 'dependent_rows' }),
      })
    );
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
