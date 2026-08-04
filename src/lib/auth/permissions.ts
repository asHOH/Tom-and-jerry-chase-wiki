export const PERMISSION_KEYS = [
  'article.create',
  'article.update_own',
  'article.update_any',
  'article_version.approve',
  'article_version.reject',
  'article_version.revoke',
  'comment.create',
  'comment.moderate',
  'game_data_action.create',
  'game_data_action.auto_approve',
  'game_data_action.approve',
  'game_data_action.reject',
  'game_data_action.vote',
  'game_data_action.view_votes',
  'game_data_action.mark_synced',
  'game_data_action.revoke',
  'game_data_action.publish_relations',
  'relation.update',
  'category.create',
  'category.update',
  'category.delete',
  'user.read',
  'user.update',
  'group.manage',
  'group.assign',
  'block.view',
  'block.manage',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];
export type PermissionScope = 'global' | 'resource_type' | 'resource';

export type PermissionGrant = {
  permission: PermissionKey;
  scope: PermissionScope;
  resourceType: string | null;
  resourceId: string | null;
};

export type ResourceContext = {
  resourceType: string;
  resourceId?: string;
};

export const GLOBAL_ONLY_PERMISSIONS = new Set<PermissionKey>([
  'user.read',
  'user.update',
  'group.manage',
  'group.assign',
  'block.view',
  'block.manage',
]);

export const isPermissionKey = (value: string): value is PermissionKey =>
  (PERMISSION_KEYS as readonly string[]).includes(value);

export const hasPermission = (
  grants: readonly PermissionGrant[],
  permission: PermissionKey
): boolean => grants.some((grant) => grant.permission === permission);

export const canAccess = (
  grants: readonly PermissionGrant[],
  permission: PermissionKey,
  context?: ResourceContext
): boolean =>
  grants.some((grant) => {
    if (grant.permission !== permission) return false;
    if (grant.scope === 'global') return true;
    if (!context || grant.resourceType !== context.resourceType) return false;
    if (grant.scope === 'resource_type') return true;
    return grant.resourceId === (context.resourceId ?? null);
  });

export const canAccessAny = (
  grants: readonly PermissionGrant[],
  permission: PermissionKey,
  contexts: readonly ResourceContext[]
): boolean => contexts.some((context) => canAccess(grants, permission, context));

export const canAccessAll = (
  grants: readonly PermissionGrant[],
  permission: PermissionKey,
  contexts: readonly ResourceContext[]
): boolean => contexts.every((context) => canAccess(grants, permission, context));

export const normalizePermissionGrants = (
  grants: readonly PermissionGrant[]
): PermissionGrant[] => {
  const unique = new Map<string, PermissionGrant>();

  for (const grant of grants) {
    if (GLOBAL_ONLY_PERMISSIONS.has(grant.permission) && grant.scope !== 'global') continue;
    const normalized: PermissionGrant =
      grant.scope === 'global'
        ? { permission: grant.permission, scope: 'global', resourceType: null, resourceId: null }
        : grant.scope === 'resource_type'
          ? {
              permission: grant.permission,
              scope: 'resource_type',
              resourceType: grant.resourceType,
              resourceId: null,
            }
          : grant;
    unique.set(
      `${normalized.permission}:${normalized.scope}:${normalized.resourceType ?? ''}:${normalized.resourceId ?? ''}`,
      normalized
    );
  }

  const values = [...unique.values()];
  return values.filter((grant) => {
    if (grant.scope === 'global') return true;
    if (
      values.some(
        (candidate) => candidate.permission === grant.permission && candidate.scope === 'global'
      )
    ) {
      return false;
    }
    if (grant.scope === 'resource') {
      return !values.some(
        (candidate) =>
          candidate.permission === grant.permission &&
          candidate.scope === 'resource_type' &&
          candidate.resourceType === grant.resourceType
      );
    }
    return true;
  });
};
