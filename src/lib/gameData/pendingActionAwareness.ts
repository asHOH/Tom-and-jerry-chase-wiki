import type { Action } from '@/lib/edit/diffUtils';

import {
  areActionDependencyDescriptorsOrderDependent,
  toActionDependencyDescriptor,
  type ActionDependencyDescriptor,
} from './actionDependencies';
import type {
  PendingActionOverlapSummary,
  PendingActionTarget,
} from './pendingActionAwarenessTypes';

export function pendingTargetAffectsDescriptor(
  target: ActionDependencyDescriptor,
  descriptor: ActionDependencyDescriptor
): boolean {
  return areActionDependencyDescriptorsOrderDependent(target, descriptor);
}

export function pendingTargetAffectsAction(
  target: ActionDependencyDescriptor,
  action: Readonly<Action>
): boolean {
  return pendingTargetAffectsDescriptor(target, toActionDependencyDescriptor(action));
}

export function summarizePendingActionTargets(
  targets: readonly PendingActionTarget[],
  truncated = false
): PendingActionOverlapSummary {
  return {
    targets: [...targets],
    affectedPathCount: new Set(targets.map((target) => target.path)).size,
    ownCount: targets.reduce(
      (total, target) => total + (target.ownership === 'self' ? target.count : 0),
      0
    ),
    otherCount: targets.reduce(
      (total, target) => total + (target.ownership === 'other' ? target.count : 0),
      0
    ),
    publicCount: targets.reduce((total, target) => total + (target.isPublic ? target.count : 0), 0),
    truncated,
  };
}

export function findPendingTargetsForDescriptors(
  targets: readonly PendingActionTarget[],
  descriptors: readonly ActionDependencyDescriptor[]
): PendingActionTarget[] {
  return targets.filter((target) =>
    descriptors.some((descriptor) => pendingTargetAffectsDescriptor(target, descriptor))
  );
}
