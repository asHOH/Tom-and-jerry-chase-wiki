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
  return path
    .split('.')
    .reduce(
      (acc: unknown, part: string) =>
        acc &&
        typeof acc === 'object' &&
        typeof part === 'string' &&
        part in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    ) as unknown as T;
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
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current !== 'object' || current === null) {
      return;
    }
    if (typeof part !== 'string') {
      return;
    }
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      if (Number.isNaN(parseInt(part, 10))) current[part] = {};
      else current[part] = [];
    }
    current = current[part] as Record<string, unknown>;
  }
  const lastPart = parts[parts.length - 1];
  if (typeof current === 'object' && current !== null && typeof lastPart === 'string') {
    current[lastPart] = value;
  }
}
