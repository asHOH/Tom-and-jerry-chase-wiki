import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';
import { actionHistoryEntrySchema } from '@/lib/validation/schemas';

import type { PublicActionRow } from './publicActionsTypes';

export type DecodedStoredActionRow = {
  rowId: string;
  rawEntry: unknown;
  actions: readonly Readonly<Action>[];
};

export type DecodeStoredActionRowResult =
  | { success: true; value: DecodedStoredActionRow }
  | {
      success: false;
      error: {
        code: 'invalid_entry';
        rowId: string;
        message: string;
      };
    };

function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== 'object' || seen.has(value)) return value;

  seen.add(value);
  for (const child of Object.values(value)) freezeDeep(child, seen);
  return Object.freeze(value);
}

/**
 * Normalizes DB action payloads into replayable action history entries.
 *
 * Compatibility:
 * - single ActionHistoryEntry -> one entry
 * - plain Action[] -> multiple replay entries, preserving existing replay behavior
 * - ActionHistoryEntry[] persisted by newer batch flows -> many entries
 */
export function normalizePublicActionEntries(rawEntry: unknown): ActionHistoryEntry[] {
  if (Array.isArray(rawEntry)) {
    const entries: ActionHistoryEntry[] = [];

    for (const item of rawEntry) {
      const parsed = actionHistoryEntrySchema.safeParse(item);
      if (!parsed.success) {
        const singleParsed = actionHistoryEntrySchema.safeParse(rawEntry);
        return singleParsed.success ? [singleParsed.data as ActionHistoryEntry] : [];
      }

      entries.push(parsed.data as ActionHistoryEntry);
    }

    return entries.length > 0 ? entries : [];
  }

  const parsed = actionHistoryEntrySchema.safeParse(rawEntry);
  return parsed.success ? [parsed.data as ActionHistoryEntry] : [];
}

/**
 * Decodes one persisted database row without changing existing replay behavior.
 *
 * This additive compatibility decoder deliberately uses the current action schema. The stricter
 * path, array, operation, and error contracts must be decided and audited before active replay
 * consumers move to it.
 */
export function decodeStoredActionRow(
  row: Pick<PublicActionRow, 'id' | 'entry'>
): DecodeStoredActionRowResult {
  let rawEntry: unknown;
  try {
    rawEntry = structuredClone(row.entry);
  } catch {
    return {
      success: false,
      error: {
        code: 'invalid_entry',
        rowId: row.id,
        message: 'Stored action row entry could not be copied',
      },
    };
  }

  const entries = normalizePublicActionEntries(rawEntry);
  if (entries.length === 0) {
    return {
      success: false,
      error: {
        code: 'invalid_entry',
        rowId: row.id,
        message: 'Stored action row entry is empty or malformed',
      },
    };
  }

  const actions = freezeDeep(flattenActionEntries(entries));
  return {
    success: true,
    value: Object.freeze({
      rowId: row.id,
      rawEntry: freezeDeep(rawEntry),
      actions,
    }),
  };
}

export function flattenActionEntries(entries: ActionHistoryEntry[]): Action[] {
  return entries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
}
