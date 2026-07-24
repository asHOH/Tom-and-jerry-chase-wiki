'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import type { PermissionResourceOption } from '@/lib/auth/permissionResources';
import { cn } from '@/lib/design';
import { useUser } from '@/hooks/useUser';
import type { Database } from '@/data/database.types';
import BlockManagement from '@/features/admin/components/BlockManagement';
import CategoryManagement from '@/features/admin/components/CategoryManagement';
import GameDataActionModerationPanel, {
  PendingGameDataAction,
} from '@/features/admin/components/GameDataActionModerationPanel';
import PermissionGroupManagement, {
  type PermissionCatalogEntry,
  type PermissionGroup,
} from '@/features/admin/components/PermissionGroupManagement';
import UserManagement from '@/features/admin/components/UserManagement';

type Category = Database['public']['Tables']['categories']['Row'];

type User = {
  id: string;
  nickname: string;
  groupIds: string[];
};

type GroupsResponse = {
  catalog: PermissionCatalogEntry[];
  groups: PermissionGroup[];
  resourceOptions: Record<string, PermissionResourceOption[]>;
};

type BlocksResponse = {
  blocks: ComponentProps<typeof BlockManagement>['blocks'];
  logs: ComponentProps<typeof BlockManagement>['logs'];
  users: ComponentProps<typeof BlockManagement>['users'];
  resourceOptions: ComponentProps<typeof BlockManagement>['resourceOptions'];
};

const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/auth/fetch-users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/admin/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

const fetchGroups = async (): Promise<GroupsResponse> => {
  const response = await fetch('/api/admin/groups');
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
};

const fetchPendingGameDataActions = async (): Promise<PendingGameDataAction[]> => {
  const response = await fetch('/api/game-data-actions/admin?status=all');
  if (!response.ok) {
    throw new Error('Failed to fetch pending actions');
  }

  const data = (await response.json()) as {
    submissions?: PendingGameDataAction[];
  };

  return data.submissions ?? [];
};

const fetchBlocks = async (): Promise<BlocksResponse> => {
  const response = await fetch('/api/admin/blocks?status=history');
  if (!response.ok) throw new Error('Failed to fetch blocks');
  return response.json();
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'groups' | 'categories' | 'actions' | 'blocks'
  >('categories');
  const permissions = usePermissions();
  const { blockSummary } = useUser();
  const administrativeActionsBlocked = blockSummary.some((block) => block.action === 'edit');

  const enableUserAccess =
    !administrativeActionsBlocked &&
    (permissions.has('user.read') ||
      permissions.has('user.update') ||
      permissions.has('group.assign'));
  const enableActionModeration =
    !administrativeActionsBlocked &&
    (permissions.has('game_data_action.approve') ||
      permissions.has('game_data_action.reject') ||
      permissions.has('game_data_action.revoke'));
  const enableGroupAccess =
    !administrativeActionsBlocked &&
    (permissions.has('group.manage') || permissions.has('group.assign'));
  const enableCategoryAccess =
    !administrativeActionsBlocked &&
    (permissions.has('category.create') ||
      permissions.has('category.update') ||
      permissions.has('category.delete'));
  const enableBlockAccess = permissions.has('block.view') || permissions.has('block.manage');

  useEffect(() => {
    if (activeTab === 'categories' && !enableCategoryAccess) {
      if (enableGroupAccess) setActiveTab('groups');
      else if (enableUserAccess) setActiveTab('users');
      else if (enableActionModeration) setActiveTab('actions');
      else if (enableBlockAccess) setActiveTab('blocks');
    }
  }, [
    activeTab,
    enableActionModeration,
    enableCategoryAccess,
    enableBlockAccess,
    enableGroupAccess,
    enableUserAccess,
  ]);

  const { data: users = [], mutate: mutateUsers } = useSWR(
    enableUserAccess ? 'users' : null,
    fetchUsers
  );

  const { data: categories = [], mutate: mutateCategories } = useSWR(
    enableCategoryAccess ? 'categories' : null,
    fetchCategories
  );
  const { data: groupsData, mutate: mutateGroups } = useSWR(
    enableGroupAccess ? 'permission-groups' : null,
    fetchGroups
  );

  const { data: pendingActions = [], mutate: mutatePendingActions } = useSWR(
    enableActionModeration ? 'game-data-actions-admin' : null,
    fetchPendingGameDataActions
  );
  const { data: blocksData, mutate: mutateBlocks } = useSWR(
    enableBlockAccess ? 'admin-blocks' : null,
    fetchBlocks
  );

  const pendingCount = pendingActions.filter((a) => a.status === 'pending').length;

  const getTabClassName = (tab: 'users' | 'groups' | 'categories' | 'actions' | 'blocks') =>
    cn(
      'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
      activeTab === tab
        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
    );

  return (
    <div className='mx-auto max-w-7xl p-6 dark:text-slate-200'>
      <h1 className='mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100'>管理面板</h1>

      <div className='mb-6 flex border-b border-gray-200 dark:border-slate-700'>
        {enableUserAccess && (
          <button onClick={() => setActiveTab('users')} className={getTabClassName('users')}>
            用户管理
            {users.length > 0 && (
              <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
                {users.length}
              </span>
            )}
          </button>
        )}
        {enableGroupAccess && (
          <button onClick={() => setActiveTab('groups')} className={getTabClassName('groups')}>
            用户组
          </button>
        )}
        {enableCategoryAccess && (
          <button
            onClick={() => setActiveTab('categories')}
            className={getTabClassName('categories')}
          >
            分类管理
          </button>
        )}
        {enableActionModeration && (
          <button onClick={() => setActiveTab('actions')} className={getTabClassName('actions')}>
            改动审核
            {pendingCount > 0 && (
              <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'>
                {pendingCount}
              </span>
            )}
          </button>
        )}
        {enableBlockAccess && (
          <button onClick={() => setActiveTab('blocks')} className={getTabClassName('blocks')}>
            封禁管理
          </button>
        )}
      </div>

      {enableUserAccess && activeTab === 'users' && (
        <UserManagement
          users={users}
          groups={groupsData?.groups ?? []}
          canAssignGroups={permissions.has('group.assign')}
          canUpdateUsers={permissions.has('user.update')}
          mutateUsers={mutateUsers}
        />
      )}

      {enableGroupAccess && activeTab === 'groups' && (
        <PermissionGroupManagement
          groups={groupsData?.groups ?? []}
          catalog={groupsData?.catalog ?? []}
          resourceOptions={groupsData?.resourceOptions ?? {}}
          canManage={permissions.has('group.manage')}
          mutateGroups={mutateGroups}
        />
      )}

      {enableCategoryAccess && activeTab === 'categories' && (
        <CategoryManagement
          categories={categories}
          canCreate={permissions.has('category.create')}
          canUpdate={permissions.has('category.update')}
          canDelete={permissions.has('category.delete')}
          mutateCategories={mutateCategories}
        />
      )}

      {enableActionModeration && activeTab === 'actions' && (
        <GameDataActionModerationPanel
          canMarkActionsSynced={permissions.has('game_data_action.mark_synced')}
          canRevokeActions={permissions.has('game_data_action.revoke')}
          pendingActions={pendingActions}
          mutatePendingActions={mutatePendingActions}
        />
      )}

      {enableBlockAccess && activeTab === 'blocks' && (
        <BlockManagement
          blocks={blocksData?.blocks ?? []}
          logs={blocksData?.logs ?? []}
          users={blocksData?.users ?? []}
          resourceOptions={blocksData?.resourceOptions ?? {}}
          canManage={permissions.has('block.manage')}
          mutateBlocks={mutateBlocks}
        />
      )}
    </div>
  );
};

export default AdminPanel;
