'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import type { PermissionResourceOption } from '@/lib/auth/permissionResources';
import { cn } from '@/lib/design';
import type { AdminNotice } from '@/lib/notices/types';
import { useUser } from '@/hooks/useUser';
import type { Database } from '@/data/database.types';
import BlockManagement from '@/features/admin/components/BlockManagement';
import CategoryManagement from '@/features/admin/components/CategoryManagement';
import GameDataActionModerationPanel, {
  PendingGameDataAction,
} from '@/features/admin/components/GameDataActionModerationPanel';
import NoticeManagement from '@/features/admin/components/NoticeManagement';
import PermissionGroupManagement, {
  type PermissionCatalogEntry,
  type PermissionGroup,
} from '@/features/admin/components/PermissionGroupManagement';
import UserManagement from '@/features/admin/components/UserManagement';
import Button from '@/components/ui/Button';

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

type NoticesResponse = { notices: AdminNotice[] };

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

const fetchNotices = async (): Promise<NoticesResponse> => {
  const response = await fetch('/api/admin/notices');
  if (!response.ok) throw new Error('Failed to fetch notices');
  return response.json();
};

type AdminTab = 'users' | 'groups' | 'categories' | 'notices' | 'actions' | 'blocks';

const ADMIN_TABS: readonly AdminTab[] = [
  'users',
  'groups',
  'categories',
  'notices',
  'actions',
  'blocks',
];

const isAdminTab = (value: string | null): value is AdminTab =>
  value !== null && ADMIN_TABS.includes(value as AdminTab);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('categories');
  const searchParams = useSearchParams();
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
  const enableNoticeAccess = !administrativeActionsBlocked && permissions.has('notice.manage');

  useEffect(() => {
    if (activeTab === 'categories' && !enableCategoryAccess) {
      if (enableGroupAccess) setActiveTab('groups');
      else if (enableUserAccess) setActiveTab('users');
      else if (enableActionModeration) setActiveTab('actions');
      else if (enableNoticeAccess) setActiveTab('notices');
      else if (enableBlockAccess) setActiveTab('blocks');
    }
  }, [
    activeTab,
    enableActionModeration,
    enableCategoryAccess,
    enableBlockAccess,
    enableGroupAccess,
    enableNoticeAccess,
    enableUserAccess,
  ]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (!isAdminTab(requestedTab)) return;

    if (requestedTab === 'users' && enableUserAccess) setActiveTab('users');
    if (requestedTab === 'groups' && enableGroupAccess) setActiveTab('groups');
    if (requestedTab === 'categories' && enableCategoryAccess) setActiveTab('categories');
    if (requestedTab === 'notices' && enableNoticeAccess) setActiveTab('notices');
    if (requestedTab === 'actions' && enableActionModeration) setActiveTab('actions');
    if (requestedTab === 'blocks' && enableBlockAccess) setActiveTab('blocks');
  }, [
    enableActionModeration,
    enableCategoryAccess,
    enableBlockAccess,
    enableGroupAccess,
    enableNoticeAccess,
    enableUserAccess,
    searchParams,
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
  const { data: noticesData, mutate: mutateNotices } = useSWR(
    enableNoticeAccess ? 'admin-notices' : null,
    fetchNotices
  );

  const pendingCount = pendingActions.filter((a) => a.status === 'pending').length;

  const getTabClassName = (tab: AdminTab) =>
    cn(
      'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
      activeTab === tab
        ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
    );

  return (
    <div className='mx-auto max-w-7xl p-6 dark:text-slate-200'>
      <h1 className='mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100'>管理面板</h1>

      <div className='mb-6 flex overflow-x-auto border-b border-gray-200 dark:border-slate-700'>
        {enableUserAccess && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('users')}
            className={getTabClassName('users')}
          >
            用户管理
            {users.length > 0 && (
              <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'>
                {users.length}
              </span>
            )}
          </Button>
        )}
        {enableGroupAccess && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('groups')}
            className={getTabClassName('groups')}
          >
            用户组
          </Button>
        )}
        {enableCategoryAccess && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('categories')}
            className={getTabClassName('categories')}
          >
            分类管理
          </Button>
        )}
        {enableActionModeration && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('actions')}
            className={getTabClassName('actions')}
          >
            改动审核
            {pendingCount > 0 && (
              <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'>
                {pendingCount}
              </span>
            )}
          </Button>
        )}
        {enableNoticeAccess && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('notices')}
            className={getTabClassName('notices')}
          >
            公告管理
          </Button>
        )}
        {enableBlockAccess && (
          <Button
            variant='unstyled'
            onClick={() => setActiveTab('blocks')}
            className={getTabClassName('blocks')}
          >
            封禁管理
          </Button>
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
          canApproveActions={permissions.has('game_data_action.approve')}
          canRejectActions={permissions.has('game_data_action.reject')}
          canMarkActionsSynced={permissions.has('game_data_action.mark_synced')}
          canRevokeActions={permissions.has('game_data_action.revoke')}
          pendingActions={pendingActions}
          mutatePendingActions={mutatePendingActions}
        />
      )}

      {enableNoticeAccess && activeTab === 'notices' && (
        <NoticeManagement notices={noticesData?.notices ?? []} mutateNotices={mutateNotices} />
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
