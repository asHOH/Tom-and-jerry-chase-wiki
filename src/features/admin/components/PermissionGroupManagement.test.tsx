import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { PermissionGrant } from '@/lib/auth/permissions';

import PermissionGroupManagement, {
  type PermissionCatalogEntry,
  type PermissionGroup,
} from './PermissionGroupManagement';

const articleCreate: PermissionGrant = {
  permission: 'article.create',
  scope: 'global',
  resourceType: null,
  resourceId: null,
};

const catalog: PermissionCatalogEntry[] = [
  {
    key: 'article.create',
    category: '文章',
    label_zh: '创建文章',
    global_only: false,
    sort_order: 10,
  },
];

const originalFetch = global.fetch;

const contributor: PermissionGroup = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Contributor',
  description: '',
  isDefault: true,
  isProtected: true,
  parentGroupId: null,
  memberCount: 1,
  grants: [articleCreate],
  inheritedGrants: [],
};

describe('PermissionGroupManagement', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('shows inherited grants as read-only and excludes descendants as parents', () => {
    const reviewer: PermissionGroup = {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Reviewer',
      description: '',
      isDefault: false,
      isProtected: true,
      parentGroupId: contributor.id,
      memberCount: 1,
      grants: [],
      inheritedGrants: [
        { ...articleCreate, sourceGroupId: contributor.id, sourceGroupName: contributor.name },
      ],
    };
    const coordinator: PermissionGroup = {
      id: '00000000-0000-4000-8000-000000000003',
      name: 'Coordinator',
      description: '',
      isDefault: false,
      isProtected: true,
      parentGroupId: reviewer.id,
      memberCount: 1,
      grants: [],
      inheritedGrants: [],
    };

    render(
      <PermissionGroupManagement
        groups={[reviewer, contributor, coordinator]}
        catalog={catalog}
        resourceOptions={{}}
        canManage={false}
        mutateGroups={jest.fn()}
      />
    );

    expect(screen.getByText('全局 · 来自 Contributor')).toBeInTheDocument();
    const parentSelect = screen.getByLabelText('扩展用户组');
    expect(parentSelect).toHaveValue(contributor.id);
    expect(screen.getByRole('option', { name: 'Contributor' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Coordinator' })).not.toBeInTheDocument();
  });

  it('removes a direct grant when the selected parent already supplies it', async () => {
    const customGroup: PermissionGroup = {
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Custom',
      description: '',
      isDefault: false,
      isProtected: false,
      parentGroupId: null,
      memberCount: 0,
      grants: [articleCreate],
      inheritedGrants: [],
    };
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
    global.fetch = fetchMock;

    render(
      <PermissionGroupManagement
        groups={[customGroup, contributor]}
        catalog={catalog}
        resourceOptions={{}}
        canManage
        mutateGroups={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('扩展用户组'), {
      target: { value: contributor.id },
    });
    fireEvent.click(screen.getByRole('button', { name: '保存更改' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      name: 'Custom',
      description: '',
      isDefault: false,
      grants: [],
      parentGroupId: contributor.id,
    });
  });
});
