import { getVersion } from 'valtio/vanilla';

import {
  ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES,
  ACTION_AUDIT_TARGET_COUNTS,
  createActionAuditTargetRegistry,
} from './actionAuditTargets';

describe('createActionAuditTargetRegistry', () => {
  it('creates the exact legacy server multiplicities as disposable plain objects', () => {
    const targets = createActionAuditTargetRegistry();

    expect(Object.keys(targets).sort()).toEqual(Object.keys(ACTION_AUDIT_TARGET_COUNTS).sort());
    for (const [entityType, expectedCount] of Object.entries(ACTION_AUDIT_TARGET_COUNTS)) {
      expect(targets[entityType]).toHaveLength(expectedCount);
      for (const target of targets[entityType] ?? []) {
        expect(Array.isArray(target)).toBe(false);
        expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
        expect(getVersion(target)).toBeUndefined();
      }
    }

    expect(ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES).toEqual([]);
    expect(targets.factions).toBeUndefined();
  });
});
