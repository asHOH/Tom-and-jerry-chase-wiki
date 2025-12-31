/**
 * Edit mode validation and error utilities.
 * Provides helpers for path validation and error handling.
 */

import { validatePathExists as validatePathExistsUtil } from '@/lib/edit/entityUtils';

/**
 * Validates that an edit path exists in the entity before applying changes.
 * Helps catch typos and invalid paths early.
 *
 * @param entity The entity object
 * @param path The dot-notation path to validate
 * @param entityType The type of entity (for error messages)
 * @returns True if path is valid, false otherwise
 *
 * @example
 * if (!validateEditPath(character, 'skills.0.name', 'character')) {
 *   console.error('Invalid path for character edit');
 *   return;
 * }
 */
export function validateEditPath(
  entity: Record<string, unknown>,
  path: string,
  entityType: string
): boolean {
  const isValid = validatePathExistsUtil(entity, path);
  if (!isValid) {
    console.warn(
      `[EditMode] Path validation failed for ${entityType}: "${path}" does not exist in entity`
    );
  }
  return isValid;
}

/**
 * Safe JSON parse with error handling and logging.
 *
 * @param json The JSON string to parse
 * @param context Optional context for error message
 * @returns Parsed object or empty object if parsing fails
 */
export function safeJsonParse<T = Record<string, unknown>>(
  json: string | null | undefined,
  context?: string
): T {
  if (!json) {
    return {} as T;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EditMode] JSON parse error${context ? ` (${context})` : ''}: ${message}`);
    return {} as T;
  }
}

/**
 * Safe JSON stringify with error handling and logging.
 *
 * @param obj The object to stringify
 * @param context Optional context for error message
 * @returns Stringified JSON or empty string if stringification fails
 */
export function safeJsonStringify(obj: unknown, context?: string): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[EditMode] JSON stringify error${context ? ` (${context})` : ''}: ${message}`);
    return '';
  }
}

/**
 * Wraps a function with error handling and logging.
 *
 * @param fn The function to wrap
 * @param operationName The name of the operation (for logging)
 * @returns A wrapped function that catches and logs errors
 *
 * @example
 * const safeFn = withErrorHandler(() => { ... }, 'character-sync');
 */
export function withErrorHandler<T extends unknown[], R>(
  fn: (...args: T) => R,
  operationName: string
): (...args: T) => R | undefined {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[EditMode] Error in ${operationName}: ${message}`, error);
      return undefined;
    }
  };
}
