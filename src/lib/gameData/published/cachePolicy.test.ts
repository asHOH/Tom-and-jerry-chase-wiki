import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';

import {
  getCanonicalSerializedBytes,
  MAX_SAFE_COMPLETE_CACHE_BYTES,
  PUBLISHED_SNAPSHOT_CACHE_SHAPE,
} from './cachePolicy';
import { getCanonicalGameData } from './canonicalSources';

jest.mock('server-only', () => ({}), { virtual: true });

describe('published snapshot cache policy', () => {
  it('keeps the complete snapshot above the safe boundary and selects the per-domain cache shape', () => {
    const complete = Object.fromEntries(
      PUBLISHABLE_ENTITY_TYPES.map((entityType) => [entityType, getCanonicalGameData(entityType)])
    );

    expect(getCanonicalSerializedBytes(complete)).toBeGreaterThan(MAX_SAFE_COMPLETE_CACHE_BYTES);
    expect(PUBLISHED_SNAPSHOT_CACHE_SHAPE).toBe('per-domain');
  });

  it.each(PUBLISHABLE_ENTITY_TYPES)('keeps the %s domain below the safe item boundary', (type) => {
    expect(getCanonicalSerializedBytes(getCanonicalGameData(type))).toBeLessThan(
      MAX_SAFE_COMPLETE_CACHE_BYTES
    );
  });
});
