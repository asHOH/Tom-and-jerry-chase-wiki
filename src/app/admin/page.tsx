'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import useSWR from 'swr';

import { useUser } from '@/hooks/useUser';
import { useToast } from '@/context/ToastContext';
import { Database } from '@/data/database.types';
import CategoryManagement from '@/features/admin/components/CategoryManagement';
import UserManagement from '@/features/admin/components/UserManagement';

type Category = Database['public']['Tables']['categories']['Row'];
type PendingGameDataAction =
  Database['public']['Functions']['get_pending_game_data_actions']['Returns'][number];

interface User {
  id: string;
  nickname: string;
  role: string;
}

// Fetcher functions for SWR
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

const fetchPendingGameDataActions = async (): Promise<PendingGameDataAction[]> => {
  const response = await fetch('/api/game-data-actions/pending');
  if (!response.ok) {
    throw new Error('Failed to fetch pending actions');
  }
  const data = (await response.json()) as {
    submissions?: PendingGameDataAction[];
  };
  return data.submissions ?? [];
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'actions'>('categories');
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const { success, error } = useToast();

  // Check user authentication and role
  const user = useUser();

  const enableUserAccess = user.role === 'Coordinator';
  const enableActionModeration = user.role === 'Coordinator' || user.role === 'Reviewer';

  // Fetch data using SWR
  const {
    data: users = [],
    error: usersError,
    mutate: mutateUsers,
  } = useSWR(user ? 'users' : null, fetchUsers);

  const {
    data: categories = [],
    error: categoriesError,
    mutate: mutateCategories,
  } = useSWR(user ? 'categories' : null, fetchCategories);

  const {
    data: pendingActions = [],
    error: pendingActionsError,
    mutate: mutatePendingActions,
  } = useSWR(
    enableActionModeration ? 'pending-game-data-actions' : null,
    fetchPendingGameDataActions
  );

  if (
    user.role === 'Contributor' ||
    !user.role ||
    usersError ||
    categoriesError ||
    pendingActionsError
  ) {
    notFound();
  }

  const moderateAction = async (actionId: string, action: 'approve' | 'reject') => {
    if (moderatingId) return;
    setModeratingId(actionId);
    try {
      let body: unknown = undefined;
      if (action === 'reject') {
        const reason = window.prompt('拒绝原因（可选）') ?? '';
        body = reason.trim() ? { reason: reason.trim() } : {};
      }

      const url = `/api/game-data-actions/moderation/${encodeURIComponent(actionId)}?action=${action}`;
      const init: RequestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) {
        init.body = JSON.stringify(body);
      }

      const res = await fetch(url, init);

      if (!res.ok) {
        const responseBody = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(responseBody?.error || '操作失败');
      }

      success(action === 'approve' ? '已批准，该改动已公开' : '已拒绝');
      await mutatePendingActions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '操作失败';
      error(msg);
    } finally {
      setModeratingId(null);
    }
  };

  return (
    <div className='mx-auto max-w-6xl p-6'>
      <h1 className='mb-6 text-3xl font-bold'>管理面板</h1>

      {/* Tab Navigation */}
      <div className='mb-6 flex border-b border-gray-200'>
        {enableUserAccess && (
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            用户管理
          </button>
        )}
        <button
          onClick={() => setActiveTab('categories')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          分类管理
        </button>
        {enableActionModeration && (
          <button
            onClick={() => setActiveTab('actions')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            改动审核
          </button>
        )}
      </div>

      {/* Tab Content */}
      {enableUserAccess && activeTab === 'users' && (
        <UserManagement users={users} mutateUsers={mutateUsers} />
      )}

      {activeTab === 'categories' && (
        <CategoryManagement categories={categories} mutateCategories={mutateCategories} />
      )}

      {enableActionModeration && activeTab === 'actions' && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>待审核改动</h2>
            <div className='text-sm text-gray-500'>共 {pendingActions.length} 条</div>
          </div>

          {pendingActions.length === 0 ? (
            <div className='rounded-md border border-gray-200 bg-white p-4 text-gray-600'>
              暂无待审核改动
            </div>
          ) : (
            <div className='space-y-3'>
              {pendingActions.map((submission) => (
                <div
                  key={submission.action_id}
                  className='rounded-md border border-gray-200 bg-white p-4'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='text-sm text-gray-700'>
                      <span className='font-medium'>{submission.entity_type}</span>
                      <span className='mx-2 text-gray-300'>·</span>
                      <span>
                        {submission.created_by_nickname
                          ? `由 ${submission.created_by_nickname} 提交`
                          : '匿名提交'}
                      </span>
                      <span className='mx-2 text-gray-300'>·</span>
                      <span>{new Date(submission.created_at).toLocaleString()}</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        disabled={!!moderatingId}
                        onClick={() => {
                          const ok = window.confirm('确认批准并公开该改动？');
                          if (!ok) return;
                          void moderateAction(submission.action_id, 'approve');
                        }}
                        className={`rounded px-3 py-1 text-sm text-white ${
                          moderatingId
                            ? 'bg-green-400 opacity-60'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        批准
                      </button>
                      <button
                        type='button'
                        disabled={!!moderatingId}
                        onClick={() => {
                          const ok = window.confirm('确认拒绝该改动？');
                          if (!ok) return;
                          void moderateAction(submission.action_id, 'reject');
                        }}
                        className={`rounded px-3 py-1 text-sm text-white ${
                          moderatingId ? 'bg-red-400 opacity-60' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        拒绝
                      </button>
                    </div>
                  </div>

                  <pre className='mt-3 max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800'>
                    {JSON.stringify(submission.entry, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
