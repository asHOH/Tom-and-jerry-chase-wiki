import 'server-only';

import { createHash } from 'node:crypto';

export type PublishedRevision = `v1:${string}`;

export function createPublishedRevision(
  buildIdentity: string,
  actionRevision: string
): PublishedRevision {
  const digest = createHash('sha256')
    .update(JSON.stringify(['v1', buildIdentity, actionRevision]), 'utf8')
    .digest('hex');

  return `v1:${digest}`;
}
