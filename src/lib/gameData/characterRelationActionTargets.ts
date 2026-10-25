import {
  CHARACTER_PAIR_RELATION_KINDS,
  CHARACTER_RELATION_PAIR_FIELD,
} from '@/features/characters/utils/characterRelationPairs';

type RelationAction = { path: string; oldValue: unknown; newValue: unknown };

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

/** Both endpoints, including records carried by historical map or character replacements. */
export function getCharacterRelationOverrideActionTargetIds(action: RelationAction): string[] {
  const [ownerId, field, otherId] = action.path.split('.');
  if (!ownerId) return [];
  if (field === CHARACTER_RELATION_PAIR_FIELD && otherId) return [ownerId, otherId];
  if (field !== undefined && field !== CHARACTER_RELATION_PAIR_FIELD) return [];

  const targets = new Set<string>();
  for (const value of [action.oldValue, action.newValue]) {
    const record = asRecord(value);
    const overrides =
      field === CHARACTER_RELATION_PAIR_FIELD
        ? record
        : asRecord(record?.[CHARACTER_RELATION_PAIR_FIELD]);
    if (overrides) Object.keys(overrides).forEach((id) => targets.add(id));
  }
  targets.delete(ownerId);
  return targets.size > 0 ? [ownerId, ...targets] : [];
}

/** Legacy relation arrays also affect the reverse page's history and pending awareness. */
export function getCharacterRelationActionTargetIds(action: RelationAction): string[] {
  const targets = new Set(getCharacterRelationOverrideActionTargetIds(action));
  const [ownerId, field] = action.path.split('.');
  if (!ownerId) return [];
  const addItems = (value: unknown) => {
    for (const item of Array.isArray(value) ? value : [value]) {
      const id = asRecord(item)?.id;
      if (typeof id === 'string' && id) targets.add(id);
    }
  };
  for (const value of [action.oldValue, action.newValue]) {
    if (CHARACTER_PAIR_RELATION_KINDS.some((kind) => kind === field)) {
      addItems(value);
    } else if (field === undefined) {
      const record = asRecord(value);
      CHARACTER_PAIR_RELATION_KINDS.forEach((kind) => addItems(record?.[kind]));
    }
  }
  targets.delete(ownerId);
  return targets.size > 0 ? [ownerId, ...targets] : [];
}
