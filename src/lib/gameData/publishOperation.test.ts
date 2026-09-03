import {
  clearPublishOperation,
  getOrCreatePublishOperationId,
  getPublishOperationFingerprint,
  isPublishOperationId,
  PublishOperationConflictError,
  readPublishOperationId,
} from './publishOperation';

describe('publish operation identity', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('reuses a stored UUID for the same semantic draft and blocks a changed fingerprint', () => {
    const firstFingerprint = getPublishOperationFingerprint({ entries: ['first'] });
    const secondFingerprint = getPublishOperationFingerprint({ entries: ['second'] });

    const first = getOrCreatePublishOperationId('page:items:item-1', firstFingerprint);
    expect(getOrCreatePublishOperationId('page:items:item-1', firstFingerprint)).toBe(first);

    expect(() => getOrCreatePublishOperationId('page:items:item-1', secondFingerprint)).toThrow(
      PublishOperationConflictError
    );

    clearPublishOperation('page:items:item-1');
    const second = getOrCreatePublishOperationId('page:items:item-1', secondFingerprint);
    expect(second).not.toBe(first);
    expect(isPublishOperationId(second)).toBe(true);
  });

  it('strictly accepts UUID v4 idempotency headers and keeps missing headers compatible', () => {
    const valid = 'A3BB189E-8C21-4B8D-9A4F-5E24B7C29A10';
    const request = (value: string | null) =>
      ({ headers: { get: () => value } }) as unknown as Request;

    expect(readPublishOperationId(request(valid))).toBe(valid.toLowerCase());
    expect(readPublishOperationId(request(null))).toBeUndefined();
    expect(() => readPublishOperationId(request('not-a-uuid'))).toThrow('invalid_idempotency_key');
  });
});
