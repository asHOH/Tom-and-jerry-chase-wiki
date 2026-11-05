import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { getPublishOperationStorageKey } from '@/lib/gameData/publishOperation';
import { getEditModeActionsStorageKey } from '@/lib/localStorage';

import { createEditSession, type EditSession, type EditSessionDependencies } from './editSession';

const baseline = {
  achievements: { cat: {}, mouse: {} },
  buffs: {},
  cards: {},
  characters: {
    A: { id: 'A', description: 'before', skills: [], knowledgeCardGroups: [] },
    B: { id: 'B', description: 'before', skills: [], knowledgeCardGroups: [] },
  },
  entities: {},
  fixtures: {},
  items: {},
  maps: {},
  modes: {},
  specialSkills: { cat: {}, mouse: {} },
  traits: {},
} as unknown as PublishedGameDataByType;
const scope = { kind: 'entity', entity: { entityType: 'characters', entityId: 'A' } } as const;
const historyKey = getEditModeActionsStorageKey('characters');
const operationKey = getPublishOperationStorageKey('page:characters:A');
const success = { status: 'published', outcome: 'pending' } as const;
let sessions: EditSession[] = [];
const create = (dependencies: EditSessionDependencies = {}) => {
  const session = createEditSession(baseline, 'v1:test', dependencies);
  sessions.push(session);
  return session;
};
const edit = (session: EditSession, description = 'draft') =>
  session.updateEntity(scope.entity, (draft) => {
    draft.description = description;
  });
const stored = () => JSON.parse(window.sessionStorage.getItem(operationKey)!);

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  sessions.forEach((session) => session.dispose());
  sessions = [];
  jest.restoreAllMocks();
});

it('pins the exact serialized body and UUID across reload even when retry options are omitted', async () => {
  const publish = jest
    .fn()
    .mockRejectedValueOnce(new Error('uncertain'))
    .mockResolvedValue(success);
  let session = create({ publish });
  edit(session);
  const options = {
    message: '  exact message  ',
    submitMode: 'force_pending' as const,
    pendingAcknowledgementToken: 'original-token',
  };
  expect((await session.publishDraft(scope, options)).status).toBe('failed');
  const first = publish.mock.calls[0]![0];
  expect(stored().gameDataRecovery.body).toBe(first.body);
  session.dispose();
  session = create({ publish });
  expect(await session.publishDraft(scope)).toEqual(success);
  expect(publish.mock.calls[1]![0]).toEqual(first);
  expect(window.localStorage.getItem(historyKey)).toBeNull();
  expect(window.sessionStorage.getItem(operationKey)).toBeNull();
});

it('reuses concurrent identical calls, blocks discard, and leaves late callbacks to the next session', async () => {
  let resolve!: (value: typeof success) => void;
  const publish = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    )
    .mockResolvedValue(success);
  let session = create({ publish });
  edit(session);
  const first = session.publishDraft(scope);
  expect(session.publishDraft(scope)).toBe(first);
  expect(session.discardDraft({ kind: 'domain', entityType: 'characters' })).toEqual({
    status: 'busy',
  });
  expect((await session.publishDraft(scope, { message: 'different' })).status).toBe('failed');
  const savedOperation = window.sessionStorage.getItem(operationKey);
  const savedHistory = window.localStorage.getItem(historyKey);
  session.dispose();
  session = create({ publish });
  resolve(success);
  expect((await first).status).toBe('failed');
  expect(window.sessionStorage.getItem(operationKey)).toBe(savedOperation);
  expect(window.localStorage.getItem(historyKey)).toBe(savedHistory);
  expect(await session.publishDraft(scope)).toEqual(success);
  expect(publish).toHaveBeenCalledTimes(2);
  expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
});

it('requires a durable operation before sending', async () => {
  const publish = jest.fn().mockResolvedValue(success);
  const session = create({ publish });
  edit(session);
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (this === window.sessionStorage) throw new Error('quota');
    original.call(this, key, value);
  });
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(publish).not.toHaveBeenCalled();
  expect(session.readDraft(scope).actionCount).toBe(1);
});

it('retries an absent-field edit in the same session without changing its request', async () => {
  const publish = jest
    .fn()
    .mockRejectedValueOnce(new Error('uncertain'))
    .mockResolvedValue(success);
  const session = create({ publish });
  session.updateEntity(scope.entity, (draft) => {
    draft.aliases = ['new alias'];
  });
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(await session.publishDraft(scope)).toEqual(success);
  expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
});

it.each([
  null,
  {},
  { result: [] },
  { result: [{}] },
  { result: [{ is_public: false, status: 'pending' }] },
  { result: [{ id: 42, is_public: false, status: 'pending' }] },
  { result: [{ id: ' ', is_public: false, status: 'pending' }] },
  { result: [{ is_public: false, status: 'unknown' }] },
])('keeps a malformed success uncertain: %j', async (body) => {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => body })
    .mockResolvedValue({
      ok: true,
      json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
    });
  global.fetch = fetchMock;
  const session = create();
  edit(session);
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(stored().gameDataRecovery.phase).toBe('prepared');
  expect(session.readDraft(scope).actionCount).toBe(1);
  expect(await session.publishDraft(scope)).toEqual(success);
  expect(fetchMock.mock.calls[1]).toEqual(fetchMock.mock.calls[0]);
});

it('retains the prepared request when acknowledgement persistence fails after server success', async () => {
  const publish = jest.fn().mockResolvedValue(success);
  let session = create({ publish });
  edit(session);
  const original = Storage.prototype.setItem;
  const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
    this: Storage,
    key,
    value
  ) {
    if (this === window.sessionStorage && value.includes('"phase":"acknowledged"'))
      throw new Error('quota');
    original.call(this, key, value);
  });
  expect(await session.publishDraft(scope)).toMatchObject({
    status: 'cleanup-conflict',
    outcome: 'pending',
  });
  expect(stored().gameDataRecovery.phase).toBe('prepared');
  write.mockRestore();
  session.dispose();
  session = create({ publish });
  expect(await session.publishDraft(scope)).toEqual(success);
  expect(publish.mock.calls[1]![0]).toEqual(publish.mock.calls[0]![0]);
});

it('finishes acknowledged cleanup in the same session without another transport', async () => {
  const publish = jest.fn().mockResolvedValue(success);
  const session = create({ publish });
  edit(session);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.localStorage) throw new Error('quota');
    original.call(this, key);
  });
  expect((await session.publishDraft(scope)).status).toBe('cleanup-conflict');
  expect(stored().gameDataRecovery).toMatchObject({ phase: 'acknowledged', target: [] });
  remove.mockRestore();
  expect(session.retryDraftPersistence(scope)).toEqual({ status: 'saved' });
  expect(publish).toHaveBeenCalledTimes(1);
  expect(session.readDraft(scope).actionCount).toBe(0);
  expect(window.sessionStorage.getItem(operationKey)).toBeNull();
});

it.each([false, true])(
  'preserves ambiguous cleanup after reload (nonempty target: %s)',
  async (nonempty) => {
    const publish = jest.fn().mockResolvedValue(success);
    let session = create({ publish });
    if (nonempty)
      session.updateEntity({ entityType: 'characters', entityId: 'B' }, (draft) => {
        draft.description = 'unrelated';
      });
    edit(session);
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      if (this === window.localStorage && stored()?.gameDataRecovery?.phase === 'acknowledged')
        throw new Error('quota');
      originalSet.call(this, key, value);
    });
    const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key
    ) {
      if (this === window.localStorage) throw new Error('quota');
      originalRemove.call(this, key);
    });
    expect((await session.publishDraft(scope)).status).toBe('cleanup-conflict');
    set.mockRestore();
    remove.mockRestore();
    const history = window.localStorage.getItem(historyKey);
    session.dispose();
    session = create({ publish });
    expect((await session.publishDraft(scope)).status).toBe('cleanup-conflict');
    expect(publish).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(historyKey)).toBe(history);
    expect(session.discardDraft(scope)).toEqual({ status: 'discarded' });
    expect(window.sessionStorage.getItem(operationKey)).toBeNull();
  }
);

it('blocks mutation after cancellation history failure and routes persistence retry through cancellation', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  const session = create({ publish });
  edit(session);
  await session.publishDraft(scope);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.localStorage) throw new Error('quota');
    original.call(this, key);
  });
  expect(session.discardDraft(scope).status).toBe('storage-failed');
  expect(stored().gameDataRecovery.phase).toBe('cancelling');
  const mutate = jest.fn();
  expect(() => session.updateEntity(scope.entity, mutate)).toThrow();
  expect(mutate).not.toHaveBeenCalled();
  expect(session.readDomain('characters').A?.description).toBe('draft');
  remove.mockRestore();
  expect(session.retryDraftPersistence(scope)).toEqual({ status: 'saved' });
  expect(session.readDomain('characters').A?.description).toBe('before');
  expect(window.localStorage.getItem(historyKey)).toBeNull();
  expect(window.sessionStorage.getItem(operationKey)).toBeNull();
});

it('keeps later edits after cancellation history is saved but intent removal fails', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  let session = create({ publish });
  edit(session);
  await session.publishDraft(scope);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.sessionStorage) throw new Error('denied');
    original.call(this, key);
  });
  expect(session.discardDraft(scope).status).toBe('storage-failed');
  expect(session.readDomain('characters').A?.description).toBe('before');
  edit(session, 'later');
  const later = window.localStorage.getItem(historyKey);
  remove.mockRestore();
  session.dispose();
  session = create({ publish });
  expect(session.readDomain('characters').A?.description).toBe('later');
  expect(window.localStorage.getItem(historyKey)).toBe(later);
  expect(window.sessionStorage.getItem(operationKey)).toBeNull();
  expect(publish).toHaveBeenCalledTimes(1);
});

it('keeps cancelled requests fenced across a reload before the history write', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  let session = create({ publish });
  edit(session);
  await session.publishDraft(scope);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.localStorage) throw new Error('denied');
    original.call(this, key);
  });
  session.discardDraft(scope);
  remove.mockRestore();
  session.dispose();
  session = create({ publish });
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(publish).toHaveBeenCalledTimes(1);
  expect(session.retryDraftPersistence(scope).status).toBe('storage-failed');
  expect(() => edit(session, 'later')).toThrow();
  expect(stored().gameDataRecovery.phase).toBe('cancelling');
});

it.each(['target', 'remove'])(
  'resumes acknowledged cleanup after interruption at %s without resending',
  async (stage) => {
    const publish = jest.fn().mockResolvedValue(success);
    let session = create({ publish });
    edit(session);
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      if (
        stage === 'target' &&
        this === window.sessionStorage &&
        value.includes('"phase":"acknowledged"') &&
        value.includes('"target":')
      )
        throw new Error('interrupted');
      originalSet.call(this, key, value);
    });
    const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key
    ) {
      if (stage === 'remove' && this === window.sessionStorage) throw new Error('interrupted');
      originalRemove.call(this, key);
    });
    expect((await session.publishDraft(scope)).status).toBe('cleanup-conflict');
    expect(stored().gameDataRecovery.phase).toBe('acknowledged');
    set.mockRestore();
    remove.mockRestore();
    session.dispose();
    session = create({ publish });
    expect(session.readDraft(scope).actionCount).toBe(0);
    expect(window.sessionStorage.getItem(operationKey)).toBeNull();
    expect(publish).toHaveBeenCalledTimes(1);
  }
);

it('leaves the draft untouched if cancellation intent cannot be saved', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  const session = create({ publish });
  edit(session);
  await session.publishDraft(scope);
  const original = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
    if (this === window.sessionStorage && value.includes('"phase":"cancelling"'))
      throw new Error('interrupted');
    original.call(this, key, value);
  });
  const history = window.localStorage.getItem(historyKey);
  expect(session.discardDraft(scope).status).toBe('storage-failed');
  expect(session.readDomain('characters').A?.description).toBe('draft');
  expect(window.localStorage.getItem(historyKey)).toBe(history);
  expect(stored().gameDataRecovery.phase).toBe('prepared');
  expect(() => edit(session, 'later')).not.toThrow();
});

it('keeps the cancellation intent until every associated alias has been removed', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  let session = create({ publish });
  edit(session);
  await session.publishDraft(scope);
  const aliasKey = getPublishOperationStorageKey('page:characters:');
  window.sessionStorage.setItem(aliasKey, window.sessionStorage.getItem(operationKey)!);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.sessionStorage && key === aliasKey) throw new Error('interrupted');
    original.call(this, key);
  });
  expect(session.discardDraft(scope).status).toBe('storage-failed');
  expect(stored().gameDataRecovery.phase).toBe('cancelling');
  expect(window.sessionStorage.getItem(aliasKey)).not.toBeNull();
  expect(window.localStorage.getItem(historyKey)).toBeNull();
  remove.mockRestore();
  session.dispose();
  session = create({ publish });
  expect(session.readDraft(scope).actionCount).toBe(0);
  expect(window.sessionStorage.getItem(operationKey)).toBeNull();
  expect(window.sessionStorage.getItem(aliasKey)).toBeNull();
  expect(publish).toHaveBeenCalledTimes(1);
});

it('persists only a server-authorized acknowledgement update under the original UUID', async () => {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'pending_action_overlap',
        pendingAcknowledgementToken: 'authorized',
        affectedPathCount: 1,
        ownCount: 1,
        otherCount: 0,
        publicCount: 0,
        truncated: false,
      }),
    })
    .mockResolvedValue({
      ok: true,
      json: async () => ({ result: [{ id: 'action-1', is_public: false, status: 'pending' }] }),
    });
  global.fetch = fetchMock;
  let session = create();
  edit(session);
  expect((await session.publishDraft(scope, { message: 'fixed content' })).status).toBe(
    'pending-conflict'
  );
  const first = fetchMock.mock.calls[0]![1];
  session.dispose();
  session = create();
  expect(
    (await session.publishDraft(scope, { pendingAcknowledgementToken: 'arbitrary' })).status
  ).toBe('failed');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(await session.publishDraft(scope, { pendingAcknowledgementToken: 'authorized' })).toEqual(
    success
  );
  const retry = fetchMock.mock.calls[1]![1];
  expect(retry.headers).toEqual(first.headers);
  expect(JSON.parse(retry.body)).toEqual({
    ...JSON.parse(first.body),
    pendingAcknowledgementToken: 'authorized',
  });
});

it('preserves the attempt when definitive-rejection removal fails', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 422,
    json: async () => ({ error: 'invalid_game_data' }),
  });
  const session = create();
  edit(session);
  const original = Storage.prototype.removeItem;
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) {
    if (this === window.sessionStorage) throw new Error('denied');
    original.call(this, key);
  });
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(stored().gameDataRecovery.phase).toBe('prepared');
  edit(session, 'corrected');
  expect((await session.publishDraft(scope)).status).toBe('failed');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('rejects a partial entity discard of an unresolved domain submission', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  const session = create({ publish });
  edit(session);
  session.updateEntity({ entityType: 'characters', entityId: 'B' }, (draft) => {
    draft.description = 'other draft';
  });
  const domain = { kind: 'domain', entityType: 'characters' } as const;
  await session.publishDraft(domain);
  const key = getPublishOperationStorageKey('page:characters:');
  const operation = window.sessionStorage.getItem(key);
  const history = window.localStorage.getItem(historyKey);
  expect(session.discardDraft(scope).status).toBe('storage-failed');
  expect(window.sessionStorage.getItem(key)).toBe(operation);
  expect(window.localStorage.getItem(historyKey)).toBe(history);
  expect(session.discardDraft(domain)).toEqual({ status: 'discarded' });
});

it('rejects a single-pair discard of an unresolved multi-pair relation submission', async () => {
  const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
  const session = create({ publish });
  session.updateEntity(scope.entity, (draft) => {
    draft.characterRelationOverrides = {
      B: { kind: 'counters', description: 'first', isMinor: false },
      C: { kind: 'counters', description: 'second', isMinor: false },
    };
  });
  const relations = { kind: 'character-relations' } as const;
  await session.publishDraft(relations);
  const key = getPublishOperationStorageKey('relations:characters');
  const operation = window.sessionStorage.getItem(key);
  const history = window.localStorage.getItem(historyKey);
  expect(
    session.discardDraft({ kind: 'entity', entity: { entityType: 'characters', entityId: 'B' } })
      .status
  ).toBe('storage-failed');
  expect(window.sessionStorage.getItem(key)).toBe(operation);
  expect(window.localStorage.getItem(historyKey)).toBe(history);
  expect(session.discardDraft(relations)).toEqual({ status: 'discarded' });
});

it.each(['broader', 'narrower'])(
  'rejects a %s retry selection while preserving the pinned request',
  async (direction) => {
    const publish = jest.fn().mockRejectedValue(new Error('uncertain'));
    const session = create({ publish });
    edit(session);
    session.updateEntity({ entityType: 'characters', entityId: 'B' }, (draft) => {
      draft.description = 'other';
    });
    const domain = { kind: 'domain', entityType: 'characters' } as const;
    const original = direction === 'broader' ? scope : domain;
    const retry = direction === 'broader' ? domain : scope;
    await session.publishDraft(original);
    const records = [...Array(window.sessionStorage.length)].map((_, index) =>
      window.sessionStorage.getItem(window.sessionStorage.key(index)!)
    );
    expect((await session.publishDraft(retry)).status).toBe('failed');
    expect(publish).toHaveBeenCalledTimes(1);
    expect(
      [...Array(window.sessionStorage.length)].map((_, index) =>
        window.sessionStorage.getItem(window.sessionStorage.key(index)!)
      )
    ).toEqual(records);
  }
);

it('defers acknowledged cleanup while another request in the domain is in flight', async () => {
  let resolve!: (value: typeof success) => void;
  const publish = jest
    .fn()
    .mockResolvedValueOnce(success)
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
  const session = create({ publish });
  edit(session);
  const original = Storage.prototype.removeItem;
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
    this: Storage,
    key
  ) {
    if (this === window.localStorage) throw new Error('quota');
    original.call(this, key);
  });
  expect((await session.publishDraft(scope)).status).toBe('cleanup-conflict');
  remove.mockRestore();
  const other = { kind: 'entity', entity: { entityType: 'characters', entityId: 'B' } } as const;
  session.updateEntity(other.entity, (draft) => {
    draft.description = 'other';
  });
  const request = session.publishDraft(other);
  const history = window.localStorage.getItem(historyKey);
  expect(session.retryDraftPersistence().status).toBe('storage-failed');
  expect(window.localStorage.getItem(historyKey)).toBe(history);
  resolve(success);
  expect(await request).toEqual(success);
  expect(session.retryDraftPersistence().status).toBe('saved');
  expect(window.localStorage.getItem(historyKey)).toBeNull();
});
