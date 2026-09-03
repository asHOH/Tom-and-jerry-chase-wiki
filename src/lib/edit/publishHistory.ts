import isEqual from 'lodash-es/isEqual';

import type { ActionHistoryEntry } from './diffUtils';

/**
 * Remove the entries submitted by a publish request without overwriting edits
 * appended while that request was in flight.
 */
export function reconcilePublishHistory(
  capturedSource: readonly ActionHistoryEntry[],
  capturedRemaining: readonly ActionHistoryEntry[],
  latest: readonly ActionHistoryEntry[]
): ActionHistoryEntry[] | null {
  if (latest.length < capturedSource.length) return null;

  const capturedPrefix = latest.slice(0, capturedSource.length);
  if (!isEqual(capturedPrefix, capturedSource)) return null;

  return [...capturedRemaining, ...latest.slice(capturedSource.length)];
}
