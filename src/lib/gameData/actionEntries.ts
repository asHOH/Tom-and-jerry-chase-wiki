import type { Action, ActionHistoryEntry } from '@/lib/edit/diffUtils';
import { actionHistoryEntrySchema } from '@/lib/validation/schemas';

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

export function flattenActionEntries(entries: ActionHistoryEntry[]): Action[] {
  return entries.flatMap((entry) => (Array.isArray(entry) ? entry : [entry]));
}
