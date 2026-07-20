import type { PermissionGrant } from '@/lib/auth/permissions';

export type GroupHierarchyNode = {
  id: string;
  parentGroupId: string | null;
};

export const getDescendantGroupIds = (
  groups: readonly GroupHierarchyNode[],
  groupId: string
): Set<string> => {
  const descendants = new Set<string>();
  const pending = [groupId];

  while (pending.length > 0) {
    const parentId = pending.pop();
    for (const group of groups) {
      if (group.parentGroupId !== parentId || descendants.has(group.id)) continue;
      descendants.add(group.id);
      pending.push(group.id);
    }
  }

  return descendants;
};

export const isGrantCovered = (
  grant: PermissionGrant,
  inheritedGrants: readonly PermissionGrant[]
): boolean =>
  inheritedGrants.some((inherited) => {
    if (inherited.permission !== grant.permission) return false;
    if (inherited.scope === 'global') return true;
    if (grant.scope === 'global') return false;
    if (inherited.scope === 'resource_type' && inherited.resourceType === grant.resourceType) {
      return true;
    }
    return (
      grant.scope === 'resource' &&
      inherited.scope === 'resource' &&
      inherited.resourceType === grant.resourceType &&
      inherited.resourceId === grant.resourceId
    );
  });

export const removeCoveredDirectGrants = (
  grants: readonly PermissionGrant[],
  inheritedGrants: readonly PermissionGrant[]
): PermissionGrant[] => grants.filter((grant) => !isGrantCovered(grant, inheritedGrants));
