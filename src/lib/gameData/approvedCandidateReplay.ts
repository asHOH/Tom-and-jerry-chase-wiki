import 'server-only';

import type { Action } from '@/lib/edit/diffUtils';
import { PUBLISHABLE_ENTITY_TYPES } from '@/lib/gameData/publishableEntityTypes';
import { createApprovedActionSnapshot } from '@/lib/gameData/published/approvedActionSnapshot';
import { getCanonicalGameData } from '@/lib/gameData/published/canonicalSources';
import { selectPublishedGameData } from '@/lib/gameData/published/selectPublishedDomain';

export type ApprovedCandidateReplayRow = {
  rowId: string;
  entityType: string;
  actions: readonly Readonly<Action>[];
};

export function validateApprovedCandidateReplay(rows: readonly ApprovedCandidateReplayRow[]): void {
  const snapshot = createApprovedActionSnapshot(
    rows.map((row) => ({
      entityType: row.entityType,
      decodedRow: {
        rowId: row.rowId,
        rawEntry: null,
        actions: row.actions,
      },
    }))
  );

  for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
    selectPublishedGameData(entityType, getCanonicalGameData(entityType), snapshot);
  }
}
