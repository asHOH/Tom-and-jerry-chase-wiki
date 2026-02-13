/**
 * Generic entity utilities for editing any data type (characters, factions, knowledge cards, etc.)
 * Provides type-safe path manipulation and entity-agnostic operations.
 */

/**
 * Retrieves a nested property value from an object using dot-notation path.
 * Safely handles missing or invalid paths.
 *
 * @param obj The object to search within
 * @param path Dot-separated path string (e.g., 'skills.0.name')
 * @returns The value at the path, or undefined if not found
 *
 * @example
 * const skill = getNestedProperty(character, 'skills.0.name');
 * const description = getNestedProperty(knowledgeCard, 'description');
 */
export function getNestedProperty<T = unknown>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  if (!path) {
    return (obj as unknown as T) || undefined;
  }
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (!acc || typeof acc !== 'object' || typeof part !== 'string') return undefined;
    if (Array.isArray(acc) && /^[0-9]+$/.test(part)) {
      const idx = Number(part);
      return Number.isInteger(idx) ? (acc as unknown[])[idx] : undefined;
    }
    return part in (acc as Record<string, unknown>)
      ? (acc as Record<string, unknown>)[part]
      : undefined;
  }, obj) as unknown as T;
}

/**
 * Sets a nested property value in an object using dot-notation path.
 * Creates intermediate objects/arrays as needed.
 *
 * @param obj The object to modify
 * @param path Dot-separated path string (e.g., 'skills.0.name')
 * @param value The value to set
 *
 * @example
 * const character = {};
 * setNestedProperty(character, 'skills.0.name', 'New Skill');
 * // character now has: { skills: [{ name: 'New Skill' }] }
 */
export function setNestedProperty<T>(obj: Record<string, unknown>, path: string, value: T): void {
  const parts = path.split('.');
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current !== 'object' || current === null) {
      return;
    }
    if (typeof part !== 'string') {
      return;
    }
    const container = current as Record<string, unknown>;
    const existing = container[part];
    if (existing === undefined || existing === null || typeof existing !== 'object') {
      const nextKey = parts[i + 1] ?? '';
      container[part] = /^[0-9]+$/.test(nextKey) ? [] : {};
    }
    current = container[part];
  }
  const lastPart = parts[parts.length - 1];
  if (typeof current === 'object' && current !== null && typeof lastPart === 'string') {
    if (Array.isArray(current) && /^[0-9]+$/.test(lastPart)) {
      const idx = Number(lastPart);
      if (Number.isInteger(idx)) {
        if (value === undefined) {
          current.splice(idx, 1);
        } else if (idx >= current.length) {
          current.push(value as unknown);
        } else {
          current[idx] = value as unknown;
        }
        return;
      }
    }
    if (value === undefined) {
      delete (current as Record<string, unknown>)[lastPart];
      return;
    }
    (current as Record<string, unknown>)[lastPart] = value;
  }
}
