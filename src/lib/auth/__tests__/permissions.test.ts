import {
  canAccess,
  canAccessAll,
  hasPermission,
  normalizePermissionGrants,
  type PermissionGrant,
} from '@/lib/auth/permissions';
import { permissionGrantsForProfile } from '@/testUtils/permissionFixtures';

const grant = (
  permission: PermissionGrant['permission'],
  scope: PermissionGrant['scope'] = 'global',
  resourceType: string | null = null,
  resourceId: string | null = null
): PermissionGrant => ({ permission, scope, resourceType, resourceId });

describe('permission evaluator', () => {
  it('combines grants and exposes coarse feature availability', () => {
    const grants = [
      grant('article.create'),
      grant('comment.moderate', 'resource_type', 'comments/articles'),
    ];
    expect(hasPermission(grants, 'article.create')).toBe(true);
    expect(hasPermission(grants, 'comment.moderate')).toBe(true);
    expect(hasPermission(grants, 'group.manage')).toBe(false);
  });

  it('matches global, resource type, and exact resource grants', () => {
    const grants = [
      grant('article.create'),
      grant('game_data_action.create', 'resource_type', 'characters'),
      grant('relation.update', 'resource', 'characters', 'Tom'),
    ];
    expect(
      canAccess(grants, 'article.create', { resourceType: 'categories', resourceId: '1' })
    ).toBe(true);
    expect(
      canAccess(grants, 'game_data_action.create', {
        resourceType: 'characters',
        resourceId: 'Tom',
      })
    ).toBe(true);
    expect(
      canAccess(grants, 'game_data_action.create', { resourceType: 'maps', resourceId: '经典之家' })
    ).toBe(false);
    expect(
      canAccess(grants, 'relation.update', { resourceType: 'characters', resourceId: 'Tom' })
    ).toBe(true);
    expect(
      canAccess(grants, 'relation.update', { resourceType: 'characters', resourceId: 'Jerry' })
    ).toBe(false);
  });

  it('requires every context for batch authorization', () => {
    const grants = [grant('relation.update', 'resource', 'characters', 'Tom')];
    expect(
      canAccessAll(grants, 'relation.update', [{ resourceType: 'characters', resourceId: 'Tom' }])
    ).toBe(true);
    expect(
      canAccessAll(grants, 'relation.update', [
        { resourceType: 'characters', resourceId: 'Tom' },
        { resourceType: 'characters', resourceId: 'Jerry' },
      ])
    ).toBe(false);
  });

  it('normalizes duplicate and shadowed grants', () => {
    const grants = normalizePermissionGrants([
      grant('article.create'),
      grant('article.create', 'resource_type', 'categories'),
      grant('relation.update', 'resource_type', 'characters'),
      grant('relation.update', 'resource', 'characters', 'Tom'),
      grant('group.manage', 'resource_type', 'groups'),
    ]);
    expect(grants).toEqual([
      grant('article.create'),
      grant('relation.update', 'resource_type', 'characters'),
    ]);
  });

  it('reproduces the legacy seeded hierarchy', () => {
    const contributor = permissionGrantsForProfile('contributor');
    const reviewer = permissionGrantsForProfile('reviewer');
    const coordinator = permissionGrantsForProfile('coordinator');
    expect(hasPermission(contributor, 'article.create')).toBe(true);
    expect(hasPermission(contributor, 'article_version.approve')).toBe(false);
    expect(hasPermission(contributor, 'game_data_action.auto_approve')).toBe(false);
    expect(hasPermission(reviewer, 'article_version.approve')).toBe(true);
    expect(hasPermission(reviewer, 'game_data_action.auto_approve')).toBe(true);
    expect(hasPermission(reviewer, 'group.manage')).toBe(false);
    expect(hasPermission(coordinator, 'group.manage')).toBe(true);
    expect(hasPermission(coordinator, 'game_data_action.mark_synced')).toBe(true);
  });
});
