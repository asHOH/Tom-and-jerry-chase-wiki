import { getVersion } from 'valtio/vanilla';

import { items } from '@/data/static';

import {
  ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES,
  createActionAuditTargetRegistry,
} from './actionAuditTargets';
import { PUBLISHABLE_ENTITY_TYPES } from './publishableEntityTypes';

describe('createActionAuditTargetRegistry', () => {
  it('creates one disposable plain-object baseline per publishable domain', () => {
    const targets = createActionAuditTargetRegistry();

    expect(Object.keys(targets).sort()).toEqual([...PUBLISHABLE_ENTITY_TYPES].sort());
    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      expect(targets[entityType]).toHaveLength(1);
      for (const target of targets[entityType] ?? []) {
        expect(Array.isArray(target)).toBe(false);
        expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
        expect(getVersion(target)).toBeUndefined();
      }
    }

    expect(ACTION_AUDIT_KNOWN_NOOP_ENTITY_TYPES).toEqual([]);
    expect(targets.factions).toBeUndefined();
  });

  it('isolates nested audit changes from canonical data and later runs', () => {
    const target = createActionAuditTargetRegistry().items![0]!;
    const itemId = Object.keys(target)[0]!;
    const item = target[itemId] as Record<string, unknown>;
    const originalDescription = item.description;

    item.description = 'audit-only change';

    const freshTarget = createActionAuditTargetRegistry().items![0]!;
    expect(freshTarget[itemId]).toHaveProperty('description', originalDescription);
    expect(items[itemId as keyof typeof items]).toHaveProperty('description', originalDescription);
  });
});
