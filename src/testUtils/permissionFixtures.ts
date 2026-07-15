import type { PermissionGrant, PermissionKey } from '@/lib/auth/permissions';

export type PermissionProfile = 'contributor' | 'reviewer' | 'coordinator';

export const permissionGrantsForProfile = (
  profile: PermissionProfile | null
): PermissionGrant[] => {
  if (!profile) return [];
  const contributor: PermissionKey[] = [
    'article.create',
    'article.update_own',
    'comment.create',
    'game_data_action.create',
    'game_data_action.publish_relations',
    'relation.update',
  ];
  const reviewer: PermissionKey[] = [
    'article.update_any',
    'article_version.approve',
    'article_version.reject',
    'article_version.revoke',
    'comment.moderate',
    'game_data_action.approve',
    'game_data_action.reject',
    'category.create',
    'category.update',
    'category.delete',
  ];
  const coordinator: PermissionKey[] = [
    'game_data_action.mark_synced',
    'user.read',
    'user.update',
    'group.manage',
    'group.assign',
  ];
  const permissions = [
    ...contributor,
    ...(profile === 'reviewer' || profile === 'coordinator' ? reviewer : []),
    ...(profile === 'coordinator' ? coordinator : []),
  ];
  return permissions.map((permission) => ({
    permission,
    scope: 'global',
    resourceType: null,
    resourceId: null,
  }));
};
