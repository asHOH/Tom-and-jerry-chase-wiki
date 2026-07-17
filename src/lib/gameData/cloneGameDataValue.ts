export type CloneGameDataValueResult = { success: true; value: unknown } | { success: false };

export function cloneGameDataValue(
  value: unknown,
  ancestors = new WeakSet<object>()
): CloneGameDataValueResult {
  if (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return { success: true, value };
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? { success: true, value } : { success: false };
  }
  if (typeof value !== 'object' || ancestors.has(value)) return { success: false };

  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    return { success: false };
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    const result: unknown[] = [];
    for (const item of value) {
      const cloned = cloneGameDataValue(item, ancestors);
      if (!cloned.success) return cloned;
      result.push(cloned.value);
    }
    ancestors.delete(value);
    return { success: true, value: result };
  }

  const result: Record<string, unknown> = Object.create(prototype);
  for (const [key, item] of Object.entries(value)) {
    const cloned = cloneGameDataValue(item, ancestors);
    if (!cloned.success) return cloned;
    Object.defineProperty(result, key, {
      configurable: true,
      enumerable: true,
      value: cloned.value,
      writable: true,
    });
  }
  ancestors.delete(value);
  return { success: true, value: result };
}
