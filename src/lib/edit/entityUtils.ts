/**
 * Generic entity utilities for editing any data type (characters, factions, knowledge cards, etc.)
 * Provides type-safe path manipulation and entity-agnostic operations.
 */

/**
 * Type-safe path key generator for nested objects.
 * Generates valid dot-notation paths for any entity type.
 *
 * @example
 * type CharacterKeys = Key<Character>;
 * const path: CharacterKeys = 'skills.0.name'; // ✓ Valid
 * const path: CharacterKeys = 'invalid.path'; // ✗ Type error
 */
export type Key<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends readonly (infer U)[]
        ? K | `${K}.${number}` | (U extends object ? `${K}.${Key<U>}` : never)
        : T[K] extends object
          ? K | `${K}.${Key<T[K]>}`
          : K;
    }[keyof T & string]
  : never;

/**
 * Checks if an item is a non-array object.
 *
 * @param item The item to check.
 * @returns True if the item is a non-array object, false otherwise.
 */
function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

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

/**
 * Deeply assigns the values of source object to the target object.
 * Used for merging partial updates into existing entities.
 *
 * @param target The object to which values will be assigned.
 * @param source The object from which values will be assigned.
 * @returns A new object with the merged properties.
 *
 * @example
 * const merged = deepAssign({ a: 1, b: { c: 2 } }, { b: { d: 3 } });
 * // { a: 1, b: { c: 2, d: 3 } }
 */
export function deepAssign<T extends object, U extends object>(target: T, source: U): T & U {
  const output = { ...target } as T & U;

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = (output as Record<string, unknown>)[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        (output as Record<string, unknown>)[key] = deepAssign(targetValue, sourceValue);
      } else {
        (output as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return output;
}

/**
 * Generic entity edit handler that dispatches to entity-specific handlers.
 * Can be extended with custom handlers for different entity types.
 *
 * @param entityType The type of entity being edited ('character', 'faction', 'knowledgeCard', etc.)
 * @param entity The entity object to modify
 * @param path The dot-notation path to the property being edited
 * @param newValue The new value
 * @param context Optional context object for entity-specific operations (handlers, callbacks, etc.)
 */
export interface EditContext {
  handlers?: Record<
    string,
    (path: string, value: unknown, entity: Record<string, unknown>) => void
  >;
  onBeforeChange?: (path: string, oldValue: unknown, newValue: unknown) => void;
  onAfterChange?: (path: string, newValue: unknown) => void;
}

export function editEntityProperty<T extends Record<string, unknown>>(
  entityType: string,
  entity: T,
  path: string,
  newValue: unknown,
  context?: EditContext
): void {
  const oldValue = getNestedProperty(entity, path);

  // Call before-change hook if provided
  if (context?.onBeforeChange) {
    context.onBeforeChange(path, oldValue, newValue);
  }

  // Check if entity-type-specific handler exists
  if (context?.handlers?.[entityType]) {
    context.handlers[entityType](path, newValue, entity);
  } else {
    // Default generic handler: set the property
    setNestedProperty(entity, path, newValue);
  }

  // Call after-change hook if provided
  if (context?.onAfterChange) {
    context.onAfterChange(path, newValue);
  }
}

/**
 * Extracts the entity ID from a dot-notation path.
 * Assumes first component is the entity ID.
 *
 * @param path The dot-notation path
 * @returns The entity ID, or empty string if not found
 *
 * @example
 * const id = extractEntityIdFromPath('character-123.skills.0.name');
 * // Returns: 'character-123'
 */
export function extractEntityIdFromPath(path: string): string {
  return path.split('.')[0] || '';
}

/**
 * Validates that a path exists in an entity's structure.
 * Useful for preventing silent failures when editing non-existent fields.
 *
 * @param entity The entity object
 * @param path The dot-notation path to validate
 * @returns True if the path exists in the entity, false otherwise
 *
 * @example
 * const exists = validatePathExists(character, 'skills.0.name');
 */
export function validatePathExists(entity: Record<string, unknown>, path: string): boolean {
  const value = getNestedProperty(entity, path);
  return value !== undefined;
}
