'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import type { PermissionResourceOption } from '@/lib/auth/permissionResources';
import { cn } from '@/lib/design';
import type { AdminGameDataActionsResponse } from '@/lib/gameData/adminActionTypes';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { AdminNotice } from '@/lib/notices/types';
import { useUser } from '@/hooks/useUser';
import type { Database } from '@/data/database.types';
import BlockManagement from '@/features/admin/components/BlockManagement';
import CategoryManagement from '@/features/admin/components/CategoryManagement';
import GameDataActionModerationPanel, {
  type GameDataActionStatusFilter,
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

type GameDataActionsKey = readonly [
  'game-data-actions-admin',
  GameDataActionStatusFilter,
  PublishableEntityType | null,
  string | null,
  number,
];

const fetchGameDataActions = async ([
  ,
  status,
  entityType,
  actionId,
  page,
]: GameDataActionsKey): Promise<AdminGameDataActionsResponse> => {
  const searchParams = new URLSearchParams({ status, page: String(page) });
  if (entityType !== null) searchParams.set('entityType', entityType);
  if (actionId !== null) searchParams.set('actionId', actionId);

  const response = await fetch(`/api/game-data-actions/admin?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch game data actions');
  }

  return (await response.json()) as AdminGameDataActionsResponse;
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
  const [activeTab, setActiveTab] = useState<AdminTab>('actions');
  const [actionStatus, setActionStatus] = useState<GameDataActionStatusFilter>('pending');
  const [actionEntityType, setActionEntityType] = useState<PublishableEntityType | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionPage, setActionPage] = useState(1);
  const [loadedPendingCount, setLoadedPendingCount] = useState<number | null>(null);
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
      permissions.has('game_data_action.mark_synced') ||
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
    if (activeTab === 'actions' && !enableActionModeration) {
      if (enableCategoryAccess) setActiveTab('categories');
      else if (enableGroupAccess) setActiveTab('groups');
      else if (enableUserAccess) setActiveTab('users');
      else if (enableNoticeAccess) setActiveTab('notices');
      else if (enableBlockAccess) setActiveTab('blocks');
    }

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

  const {
    data: actionData,
    isLoading: isLoadingActions,
    isValidating: isValidatingActions,
    mutate: mutatePendingActions,
  } = useSWR(
    enableActionModeration && activeTab === 'actions'
      ? (['game-data-actions-admin', actionStatus, actionEntityType, actionId, actionPage] as const)
      : null,
    fetchGameDataActions,
    { revalidateOnFocus: false }
  );
  const { data: blocksData, mutate: mutateBlocks } = useSWR(
    enableBlockAccess ? 'admin-blocks' : null,
    fetchBlocks
  );
  const { data: noticesData, mutate: mutateNotices } = useSWR(
    enableNoticeAccess ? 'admin-notices' : null,
    fetchNotices
  );

  const pendingActions = actionData?.submissions ?? [];

  useEffect(() => {
    if (
      !enableActionModeration ||
      activeTab !== 'actions' ||
      actionStatus !== 'pending' ||
      actionEntityType !== null ||
      actionId !== null ||
      actionPage !== 1 ||
      actionData === undefined
    ) {
      return;
    }
    setLoadedPendingCount(actionData.totalCount);
  }, [
    actionData,
    actionEntityType,
    actionId,
    actionPage,
    actionStatus,
    activeTab,
    enableActionModeration,
  ]);

  useEffect(() => {
    if (actionData === undefined) return;
    const lastAvailablePage = Math.max(actionData.totalPages, 1);
    if (actionPage > lastAvailablePage) setActionPage(lastAvailablePage);
  }, [actionData, actionPage]);

  const resetActionPagination = () => {
    setActionPage(1);
  };

  const handleActionStatusChange = (status: GameDataActionStatusFilter) => {
    setActionStatus(status);
    resetActionPagination();
  };

  const handleActionEntityTypeChange = (entityType: PublishableEntityType | null) => {
    setActionEntityType(entityType);
    resetActionPagination();
  };

  const handleActionIdChange = (nextActionId: string | null) => {
    setActionId(nextActionId);
    resetActionPagination();
  };

  const showNextActionPage = () => {
    if (!actionData || actionPage >= actionData.totalPages) return;
    setActionPage((current) => current + 1);
  };

  const showPreviousActionPage = () => {
    setActionPage((current) => Math.max(1, current - 1));
  };

  const showFirstActionPage = () => setActionPage(1);

  const showLastActionPage = () => {
    if (!actionData || actionData.totalPages === 0) return;
    setActionPage(actionData.totalPages);
  };

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
            {loadedPendingCount !== null && loadedPendingCount > 0 && (
              <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-100 px-1.5 text-xs font-medium text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'>
                {loadedPendingCount}
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
          actionStatus={actionStatus}
          onActionStatusChange={handleActionStatusChange}
          actionEntityType={actionEntityType}
          onActionEntityTypeChange={handleActionEntityTypeChange}
          actionId={actionId}
          onActionIdChange={handleActionIdChange}
          pendingActions={pendingActions}
          currentPage={actionData?.currentPage ?? 0}
          totalPages={actionData?.totalPages ?? 0}
          isPageLoading={isLoadingActions || isValidatingActions}
          onFirstPage={showFirstActionPage}
          onNextPage={showNextActionPage}
          onPreviousPage={showPreviousActionPage}
          onLastPage={showLastActionPage}
          pageKey={`${actionStatus}:${actionEntityType ?? ''}:${actionId ?? ''}:${actionPage}`}
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
