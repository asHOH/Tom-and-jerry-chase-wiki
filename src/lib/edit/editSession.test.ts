import { waitFor } from '@testing-library/react';

import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import type { EditHistoryStore } from '@/lib/edit/editModeRegistry';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';

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
