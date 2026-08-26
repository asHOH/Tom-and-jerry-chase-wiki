import type { ActionDependencyDescriptor } from './actionDependencies';

export type PendingActionOwnership = 'self' | 'other';

export type PendingActionTarget = ActionDependencyDescriptor & {
  ownership: PendingActionOwnership;
  isPublic: boolean;
  count: number;
};

export type PendingActionTargetsResponse = {
  targets: PendingActionTarget[];
  truncated: boolean;
};

export type PendingActionOverlapSummary = {
  targets: PendingActionTarget[];
  affectedPathCount: number;
  ownCount: number;
  otherCount: number;
  publicCount: number;
  truncated: boolean;
};

export type PendingActionOverlapResponse = PendingActionOverlapSummary & {
  error: 'pending_action_overlap';
  pendingAcknowledgementToken: `v1:${string}`;
};
