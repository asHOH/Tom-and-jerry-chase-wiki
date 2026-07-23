import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';

import {
  getCanonicalSerializedBytes,
  MAX_SAFE_COMPLETE_CACHE_BYTES,
  MEASURED_CANONICAL_COMPLETE_SNAPSHOT_BYTES,
  PUBLISHED_SNAPSHOT_CACHE_SHAPE,
} from './cachePolicy';
import { getCanonicalGameData } from './canonicalSources';

jest.mock('server-only', () => ({}), { virtual: true });

describe('published snapshot cache policy', () => {
  it('records the complete measurement and selects the per-domain cache shape', () => {
    const complete = Object.fromEntries(
      PUBLISHABLE_ENTITY_TYPES.map((entityType) => [entityType, getCanonicalGameData(entityType)])
    );

    expect(getCanonicalSerializedBytes(complete)).toBe(MEASURED_CANONICAL_COMPLETE_SNAPSHOT_BYTES);
    expect(MEASURED_CANONICAL_COMPLETE_SNAPSHOT_BYTES).toBeGreaterThan(
      MAX_SAFE_COMPLETE_CACHE_BYTES
    );
    expect(PUBLISHED_SNAPSHOT_CACHE_SHAPE).toBe('per-domain');
  });

  it.each(PUBLISHABLE_ENTITY_TYPES)('keeps the %s domain below the safe item boundary', (type) => {
    expect(getCanonicalSerializedBytes(getCanonicalGameData(type))).toBeLessThan(
      MAX_SAFE_COMPLETE_CACHE_BYTES
    );
  });
});
