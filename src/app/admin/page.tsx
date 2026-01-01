'use client';

import { useMemo, useState } from 'react';
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
  const response = await fetch('/api/game-data-actions/admin?status=all');
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
  const [actionQuery, setActionQuery] = useState('');
  const [actionEntityType, setActionEntityType] = useState<string>('all');
  const [actionStatus, setActionStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(() => new Set());
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
    enableActionModeration ? 'game-data-actions-admin' : null,
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

  const copyText = async (text: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        success('已复制');
        return;
      }
    } catch {
      // ignore and fallback
    }
    window.prompt('复制以下内容：', text);
  };

  const moderateAction = async (
    actionId: string,
    action: 'approve' | 'reject',
    opts?: { reason?: string | null; skipPrompt?: boolean }
  ) => {
    if (moderatingId) return;
    setModeratingId(actionId);
    try {
      let body: unknown = undefined;
      if (action === 'reject') {
        const provided = typeof opts?.reason === 'string' ? opts.reason : '';
        const reason =
          opts?.skipPrompt === true
            ? provided
            : (window.prompt('拒绝原因（可选）', provided) ?? '');
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

  const uniqueEntityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const action of pendingActions) set.add(action.entity_type);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pendingActions]);

  const filteredActions = useMemo(() => {
    const q = actionQuery.trim().toLowerCase();
    return pendingActions.filter((submission) => {
      if (actionStatus !== 'all' && submission.status !== actionStatus) return false;
      if (actionEntityType !== 'all' && submission.entity_type !== actionEntityType) return false;
      if (!q) return true;
      const createdBy = (submission.created_by_nickname ?? '').toLowerCase();
      return (
        submission.action_id.toLowerCase().includes(q) ||
        submission.entity_type.toLowerCase().includes(q) ||
        createdBy.includes(q)
      );
    });
  }, [pendingActions, actionEntityType, actionQuery, actionStatus]);

  const actionableActions = useMemo(
    () => filteredActions.filter((a) => a.status === 'pending'),
    [filteredActions]
  );

  const moderateMany = async (action: 'approve' | 'reject') => {
    if (moderatingId) return;
    if (actionableActions.length === 0) return;

    const confirmed = window.confirm(
      action === 'approve'
        ? `确认批准并公开筛选出的 ${actionableActions.length} 条待审核改动？`
        : `确认拒绝筛选出的 ${actionableActions.length} 条待审核改动？`
    );
    if (!confirmed) return;

    let reason: string | null = null;
    if (action === 'reject') {
      reason = window.prompt('批量拒绝原因（可选，将应用于全部）') ?? '';
    }

    for (const submission of actionableActions) {
      if (action === 'reject') {
        await moderateAction(submission.action_id, action, {
          reason,
          skipPrompt: true,
        });
      } else {
        await moderateAction(submission.action_id, action, { skipPrompt: true });
      }
    }
  };

  const toggleExpanded = (actionId: string) => {
    setExpandedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) next.delete(actionId);
      else next.add(actionId);
      return next;
    });
  };

  return (
    <div className='mx-auto max-w-6xl p-6 dark:text-slate-200'>
      <h1 className='mb-6 text-3xl font-bold text-gray-900 dark:text-gray-100'>管理面板</h1>

      {/* Tab Navigation */}
      <div className='mb-6 flex border-b border-gray-200 dark:border-slate-700'>
        {enableUserAccess && (
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            用户管理
          </button>
        )}
        <button
          onClick={() => setActiveTab('categories')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          分类管理
        </button>
        {enableActionModeration && (
          <button
            onClick={() => setActiveTab('actions')}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
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
            <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>待审核改动</h2>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              共 {pendingActions.length} 条
            </div>
          </div>

          <div className='flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-800'>
            <div className='flex flex-wrap items-center gap-2'>
              <label className='text-sm text-gray-600 dark:text-slate-300'>状态</label>
              <select
                value={actionStatus}
                onChange={(e) =>
                  setActionStatus(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')
                }
                className='rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
              >
                <option value='pending'>待审核</option>
                <option value='approved'>已批准</option>
                <option value='rejected'>已拒绝</option>
                <option value='all'>全部</option>
              </select>

              <label className='text-sm text-gray-600 dark:text-slate-300'>实体类型</label>
              <select
                value={actionEntityType}
                onChange={(e) => setActionEntityType(e.target.value)}
                className='rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
              >
                <option value='all'>全部</option>
                {uniqueEntityTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <label className='ml-2 text-sm text-gray-600 dark:text-slate-300'>搜索</label>
              <input
                value={actionQuery}
                onChange={(e) => setActionQuery(e.target.value)}
                placeholder='action_id / 类型 / 提交者'
                className='w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 md:w-64 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
              />

              <div className='text-sm text-gray-500 dark:text-gray-400'>
                显示 {filteredActions.length} / {pendingActions.length}
              </div>
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              <button
                type='button'
                disabled={!!moderatingId}
                onClick={() => void mutatePendingActions()}
                className={`rounded px-3 py-1 text-sm text-white ${
                  moderatingId ? 'bg-gray-400 opacity-60' : 'bg-gray-700 hover:bg-gray-800'
                }`}
              >
                刷新
              </button>
              <button
                type='button'
                disabled={!!moderatingId || filteredActions.length === 0}
                onClick={() => void moderateMany('approve')}
                className={`rounded px-3 py-1 text-sm text-white ${
                  moderatingId || actionableActions.length === 0
                    ? 'bg-green-400 opacity-60'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                批量批准
              </button>
              <button
                type='button'
                disabled={!!moderatingId || filteredActions.length === 0}
                onClick={() => void moderateMany('reject')}
                className={`rounded px-3 py-1 text-sm text-white ${
                  moderatingId || actionableActions.length === 0
                    ? 'bg-red-400 opacity-60'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                批量拒绝
              </button>
            </div>
          </div>

          {pendingActions.length === 0 ? (
            <div className='rounded-md border border-gray-200 bg-white p-4 text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'>
              暂无待审核改动
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredActions.map((submission) => (
                <div
                  key={submission.action_id}
                  className='rounded-md border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div className='text-sm text-gray-700 dark:text-slate-200'>
                      <span className='font-medium'>{submission.entity_type}</span>
                      <span className='mx-2 text-gray-300 dark:text-slate-600'>·</span>
                      <span
                        className={
                          submission.status === 'pending'
                            ? 'text-orange-700 dark:text-orange-300'
                            : submission.status === 'approved'
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                        }
                      >
                        {submission.status === 'pending'
                          ? '待审核'
                          : submission.status === 'approved'
                            ? '已批准'
                            : '已拒绝'}
                      </span>
                      <span className='mx-2 text-gray-300 dark:text-slate-600'>·</span>
                      <span>
                        {submission.created_by_nickname
                          ? `由 ${submission.created_by_nickname} 提交`
                          : '匿名提交'}
                      </span>
                      <span className='mx-2 text-gray-300 dark:text-slate-600'>·</span>
                      <span>{new Date(submission.created_at).toLocaleString()}</span>
                      {submission.status !== 'pending' && submission.reviewed_at && (
                        <>
                          <span className='mx-2 text-gray-300 dark:text-slate-600'>·</span>
                          <span>
                            {submission.reviewed_by_nickname
                              ? `审核：${submission.reviewed_by_nickname}`
                              : '已审核'}
                          </span>
                          <span className='mx-2 text-gray-300 dark:text-slate-600'>·</span>
                          <span>{new Date(submission.reviewed_at).toLocaleString()}</span>
                        </>
                      )}
                    </div>

                    <div className='flex items-center gap-2'>
                      <button
                        type='button'
                        disabled={!!moderatingId}
                        onClick={() => void copyText(submission.action_id)}
                        className={`rounded px-3 py-1 text-sm text-white ${
                          moderatingId ? 'bg-gray-400 opacity-60' : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        复制ID
                      </button>
                      <button
                        type='button'
                        disabled={!!moderatingId}
                        onClick={() => toggleExpanded(submission.action_id)}
                        className={`rounded px-3 py-1 text-sm text-white ${
                          moderatingId ? 'bg-gray-400 opacity-60' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {expandedActionIds.has(submission.action_id) ? '收起详情' : '展开详情'}
                      </button>
                      {submission.status === 'pending' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>

                  {expandedActionIds.has(submission.action_id) && (
                    <div className='mt-3 space-y-2'>
                      <div className='flex flex-wrap items-center justify-between gap-2'>
                        <div className='text-xs text-gray-500 dark:text-slate-400'>
                          action_id: {submission.action_id}
                        </div>
                        <button
                          type='button'
                          disabled={!!moderatingId}
                          onClick={() =>
                            void copyText(
                              JSON.stringify({ ...submission, entry: submission.entry }, null, 2)
                            )
                          }
                          className={`rounded px-3 py-1 text-sm text-white ${
                            moderatingId
                              ? 'bg-gray-400 opacity-60'
                              : 'bg-gray-600 hover:bg-gray-700'
                          }`}
                        >
                          复制JSON
                        </button>
                      </div>

                      {submission.status === 'rejected' && submission.rejection_reason && (
                        <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200'>
                          拒绝原因：{submission.rejection_reason}
                        </div>
                      )}

                      {submission.status === 'approved' && (
                        <div className='rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200'>
                          是否已公开：{submission.is_public ? '是' : '否'}
                        </div>
                      )}

                      <pre className='max-h-64 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800 dark:bg-slate-900/40 dark:text-slate-100'>
                        {JSON.stringify(submission.entry, null, 2)}
                      </pre>
                    </div>
                  )}
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
