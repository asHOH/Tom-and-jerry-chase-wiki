import type { PermissionGrant } from '@/lib/auth/permissions';

import {
  getDescendantGroupIds,
  isGrantCovered,
  removeCoveredDirectGrants,
} from './groupInheritance';

const grant = (overrides: Partial<PermissionGrant> = {}): PermissionGrant => ({
  permission: 'article.create',
  scope: 'global',
  resourceType: null,
  resourceId: null,
  ...overrides,
});

describe('group inheritance helpers', () => {
  it('finds direct and transitive descendants', () => {
    const groups = [
      { id: 'contributor', parentGroupId: null },
      { id: 'reviewer', parentGroupId: 'contributor' },
      { id: 'coordinator', parentGroupId: 'reviewer' },
      { id: 'unrelated', parentGroupId: null },
    ];

    expect(getDescendantGroupIds(groups, 'contributor')).toEqual(
      new Set(['reviewer', 'coordinator'])
    );
  });

  it('recognizes grants covered by broader inherited scopes', () => {
    expect(
      isGrantCovered(grant({ scope: 'resource', resourceType: 'articles', resourceId: 'one' }), [
        grant(),
      ])
    ).toBe(true);
    expect(
      isGrantCovered(grant({ scope: 'resource', resourceType: 'articles', resourceId: 'one' }), [
        grant({ scope: 'resource_type', resourceType: 'articles' }),
      ])
    ).toBe(true);
    expect(
      isGrantCovered(grant(), [grant({ scope: 'resource_type', resourceType: 'articles' })])
    ).toBe(false);
  });

  it('removes only redundant direct grants', () => {
    const direct = [grant(), grant({ permission: 'comment.create' })];
    expect(removeCoveredDirectGrants(direct, [grant()])).toEqual([
      grant({ permission: 'comment.create' }),
    ]);
  });
});
