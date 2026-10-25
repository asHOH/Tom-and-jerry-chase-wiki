import { waitFor } from '@testing-library/react';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import type { EditHistoryStore } from '@/lib/edit/editModeRegistry';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';
import type { CharacterPairRelation } from '@/data/types';

import { createEditSession, type EditSession, type EditSessionDependencies } from './editSession';

const baseline = {
  achievements: { cat: {}, mouse: {} },
  buffs: {},
  cards: {},
  characters: {
    杰瑞: {
      id: '杰瑞',
      name: '杰瑞',
      description: '原描述',
      skills: [],
      knowledgeCardGroups: [],
      createDate: null,
    },
    汤姆: {
      id: '汤姆',
      name: '汤姆',
      description: '原描述',
      skills: [],
      knowledgeCardGroups: [],
      createDate: null,
    },
  },
  entities: {},
  fixtures: {},
  items: {},
  maps: {},
  modes: {},
  specialSkills: { cat: {}, mouse: {} },
  traits: {},
} as unknown as PublishedGameDataByType;

function memoryHistory(
  initial: Partial<Record<keyof PublishedGameDataByType, ActionHistoryEntry[]>>
) {
  const values = new Map(Object.entries(initial)) as Map<
    keyof PublishedGameDataByType,
    ActionHistoryEntry[]
  >;
  const store: EditHistoryStore = {
    read: (entityType) => structuredClone(values.get(entityType) ?? []),
    append: (entityType, entry) => {
      values.set(entityType, [...(values.get(entityType) ?? []), structuredClone(entry)]);
    },
    replace: (entityType, history) => {
      values.set(entityType, structuredClone(history));
      return true;
    },
  };
  return {
    store,
    read: (entityType: keyof PublishedGameDataByType) => values.get(entityType) ?? [],
  };
}

describe('createEditSession', () => {
  let session: EditSession | null = null;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    session?.dispose();
    session = null;
    window.localStorage.clear();
    window.sessionStorage.clear();
    Reflect.deleteProperty(global, 'fetch');
  });

  it('restores and records browser drafts through the session boundary', async () => {
    const storageKey = getEditModeActionsStorageKey('characters');
    window.localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          op: 'set',
          path: '杰瑞.description',
          oldValue: '原描述',
          newValue: '浏览器草稿',
        },
      ])
    );

    session = createEditSession(baseline, 'v1:test');
    expect(session.readEntity({ entityType: 'characters', entityId: '杰瑞' })?.description).toBe(
      '浏览器草稿'
    );

    session.updateEntity({ entityType: 'characters', entityId: '杰瑞' }, (character) => {
      character.description = '继续编辑';
    });

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(2);
    });
  });

  it('restores existing history before recording new edits and disposes idempotently', async () => {
    const restored = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '已恢复',
    };
    const history = memoryHistory({ characters: [restored] });
    session = createEditSession(baseline, 'v1:test', { history: history.store });
    const listener = jest.fn();
    session.subscribe({ kind: 'domain', entityType: 'characters' }, listener);

    expect(session.readEntity({ entityType: 'characters', entityId: '杰瑞' })?.description).toBe(
      '已恢复'
    );
    expect(history.read('characters')).toEqual([restored]);

    session.updateEntity({ entityType: 'characters', entityId: '杰瑞' }, (character) => {
      character.description = '新描述';
    });
    await Promise.resolve();
    expect(history.read('characters')).toHaveLength(2);
    expect(listener).toHaveBeenCalled();

    session.dispose();
    session.dispose();
    listener.mockClear();
    expect(() => session?.readDomain('characters')).toThrow('disposed');
  });

  it.each([{ aliases: ['原别名'] }, { aliases: undefined }])(
    'hides canceled container edits in the live draft and submits nothing: %j',
    async ({ aliases }) => {
      const history = memoryHistory({});
      const publish = jest.fn(async () => ({
        status: 'published' as const,
        outcome: 'pending' as const,
      }));
      session = createEditSession(
        {
          ...baseline,
          characters: {
            ...baseline.characters,
            杰瑞: { ...baseline.characters.杰瑞!, ...(aliases ? { aliases } : {}) },
          },
        },
        'v1:test',
        { history: history.store, publish }
      );
      const entity = { entityType: 'characters', entityId: '杰瑞' } as const;
      const scope = { kind: 'entity', entity } as const;

      session.updateEntity(entity, (character) => {
        if (aliases) delete character.aliases;
        else character.aliases = ['临时别名'];
      });
      await Promise.resolve();
      expect(session.readDraft(scope).actionCount).toBe(1);

      session.updateEntity(entity, (character) => {
        if (aliases) character.aliases = [...aliases];
        else delete character.aliases;
      });
      await Promise.resolve();
      expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
      expect(session.readDraftOverview()).toEqual([]);
      expect(history.read('characters')).toHaveLength(2);
      await expect(session.publishDraft(scope)).resolves.toEqual({ status: 'empty' });
      expect(publish).not.toHaveBeenCalled();
      expect(history.read('characters')).toEqual([]);
    }
  );

  it('discards relation actions while preserving ordinary character drafts', () => {
    const relation = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    const ordinary = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '新描述',
    };
    const history = memoryHistory({ characters: [relation, ordinary] });
    session = createEditSession(baseline, 'v1:test', {
      history: history.store,
      invalidate: jest.fn(),
    });

    expect(session.readDraft({ kind: 'character-relations' }).actionCount).toBe(1);
    expect(session.discardDraft({ kind: 'character-relations' })).toEqual({
      status: 'discarded',
    });
    expect(history.read('characters')).toEqual([ordinary]);
    expect(session.readDraft({ kind: 'character-relations' }).actionCount).toBe(0);
    expect(
      session.readDraft({ kind: 'entity', entity: { entityType: 'characters', entityId: '杰瑞' } })
        .actionCount
    ).toBe(1);
  });

  it('restores the live draft when discard persistence fails', () => {
    const draft = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '新描述',
    };
    const history = memoryHistory({ characters: [draft] });
    let replaceSucceeds = false;
    const store: EditHistoryStore = {
      ...history.store,
      replace: (entityType, entries) =>
        replaceSucceeds && history.store.replace(entityType, entries),
    };
    session = createEditSession(baseline, 'v1:test', { history: store, invalidate: jest.fn() });

    expect(
      session.discardDraft({
        kind: 'entity',
        entity: { entityType: 'characters', entityId: '杰瑞' },
      }).status
    ).toBe('storage-failed');
    expect(session.readEntity({ entityType: 'characters', entityId: '杰瑞' })?.description).toBe(
      '新描述'
    );
    expect(history.read('characters')).toEqual([draft]);

    replaceSucceeds = true;
    expect(
      session.discardDraft({
        kind: 'entity',
        entity: { entityType: 'characters', entityId: '杰瑞' },
      })
    ).toEqual({ status: 'discarded' });
    expect(session.readEntity({ entityType: 'characters', entityId: '杰瑞' })?.description).toBe(
      '原描述'
    );
  });

  it('publishes through the injected transport and preserves entries appended in flight', async () => {
    const submitted = {
      op: 'set' as const,
      path: '杰瑞.counters',
      oldValue: [],
      newValue: [{ id: '汤姆' }],
    };
    const unrelated = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '新描述',
    };
    const appended = {
      op: 'set' as const,
      path: '汤姆.counteredBy',
      oldValue: [],
      newValue: [{ id: '杰瑞' }],
    };
    const history = memoryHistory({ characters: [submitted, unrelated] });
    let finish!: () => void;
    const waiting = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const publish = jest.fn(async () => {
      await waiting;
      return { status: 'published' as const, outcome: 'pending' as const };
    });
    session = createEditSession(baseline, 'v1:test', { history: history.store, publish });

    const resultPromise = session.publishDraft(
      { kind: 'character-relations' },
      { message: '关系更新', submitMode: 'force_pending' }
    );
    history.store.append('characters', appended);
    finish();

    await expect(resultPromise).resolves.toEqual({ status: 'published', outcome: 'pending' });
    expect(publish).toHaveBeenCalledWith({
      endpoint: '/api/game-data-actions/publish-relations',
      operationId: expect.any(String),
      body: {
        entries: [submitted],
        message: '关系更新',
        submitMode: 'force_pending',
      },
    });
    expect(history.read('characters')).toEqual([unrelated, appended]);
  });

  describe('shared character relation drafts', () => {
    const pairBaseline = {
      ...baseline,
      characters: Object.fromEntries(
        ['A', 'B', 'C'].map((id) => [id, { ...baseline.characters.杰瑞!, id }])
      ),
    } as PublishedGameDataByType;
    const relation: CharacterPairRelation = {
      kind: 'counters',
      description: 'Shared description',
      isMinor: false,
    };
    const targetScope = {
      kind: 'entity',
      entity: { entityType: 'characters', entityId: 'B' },
    } as const;
    const pairPath = 'A.characterRelationOverrides.B';

    it('records initial map writes as independent pairs visible from either endpoint', async () => {
      const history = memoryHistory({});
      session = createEditSession(pairBaseline, 'v1:test', { history: history.store });
      session.updateDomain('characters', (characters) => {
        characters.A!.characterRelationOverrides = {};
        characters.A!.characterRelationOverrides.B = { ...relation };
        characters.A!.characterRelationOverrides.C = { ...relation, isMinor: true };
      });
      await Promise.resolve();

      expect(history.read('characters').flat()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: pairPath, newValue: relation }),
          expect.objectContaining({ path: 'A.characterRelationOverrides.C' }),
        ])
      );
      expect(
        history
          .read('characters')
          .flat()
          .every((action) => action.path.split('.').length === 3)
      ).toBe(true);
      expect(session.readDraft(targetScope)).toEqual({
        actionCount: 1,
        publishEntries: [{ op: 'set', path: pairPath, oldValue: undefined, newValue: relation }],
      });
      expect(session.readDraftOverview()).toEqual([
        { entityType: 'characters', entityId: 'A', actionCount: 2 },
        { entityType: 'characters', entityId: 'B', actionCount: 1 },
        { entityType: 'characters', entityId: 'C', actionCount: 1 },
      ]);
    });

    it.each(['publish', 'discard'] as const)(
      'can %s from the target while preserving another pair and owner prose',
      async (operation) => {
        const history = memoryHistory({});
        const publish = jest.fn(async () => ({
          status: 'published' as const,
          outcome: 'pending' as const,
        }));
        session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });
        session.updateDomain('characters', (characters) => {
          characters.A!.characterRelationOverrides = {};
          characters.A!.characterRelationOverrides.B = { ...relation };
          characters.A!.characterRelationOverrides.C = { ...relation, isMinor: true };
          characters.A!.description = 'Unrelated owner prose';
        });
        await Promise.resolve();

        if (operation === 'publish') {
          await expect(session.publishDraft(targetScope)).resolves.toEqual({
            status: 'published',
            outcome: 'pending',
          });
          expect(publish).toHaveBeenCalledWith(
            expect.objectContaining({
              body: {
                entityType: 'characters',
                entries: [{ op: 'set', path: pairPath, oldValue: undefined, newValue: relation }],
              },
            })
          );
        } else {
          expect(session.discardDraft(targetScope)).toEqual({ status: 'discarded' });
          expect(session.readDomain('characters').A!.characterRelationOverrides?.B).toBeUndefined();
        }

        expect(session.readDomain('characters').A!.characterRelationOverrides?.C).toEqual({
          ...relation,
          isMinor: true,
        });
        expect(session.readDomain('characters').A!.description).toBe('Unrelated owner prose');
        expect(session.readDraft(targetScope).actionCount).toBe(0);
        expect(session.readDraft({ kind: 'character-relations' }).publishEntries).toEqual([
          expect.objectContaining({ path: 'A.characterRelationOverrides.C' }),
        ]);
      }
    );

    it('normalizes restored map replacements before target-side discard', () => {
      const history = memoryHistory({
        characters: [
          {
            op: 'set',
            path: 'A.characterRelationOverrides',
            oldValue: undefined,
            newValue: { B: relation, C: null },
          },
        ],
      });
      session = createEditSession(pairBaseline, 'v1:test', { history: history.store });

      expect(session.readDraft(targetScope).actionCount).toBe(1);
      expect(session.discardDraft(targetScope)).toEqual({ status: 'discarded' });
      expect(session.readDomain('characters').A!.characterRelationOverrides).toEqual({ C: null });
      session.dispose();
      session = createEditSession(pairBaseline, 'v1:test', { history: history.store });
      expect(session.readDomain('characters').A!.characterRelationOverrides).toEqual({ C: null });
    });

    it('preserves the stored map draft if normalization cannot be persisted', () => {
      const original = {
        op: 'set' as const,
        path: 'A.characterRelationOverrides',
        oldValue: undefined,
        newValue: { B: relation },
      };
      const history = memoryHistory({ characters: [original] });

      expect(() =>
        createEditSession(pairBaseline, 'v1:test', {
          history: { ...history.store, replace: () => false },
        })
      ).toThrow('Failed to restore one or more edit-mode drafts.');
      expect(history.read('characters')).toEqual([original]);
    });

    it('keeps the pair draft and live value when target-side discard persistence fails', () => {
      const draft = { op: 'set' as const, path: pairPath, oldValue: undefined, newValue: relation };
      const history = memoryHistory({ characters: [draft] });
      session = createEditSession(pairBaseline, 'v1:test', {
        history: { ...history.store, replace: () => false },
      });

      expect(session.discardDraft(targetScope).status).toBe('storage-failed');
      expect(session.readDomain('characters').A!.characterRelationOverrides?.B).toEqual(relation);
      expect(history.read('characters')).toEqual([draft]);
    });

    it.each(['retry', 'discard'] as const)(
      'shares the standalone pair operation across endpoints for %s',
      async (operation) => {
        const draft = {
          op: 'set' as const,
          path: pairPath,
          oldValue: undefined,
          newValue: relation,
        };
        const history = memoryHistory({ characters: [draft] });
        const publish = jest
          .fn(async (_request: Parameters<NonNullable<EditSessionDependencies['publish']>>[0]) => ({
            status: 'published' as const,
            outcome: 'pending' as const,
          }))
          .mockRejectedValueOnce(new Error('Unknown network outcome'));
        session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });
        const ownerScope = {
          kind: 'entity',
          entity: { entityType: 'characters', entityId: 'A' },
        } as const;

        expect((await session.publishDraft(targetScope)).status).toBe('failed');
        const operationKey = `game-data-publish-operation:v1:${encodeURIComponent(`relations:pair:${pairPath}`)}`;
        expect(window.sessionStorage.getItem(operationKey)).not.toBeNull();
        if (operation === 'retry') {
          expect((await session.publishDraft(ownerScope)).status).toBe('published');
          expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
        } else {
          expect(session.discardDraft(ownerScope)).toEqual({ status: 'discarded' });
        }
        expect(window.sessionStorage.getItem(operationKey)).toBeNull();
      }
    );

    it.each([
      {
        label: 'character to matrix',
        originalScope: targetScope,
        retryScope: { kind: 'character-relations' } as const,
        endpoint: '/api/game-data-actions/publish',
      },
      {
        label: 'matrix to character',
        originalScope: { kind: 'character-relations' } as const,
        retryScope: targetScope,
        endpoint: '/api/game-data-actions/publish-relations',
      },
    ])(
      'retries an unknown $label outcome with the original transport after restore',
      async (scenario) => {
        const draft = {
          op: 'set' as const,
          path: pairPath,
          oldValue: undefined,
          newValue: relation,
        };
        const history = memoryHistory({ characters: [draft] });
        const publish = jest
          .fn(async (_request: Parameters<NonNullable<EditSessionDependencies['publish']>>[0]) => ({
            status: 'published' as const,
            outcome: 'pending' as const,
          }))
          .mockRejectedValueOnce(new Error('Unknown network outcome'));
        const options = { message: 'Pair update', submitMode: 'force_pending' as const };
        session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });

        expect((await session.publishDraft(scenario.originalScope, options)).status).toBe('failed');
        expect(publish.mock.calls[0]![0].endpoint).toBe(scenario.endpoint);
        expect(history.read('characters')).toEqual([draft]);
        session.dispose();
        session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });

        expect((await session.publishDraft(scenario.retryScope, options)).status).toBe('published');
        expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
        expect(history.read('characters')).toEqual([]);
      }
    );

    it('keeps changed pair drafts blocked when retrying through the other transport', async () => {
      const draft = {
        op: 'set' as const,
        path: pairPath,
        oldValue: undefined,
        newValue: relation,
      };
      const history = memoryHistory({ characters: [draft] });
      const publish = jest.fn(async () => {
        throw new Error('Unknown network outcome');
      });
      session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });

      expect((await session.publishDraft(targetScope)).status).toBe('failed');
      session.updateDomain('characters', (characters) => {
        characters.A!.characterRelationOverrides!.B = {
          ...relation,
          description: 'A changed draft',
        };
      });
      await Promise.resolve();

      await expect(session.publishDraft({ kind: 'character-relations' })).resolves.toEqual({
        status: 'failed',
        error: new Error('publish_operation_conflict'),
      });
      expect(publish).toHaveBeenCalledTimes(1);
      expect(session.readDraft(targetScope).publishEntries).toEqual([
        expect.objectContaining({ newValue: { ...relation, description: 'A changed draft' } }),
      ]);
    });

    it('preserves new edits to the submitted pair and another pair during publication', async () => {
      const history = memoryHistory({});
      let finish!: () => void;
      const waiting = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const publish = jest.fn(async () => {
        await waiting;
        return { status: 'published' as const, outcome: 'pending' as const };
      });
      session = createEditSession(pairBaseline, 'v1:test', { history: history.store, publish });
      session.updateDomain('characters', (characters) => {
        characters.A!.characterRelationOverrides = { B: { ...relation } };
      });
      await Promise.resolve();

      const publishing = session.publishDraft(targetScope);
      const updated = { ...relation, description: 'A later edit' };
      session.updateDomain('characters', (characters) => {
        characters.A!.characterRelationOverrides!.B = updated;
        characters.A!.characterRelationOverrides!.C = null;
      });
      await Promise.resolve();
      finish();
      await expect(publishing).resolves.toEqual({ status: 'published', outcome: 'pending' });

      expect(session.readDraft(targetScope).publishEntries).toEqual([
        { op: 'set', path: pairPath, oldValue: relation, newValue: updated },
      ]);
      expect(session.readDraft({ kind: 'character-relations' }).actionCount).toBe(2);
      expect(session.discardDraft(targetScope)).toEqual({ status: 'discarded' });
      expect(session.readDomain('characters').A!.characterRelationOverrides).toEqual({
        B: relation,
        C: null,
      });
    });
  });

  it.each([
    {
      label: 'a stale 409',
      response: {
        ok: false,
        status: 409,
        json: async () => ({ error: 'stale_edit', message: '字段已变化，草稿已保留。' }),
      } as Response,
      operationRemains: false,
    },
    {
      label: 'a validation 422',
      response: {
        ok: false,
        status: 422,
        json: async () => ({ error: 'invalid_game_data', message: '字段不受支持，草稿已保留。' }),
      } as Response,
      operationRemains: false,
    },
    {
      label: 'an unknown server response',
      response: {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response,
      operationRemains: true,
    },
  ])('retains the draft and clears its operation only for $label', async (scenario) => {
    const draft = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '旧草稿',
    };
    const history = memoryHistory({ characters: [draft] });
    global.fetch = jest.fn().mockResolvedValue(scenario.response);
    session = createEditSession(baseline, 'v1:test', { history: history.store });

    const result = await session.publishDraft({
      kind: 'entity',
      entity: { entityType: 'characters', entityId: '杰瑞' },
    });

    expect(result.status).toBe('failed');
    expect(history.read('characters')).toEqual([draft]);
    const storedOperation = window.sessionStorage.getItem(
      `game-data-publish-operation:v1:${encodeURIComponent('page:characters:杰瑞')}`
    );
    expect(storedOperation !== null).toBe(scenario.operationRemains);
  });

  it('keeps a publish operation after a network failure', async () => {
    const draft = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: '原描述',
      newValue: '旧草稿',
    };
    const history = memoryHistory({ characters: [draft] });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable'));
    session = createEditSession(baseline, 'v1:test', { history: history.store });

    const result = await session.publishDraft({
      kind: 'entity',
      entity: { entityType: 'characters', entityId: '杰瑞' },
    });

    expect(result.status).toBe('failed');
    expect(history.read('characters')).toEqual([draft]);
    expect(
      window.sessionStorage.getItem(
        `game-data-publish-operation:v1:${encodeURIComponent('page:characters:杰瑞')}`
      )
    ).not.toBeNull();
  });

  it('rolls back construction when draft restoration throws', () => {
    const error = new Error('broken history');
    const dependencies: EditSessionDependencies = {
      history: {
        read: () => {
          throw error;
        },
        append: jest.fn(),
        replace: jest.fn(() => true),
      },
    };

    expect(() => createEditSession(baseline, 'v1:test', dependencies)).toThrow(
      'Failed to restore one or more edit-mode drafts.'
    );
  });
});
