import {
  getPublishOperationStorageKey,
  readPublishOperation,
} from '@/lib/gameData/publishOperation';

import {
  createBrowserDraftOperationStore,
  EditDraftPersistenceError,
  type DraftOperation,
} from './draftPersistence';

const scope = 'page:characters:杰瑞';
const operation: DraftOperation = {
  fingerprint: 'legacy-compatible-fingerprint',
  operationId: 'a3bb189e-8c21-4b8d-9a4f-5e24b7c29a10',
  gameDataRecovery: {
    version: 1,
    phase: 'prepared',
    scope: { kind: 'entity', entity: { entityType: 'characters', entityId: '杰瑞' } },
    source: [{ op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' }],
    endpoint: '/api/game-data-actions/publish',
    body: '{"entityType":"characters","entries":[{"op":"set","path":"杰瑞.description","oldValue":"old","newValue":"new"}],"message":"  exact whitespace  "}',
  },
};

afterEach(() => {
  window.sessionStorage.clear();
  jest.restoreAllMocks();
});

it('round-trips complete requests while the shared legacy reader retains its contract', () => {
  const store = createBrowserDraftOperationStore();
  expect(store.read(scope)).toBeNull();
  store.write(scope, operation);
  const raw = window.sessionStorage.getItem(getPublishOperationStorageKey(scope));
  expect(createBrowserDraftOperationStore().read(scope)).toEqual(operation);
  expect(readPublishOperation(scope)).toEqual({
    fingerprint: operation.fingerprint,
    operationId: operation.operationId,
  });
  expect(window.sessionStorage.getItem(getPublishOperationStorageKey(scope))).toBe(raw);
  store.remove(scope);
  expect(store.read(scope)).toBeNull();
});

it('reads legacy records and ignores article records when listing game-data attempts', () => {
  const legacy = { fingerprint: 'old', operationId: operation.operationId };
  window.sessionStorage.setItem(getPublishOperationStorageKey(scope), JSON.stringify(legacy));
  window.sessionStorage.setItem(getPublishOperationStorageKey('article:1'), '{malformed article');
  expect(createBrowserDraftOperationStore().list()).toEqual([[scope, legacy]]);
});

it.each([
  '{broken',
  JSON.stringify({ ...operation, operationId: 'invalid' }),
  JSON.stringify({ ...operation, gameDataRecovery: { ...operation.gameDataRecovery, version: 2 } }),
  JSON.stringify({ ...operation, gameDataRecovery: { ...operation.gameDataRecovery, body: '{}' } }),
  JSON.stringify({
    ...operation,
    gameDataRecovery: { ...operation.gameDataRecovery, body: '{broken' },
  }),
])('preserves invalid records and refuses replacement/removal: %s', (raw) => {
  const key = getPublishOperationStorageKey(scope);
  window.sessionStorage.setItem(key, raw);
  const store = createBrowserDraftOperationStore();
  expect(() => store.read(scope)).toThrow(EditDraftPersistenceError);
  expect(() => store.write(scope, operation)).toThrow(EditDraftPersistenceError);
  expect(() => store.remove(scope)).toThrow(EditDraftPersistenceError);
  expect(window.sessionStorage.getItem(key)).toBe(raw);
});

it('verifies writes/removals and preserves externally changed records', () => {
  const store = createBrowserDraftOperationStore();
  const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
  expect(() => store.write(scope, operation)).toThrow(EditDraftPersistenceError);
  set.mockRestore();
  store.write(scope, operation);
  const remove = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
  expect(() => store.remove(scope)).toThrow(EditDraftPersistenceError);
  remove.mockRestore();
  window.sessionStorage.setItem(
    getPublishOperationStorageKey(scope),
    JSON.stringify({ ...operation, fingerprint: 'external' })
  );
  expect(() => store.write(scope, operation)).toThrow(
    expect.objectContaining({ kind: 'conflict' })
  );
  expect(() => store.remove(scope)).toThrow(expect.objectContaining({ kind: 'conflict' }));
});

it('reports denied storage access and quota failures', () => {
  const get = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('denied');
  });
  expect(() => createBrowserDraftOperationStore().read(scope)).toThrow(
    expect.objectContaining({ kind: 'unavailable' })
  );
  get.mockRestore();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota');
  });
  expect(() => createBrowserDraftOperationStore().write(scope, operation)).toThrow(
    expect.objectContaining({ kind: 'unavailable' })
  );
});

it('round-trips acknowledgement and cancellation checkpoints', () => {
  const recovery = operation.gameDataRecovery!;
  if (recovery.phase !== 'prepared') throw new Error('fixture');
  const store = createBrowserDraftOperationStore();
  for (const gameDataRecovery of [
    { ...recovery, phase: 'acknowledged' as const, outcome: 'pending' as const, target: [] },
    {
      version: 1 as const,
      phase: 'cancelling' as const,
      scope: recovery.scope,
      source: recovery.source,
      target: [],
      associatedScopes: [scope],
    },
  ]) {
    store.write(scope, { ...operation, gameDataRecovery });
    expect(createBrowserDraftOperationStore().read(scope)?.gameDataRecovery).toEqual(
      gameDataRecovery
    );
  }
});

it.each([
  { key: 'page:cards:1', value: operation },
  {
    key: scope,
    value: {
      ...operation,
      gameDataRecovery: {
        version: 1,
        phase: 'cancelling',
        scope: { kind: 'domain', entityType: 'characters' },
        source: [],
        target: [],
        associatedScopes: [scope, 'page:cards:1'],
      },
    },
  },
  {
    key: scope,
    value: {
      ...operation,
      gameDataRecovery: {
        version: 1,
        phase: 'cancelling',
        scope: { kind: 'domain', entityType: 'characters' },
        source: [],
        target: [],
        associatedScopes: ['relations:characters'],
      },
    },
  },
])('preserves mismatched recovery identity under $key', ({ key, value }) => {
  const raw = JSON.stringify(value);
  const storageKey = getPublishOperationStorageKey(key);
  window.sessionStorage.setItem(storageKey, raw);
  const store = createBrowserDraftOperationStore();
  expect(() => store.read(key)).toThrow(expect.objectContaining({ kind: 'invalid' }));
  expect(() => store.remove(key)).toThrow(expect.objectContaining({ kind: 'invalid' }));
  expect(() => store.write(key, operation)).toThrow(EditDraftPersistenceError);
  expect(window.sessionStorage.getItem(storageKey)).toBe(raw);
});
