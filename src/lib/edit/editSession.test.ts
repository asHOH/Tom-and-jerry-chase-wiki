import { waitFor } from '@testing-library/react';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import type { EditHistoryStore } from '@/lib/edit/editModeRegistry';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import {
  getOrCreatePublishOperationId,
  getPublishOperationFingerprint,
  readPublishOperation,
} from '@/lib/gameData/publishOperation';
import { preparePublishActionItems } from '@/lib/gameData/publishPreparation';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';
import { characters } from '@/data/static';
import type { CharacterPairRelation, Trait } from '@/data/types';
import {
  addCharacterRelationItem,
  removeCharacterRelationItem,
  updateCharacterRelationDescription,
} from '@/features/characters/utils/characterRelationOverlay';
import { getExplicitCharacterRelation } from '@/features/characters/utils/relationReadModel';

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

  it.each([false, true])('keeps OR edits compact (existing trait: %s)', async (existing) => {
    const trait: Trait = {
      description: 'trait',
      group: [
        { name: 'Tom', type: 'character' },
        { name: 'Jerry', type: 'character' },
        Array.from({ length: 7 }, (_, index) => ({ name: `item${index}`, type: 'item' })),
      ],
    };
    const data = { ...baseline, traits: existing ? { newTrait: trait } : {} };
    session = createEditSession(data, 'v1:test');
    const scope = { kind: 'domain', entityType: 'traits' } as const;
    if (!existing) {
      session.updateDomain('traits', (draft) => {
        draft.newTrait = { description: trait.description, group: [] };
      });
      await Promise.resolve();
      session.updateDomain('traits', (draft) => {
        draft.newTrait!.group = structuredClone(trait.group);
      });
      await Promise.resolve();
    }
    for (let index = 0; index < 170; index += 1) {
      session.updateDomain('traits', (draft) => {
        const alternatives = draft.newTrait!.group[2];
        if (Array.isArray(alternatives)) alternatives[0]!.name += 'a';
      });
      await Promise.resolve();
    }
    expect(session.readDraft(scope).actionCount).toBe(1);
    session.updateDomain('traits', (draft) => {
      const alternatives = draft.newTrait!.group[2];
      if (Array.isArray(alternatives)) alternatives.splice(2, 1);
    });
    await Promise.resolve();
    const recordedEntries: unknown = JSON.parse(
      window.localStorage.getItem(getEditModeActionsStorageKey('traits')) ?? '[]'
    );
    expect(() =>
      preparePublishActionItems([{ entityType: 'traits', entries: recordedEntries }])
    ).toThrow('too_many_actions_per_row');
    expect(session.readDraft(scope)).toEqual({
      actionCount: 1,
      publishEntries: [
        {
          op: 'set',
          path: existing ? 'newTrait.group' : 'newTrait',
          oldValue: existing ? trait.group : undefined,
          newValue: existing
            ? session.readDomain('traits').newTrait!.group
            : session.readDomain('traits').newTrait,
        },
      ],
    });
    session.updateDomain('traits', (draft) => {
      draft.newTrait!.group.splice(0, 1);
      draft.newTrait!.group.push({ name: 'new item', type: 'item' });
    });
    await Promise.resolve();
    expect(session.readDraft(scope).actionCount).toBe(1);
    const draft = session.readDomain('traits');
    const entries = session.readDraft(scope).publishEntries;
    expect(() => preparePublishActionItems([{ entityType: 'traits', entries }])).not.toThrow();
    session.dispose();
    session = createEditSession(data, 'v1:test');
    expect(session.readDomain('traits')).toEqual(draft);
    expect(session.readDraft(scope).publishEntries).toEqual(entries);
    expect(session.discardDraft(scope)).toEqual({ status: 'discarded' });
    expect(session.readDomain('traits')).toEqual(data.traits);
  });

  it.each([false, true])('cancels a created then deleted trait (edited: %s)', async (edited) => {
    const publish = jest.fn();
    session = createEditSession(baseline, 'v1:test', { publish });
    const scope = { kind: 'domain', entityType: 'traits' } as const;
    session.updateDomain('traits', (draft) => {
      draft.newTrait = { description: '', group: [] };
    });
    await Promise.resolve();
    if (edited) {
      session.updateDomain('traits', (draft) => {
        draft.newTrait!.description = 'draft';
        draft.newTrait!.group.push({ name: 'Tom', type: 'character' });
      });
      await Promise.resolve();
    }
    session.updateDomain('traits', (draft) => {
      delete draft.newTrait;
    });
    await Promise.resolve();
    expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
    expect(session.readDraftOverview()).toEqual([]);
    await expect(session.publishDraft(scope)).resolves.toEqual({ status: 'empty' });
    expect(publish).not.toHaveBeenCalled();
  });

  it('compacts list edits and cancellation in a new optional character field', async () => {
    session = createEditSession(baseline, 'v1:test');
    const entity = { entityType: 'characters', entityId: '杰瑞' } as const;
    const scope = { kind: 'entity', entity } as const;
    session.updateEntity(entity, (draft) => {
      draft.aliases = ['A', 'B', 'C'];
    });
    await Promise.resolve();
    session.updateEntity(entity, (draft) => {
      draft.aliases!.splice(1, 1);
    });
    await Promise.resolve();
    expect(session.readDraft(scope)).toEqual({
      actionCount: 1,
      publishEntries: [
        { op: 'set', path: '杰瑞.aliases', oldValue: undefined, newValue: ['A', 'C'] },
      ],
    });
    session.updateEntity(entity, (draft) => {
      delete draft.aliases;
    });
    await Promise.resolve();
    expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
  });

  it.each(['unchanged', 'draft', 'delete', 'message', 'submitMode'] as const)(
    'preserves an unresolved pre-upgrade trait submission: %s',
    async (change) => {
      const trait: Trait = {
        description: 'trait',
        group: [
          { name: 'Tom', type: 'character' },
          { name: 'Jerry', type: 'character' },
        ],
      };
      const legacyEntries: ActionHistoryEntry[] = [
        { op: 'set', path: 'newTrait', oldValue: undefined, newValue: trait },
        [
          { op: 'delete', path: 'newTrait.group.1', oldValue: trait.group[1], newValue: undefined },
          { op: 'set', path: 'newTrait.group.length', oldValue: 2, newValue: 1 },
        ],
      ];
      const options = { message: 'Trait update', submitMode: 'force_pending' as const };
      const operationId = getOrCreatePublishOperationId(
        'page:traits:',
        getPublishOperationFingerprint({
          endpoint: '/api/game-data-actions/publish',
          entries: legacyEntries,
          ...options,
        })
      );
      const history = memoryHistory({ traits: legacyEntries });
      const publish = jest.fn(async () => ({
        status: 'published' as const,
        outcome: 'pending' as const,
      }));
      session = createEditSession(baseline, 'v1:test', { history: history.store, publish });
      const scope = { kind: 'domain', entityType: 'traits' } as const;
      expect(session.readDraft(scope).actionCount).toBe(1);
      if (change === 'draft' || change === 'delete') {
        session.updateDomain('traits', (draft) => {
          if (change === 'delete') delete draft.newTrait;
          else draft.newTrait!.description = 'changed';
        });
        await Promise.resolve();
      }
      const result = await session.publishDraft(scope, {
        message: change === 'message' ? 'changed' : options.message,
        submitMode: change === 'submitMode' ? 'default' : options.submitMode,
      });
      if (change === 'unchanged') {
        expect(result).toEqual({ status: 'published', outcome: 'pending' });
        expect(publish).toHaveBeenCalledWith({
          endpoint: '/api/game-data-actions/publish',
          operationId,
          body: { entityType: 'traits', entries: legacyEntries, ...options },
        });
        expect(history.read('traits')).toEqual([]);
        expect(readPublishOperation('page:traits:')).toBeNull();
      } else {
        expect(result).toEqual({
          status: 'failed',
          error: new Error('publish_operation_conflict'),
        });
        expect(publish).not.toHaveBeenCalled();
        expect(history.read('traits').length).toBeGreaterThan(0);
        expect(readPublishOperation('page:traits:')?.operationId).toBe(operationId);
      }
    }
  );

  it('retries an unchanged pre-upgrade zero-net submission with its original payload', async () => {
    const created: Trait = { description: 'trait', group: [] };
    const final: Trait = { ...created, group: [{ name: 'Tom', type: 'character' }] };
    const creation = {
      op: 'set' as const,
      path: 'newTrait',
      oldValue: undefined,
      newValue: created,
    };
    const deletion = {
      op: 'delete' as const,
      path: 'newTrait',
      oldValue: final,
      newValue: undefined,
    };
    const legacyEntries = [{ ...creation, newValue: final }, deletion];
    const history = memoryHistory({
      traits: [
        creation,
        {
          op: 'set',
          path: 'newTrait.group',
          oldValue: [],
          newValue: final.group,
        },
        deletion,
      ],
    });
    const operationId = getOrCreatePublishOperationId(
      'page:traits:',
      getPublishOperationFingerprint({
        endpoint: '/api/game-data-actions/publish',
        entries: legacyEntries,
        message: null,
        submitMode: 'default',
      })
    );
    const publish = jest.fn(async () => ({
      status: 'published' as const,
      outcome: 'pending' as const,
    }));
    session = createEditSession(baseline, 'v1:test', { history: history.store, publish });
    const scope = { kind: 'domain', entityType: 'traits' } as const;
    expect(session.readDraft(scope).actionCount).toBe(0);
    await expect(session.publishDraft(scope)).resolves.toEqual({
      status: 'published',
      outcome: 'pending',
    });
    expect(publish).toHaveBeenCalledWith({
      endpoint: '/api/game-data-actions/publish',
      operationId,
      body: { entityType: 'traits', entries: legacyEntries },
    });
    expect(readPublishOperation('page:traits:')).toBeNull();
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

  it.each([false, true])('discards an empty relation edit with another edit: %s', async (mixed) => {
    const history = memoryHistory({});
    const publish = jest.fn().mockResolvedValue({ status: 'published', outcome: 'pending' });
    session = createEditSession({ ...baseline, characters }, 'v1:test', {
      history: history.store,
      publish,
    });
    const scope = { kind: 'domain', entityType: 'characters' } as const;
    expect(getExplicitCharacterRelation(characters, '巴特').disadvantageModes).toEqual([]);
    session.updateDomain('characters', (draft) => {
      addCharacterRelationItem(draft, '巴特', 'disadvantageModes', {
        id: '经典模式',
        description: '',
        isMinor: false,
      });
    });
    await Promise.resolve();
    session.updateDomain('characters', (draft) => {
      removeCharacterRelationItem(draft, '巴特', 'disadvantageModes', '经典模式');
      if (mixed) draft.巴特!.description = 'changed';
    });
    await Promise.resolve();
    expect(session.readDraft(scope).actionCount).toBe(mixed ? 1 : 0);
    expect(session.readDraft({ kind: 'character-relations' }).publishEntries).toEqual([]);
    expect(session.readDraftOverview()).toHaveLength(mixed ? 1 : 0);
    await expect(session.publishDraft(scope)).resolves.toMatchObject({
      status: mixed ? 'published' : 'empty',
    });
    if (mixed) {
      expect(publish.mock.calls[0]![0].body.entries).toEqual([
        expect.objectContaining({ path: '巴特.description', newValue: 'changed' }),
      ]);
    } else expect(publish).not.toHaveBeenCalled();
    expect(history.read('characters')).toEqual([]);
    expect(session.readDomain('characters').巴特!).not.toHaveProperty('disadvantageModes');
    session.updateDomain('characters', (draft) => {
      addCharacterRelationItem(draft, '巴特', 'disadvantageModes', {
        id: '经典模式',
        description: '',
        isMinor: false,
      });
    });
    await Promise.resolve();
    expect(session.readDraft({ kind: 'character-relations' }).publishEntries).toEqual([
      expect.objectContaining({ path: '巴特.disadvantageModes', oldValue: undefined }),
    ]);
  });

  it.each(['shared', 'stored'] as const)(
    'preserves empty lists clearing %s relations',
    async (source) => {
      const characterId = source === 'shared' ? '剑客莉莉' : '巴特';
      const kind = 'advantageMaps';
      const stored = [{ id: '经典之家I', description: '', isMinor: false }];
      const data = structuredClone(characters);
      if (source === 'stored') Object.assign(data[characterId]!, { [kind]: stored });
      expect(getExplicitCharacterRelation(data, characterId)[kind].length).toBeGreaterThan(0);
      const action = {
        op: 'set' as const,
        path: `${characterId}.${kind}`,
        oldValue: source === 'stored' ? stored : undefined,
        newValue: [],
      };
      const history = memoryHistory({ characters: [action] });
      const publish = jest.fn().mockResolvedValue({ status: 'published', outcome: 'pending' });
      session = createEditSession({ ...baseline, characters: data }, 'v1:test', {
        history: history.store,
        publish,
      });
      const scope = { kind: 'character-relations' } as const;
      expect(session.readDraft(scope).publishEntries).toEqual([action]);
      await session.publishDraft(scope);
      expect(publish.mock.calls[0]![0].body.entries).toEqual([action]);
    }
  );

  it('retries a mixed submission with the same filtered payload after a network failure', async () => {
    const history = memoryHistory({
      characters: [
        { op: 'set', path: '巴特.disadvantageModes', oldValue: undefined, newValue: [] },
        {
          op: 'set',
          path: '巴特.description',
          oldValue: characters.巴特!.description,
          newValue: 'changed',
        },
      ],
    });
    const publish = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValue({ status: 'published', outcome: 'pending' });
    session = createEditSession({ ...baseline, characters }, 'v1:test', {
      history: history.store,
      publish,
    });
    const scope = { kind: 'domain', entityType: 'characters' } as const;
    expect((await session.publishDraft(scope)).status).toBe('failed');
    session.dispose();
    session = createEditSession({ ...baseline, characters }, 'v1:test', {
      history: history.store,
      publish,
    });
    expect((await session.publishDraft(scope)).status).toBe('published');
    expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
    expect(publish.mock.calls[0]![0].body.entries).toHaveLength(1);
    expect(session.readDomain('characters').巴特!).not.toHaveProperty('disadvantageModes');
    session.updateDomain('characters', (draft) => {
      addCharacterRelationItem(draft, '巴特', 'disadvantageModes', {
        id: '经典模式',
        description: '',
        isMinor: false,
      });
    });
    await Promise.resolve();
    expect(session.readDraft({ kind: 'character-relations' }).publishEntries).toEqual([
      expect.objectContaining({ path: '巴特.disadvantageModes', oldValue: undefined }),
    ]);
  });

  it('discards a description edit restored to the inherited nonempty relation list', async () => {
    const history = memoryHistory({});
    session = createEditSession({ ...baseline, characters }, 'v1:test', { history: history.store });
    const original = getExplicitCharacterRelation(characters, '剑客莉莉').advantageMaps[0]!;
    for (const description of ['temporary', original.description ?? '']) {
      session.updateDomain('characters', (draft) => {
        updateCharacterRelationDescription(
          draft,
          '剑客莉莉',
          'advantageMaps',
          original.id,
          description
        );
      });
      await Promise.resolve();
    }
    expect(session.readDraft({ kind: 'character-relations' }).publishEntries).toEqual([]);
  });

  it.each(['original', 'filtered'] as const)(
    'clears the %s retry scope when discarding a mixed pair draft',
    async (payload) => {
      const pair = {
        op: 'set' as const,
        path: '巴特.characterRelationOverrides.雪梨',
        oldValue: undefined,
        newValue: { kind: 'collaborators', description: 'test', isMinor: true },
      };
      const empty = {
        op: 'set' as const,
        path: '巴特.disadvantageModes',
        oldValue: undefined,
        newValue: [],
      };
      const operationScope =
        payload === 'original' ? 'page:characters:' : `relations:pair:${pair.path}`;
      getOrCreatePublishOperationId(
        operationScope,
        getPublishOperationFingerprint({
          endpoint: '/api/game-data-actions/publish',
          entries: payload === 'original' ? [pair, empty] : [pair],
          message: null,
          submitMode: 'default',
        })
      );
      const history = memoryHistory({ characters: [pair, empty] });
      const publish = jest.fn().mockResolvedValue({ status: 'published', outcome: 'pending' });
      session = createEditSession({ ...baseline, characters }, 'v1:test', {
        history: history.store,
        publish,
      });
      const scope = { kind: 'domain', entityType: 'characters' } as const;
      await expect(session.publishDraft(scope, { message: 'changed' })).resolves.toMatchObject({
        status: 'failed',
        error: { message: 'publish_operation_conflict' },
      });
      expect(publish).not.toHaveBeenCalled();
      expect(session.discardDraft(scope)).toEqual({ status: 'discarded' });
      expect(readPublishOperation(operationScope)).toBeNull();
      session.updateEntity({ entityType: 'characters', entityId: '巴特' }, (character) => {
        character.description = 'changed';
      });
      await Promise.resolve();
      expect((await session.publishDraft(scope)).status).toBe('published');
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
