type ChangedArrayItem = {
  id: string;
  fields: string[];
};

type IdArrayDiff = {
  added: string[];
  removed: string[];
  changed: ChangedArrayItem[];
  enabled: boolean;
};

type IdRecord = Record<string, unknown> & {
  id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasStringId(value: unknown): value is IdRecord {
  return isRecord(value) && typeof value.id === 'string';
}

function joinFieldPath(basePath: string, key: string): string {
  return basePath ? `${basePath}.${key}` : key;
}

function collectChangedLeafFields(oldValue: unknown, newValue: unknown, basePath = ''): string[] {
  if (Object.is(oldValue, newValue)) return [];

  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    if (!Array.isArray(oldValue) || !Array.isArray(newValue)) return [basePath || '值'];
    if (oldValue.length !== newValue.length) return [basePath || '值'];

    const changedFields = oldValue.flatMap((oldItem, index) =>
      collectChangedLeafFields(oldItem, newValue[index], `${basePath}[${index}]`)
    );

    return changedFields.length > 0 ? changedFields : [basePath || '值'];
  }

  if (isRecord(oldValue) || isRecord(newValue)) {
    if (!isRecord(oldValue) || !isRecord(newValue)) return [basePath || '值'];

    const changedFields: string[] = [];
    const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of keys) {
      changedFields.push(
        ...collectChangedLeafFields(oldValue[key], newValue[key], joinFieldPath(basePath, key))
      );
    }

    return changedFields;
  }

  return [basePath || '值'];
}

export function summarizeGameActionValue(value: unknown): string {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'string') return value.length > 60 ? `${value.slice(0, 60)}...` : value;
  if (Array.isArray(value)) return value.length === 0 ? '空数组' : `数组(${value.length})`;
  if (typeof value === 'object') return `对象(${Object.keys(value as object).length}键)`;
  return String(value);
}

export function diffGameActionIdArray(oldValue: unknown, newValue: unknown): IdArrayDiff {
  if (!Array.isArray(oldValue) && !Array.isArray(newValue)) {
    return { added: [], removed: [], changed: [], enabled: false };
  }

  const oldArr = Array.isArray(oldValue) ? oldValue : [];
  const newArr = Array.isArray(newValue) ? newValue : [];
  const oldMap = new Map<string, IdRecord>();
  const newMap = new Map<string, IdRecord>();

  for (const item of oldArr) {
    if (hasStringId(item)) oldMap.set(item.id, item);
  }

  for (const item of newArr) {
    if (hasStringId(item)) newMap.set(item.id, item);
  }

  if (oldMap.size === 0 && newMap.size === 0) {
    return { added: [], removed: [], changed: [], enabled: false };
  }

  const added: string[] = [];
  const removed: string[] = [];
  const changed: ChangedArrayItem[] = [];

  for (const id of newMap.keys()) {
    if (!oldMap.has(id)) added.push(id);
  }

  for (const id of oldMap.keys()) {
    if (!newMap.has(id)) removed.push(id);
  }

  for (const id of newMap.keys()) {
    const oldItem = oldMap.get(id);
    const newItem = newMap.get(id);

    if (!oldItem || !newItem) continue;

    const changedFields = Array.from(new Set(collectChangedLeafFields(oldItem, newItem)));

    if (changedFields.length > 0) {
      changed.push({ id, fields: changedFields });
    }
  }

  return { added, removed, changed, enabled: true };
}

export type { ChangedArrayItem, IdArrayDiff };
