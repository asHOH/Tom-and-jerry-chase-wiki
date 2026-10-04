import 'server-only';

import { createHash } from 'node:crypto';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';

import {
  createApprovedActionRevision,
  type ApprovedActionSnapshot,
} from './approvedActionSnapshot';

export type PublishedRevision = `v1:${string}`;

export function createPublishedDomainRevision(
  buildIdentity: string,
  entityType: PublishableEntityType,
  snapshot: ApprovedActionSnapshot
): PublishedRevision {
  const actionRevision = createApprovedActionRevision(
    snapshot.rows.filter((row) => row.entityType === entityType)
  );
  return createPublishedRevision(buildIdentity, `${entityType}:${actionRevision}`);
}

export function createPublishedRevision(
  buildIdentity: string,
  actionRevision: string
): PublishedRevision {
  const digest = createHash('sha256')
    .update(JSON.stringify(['v1', buildIdentity, actionRevision]), 'utf8')
    .digest('hex');

  return `v1:${digest}`;
}
