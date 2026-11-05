const PUBLISH_OPERATION_HEADER = 'Idempotency-Key';

const OPERATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const PUBLISH_OPERATION_STORAGE_PREFIX = 'game-data-publish-operation:v1:';

export class InvalidPublishOperationIdError extends Error {
  constructor() {
    super('invalid_idempotency_key');
    this.name = 'InvalidPublishOperationIdError';
  }
}

export class PublishOperationConflictError extends Error {
  constructor() {
    super('publish_operation_conflict');
    this.name = 'PublishOperationConflictError';
  }
}

export function isPublishOperationId(value: string): boolean {
  return OPERATION_ID_PATTERN.test(value);
}

/** Every submission must be safely retryable, including requests from cached clients. */
export function readPublishOperationId(request: Request): string {
  const value = request.headers.get(PUBLISH_OPERATION_HEADER);
  if (value === null || !isPublishOperationId(value)) throw new InvalidPublishOperationIdError();
  return value.toLowerCase();
}

export function getPublishOperationFingerprint(value: unknown): string {
  return JSON.stringify(value) ?? '';
}

type StoredPublishOperation = {
  fingerprint: string;
  operationId: string;
};

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getPublishOperationStorageKey(scope: string): string {
  return `${PUBLISH_OPERATION_STORAGE_PREFIX}${encodeURIComponent(scope)}`;
}

export function readPublishOperation(scope: string): StoredPublishOperation | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(getPublishOperationStorageKey(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPublishOperation>;
    if (
      typeof parsed.fingerprint !== 'string' ||
      typeof parsed.operationId !== 'string' ||
      !isPublishOperationId(parsed.operationId)
    ) {
      return null;
    }
    return { fingerprint: parsed.fingerprint, operationId: parsed.operationId.toLowerCase() };
  } catch {
    return null;
  }
}

export function hasPublishOperation(scope: string): boolean {
  return readPublishOperation(scope) !== null;
}

export function getOrCreatePublishOperationId(scope: string, fingerprint: string): string {
  const existing = readPublishOperation(scope);
  if (existing?.fingerprint === fingerprint) return existing.operationId;
  if (existing) throw new PublishOperationConflictError();

  const operationId = crypto.randomUUID();
  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.setItem(
        getPublishOperationStorageKey(scope),
        JSON.stringify({ fingerprint, operationId })
      );
    } catch {
      // The request remains valid; persistence is best effort when storage is unavailable.
    }
  }
  return operationId;
}

export function clearPublishOperation(scope: string): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(getPublishOperationStorageKey(scope));
  } catch {
    // Storage can be disabled by the browser; there is nothing else to clear.
  }
}
