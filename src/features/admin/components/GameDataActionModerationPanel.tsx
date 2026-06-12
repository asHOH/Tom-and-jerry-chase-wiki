'use client';

import { useEffect, useMemo, useState } from 'react';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import { useToast } from '@/context/ToastContext';
import { Database } from '@/data/database.types';
import Button from '@/components/ui/Button';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import { ChevronRightIcon } from '@/components/icons/CommonIcons';

import GameDataActionPreviewList, { GameDataActionRawPreview } from './GameDataActionPreviewList';

type ActionStatus = Database['public']['Enums']['game_data_action_status'];
type ActionStatusFilter = 'all' | ActionStatus;

export type PendingGameDataAction =
  Database['public']['Functions']['get_pending_game_data_actions']['Returns'][number] & {
    message?: string | null;
  };

type GameDataActionModerationPanelProps = {
  pendingActions: PendingGameDataAction[];
  mutatePendingActions: () => Promise<unknown> | unknown;
};

type ModerationAction = 'approve' | 'reject';

type ModerationFailure = {
  actionId: string;
  message: string;
};

const ACTION_STATUS_META: Record<ActionStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'text-orange-700 dark:text-orange-300' },
  approved: { label: '已批准', className: 'text-green-700 dark:text-green-300' },
  rejected: { label: '已拒绝', className: 'text-red-700 dark:text-red-300' },
  synced: { label: '已同步', className: 'text-purple-700 dark:text-purple-300' },
};

const getModerationFailureMessage = (failure: unknown): string =>
  failure instanceof Error ? failure.message : '操作失败';

const summarizeModerationFailures = (failures: ModerationFailure[]): string => {
  const preview = failures
    .slice(0, 3)
    .map(({ actionId, message }) => `${actionId}: ${message}`)
    .join('；');
  const suffix = failures.length > 3 ? `；另有 ${failures.length - 3} 条失败` : '';
  return `${preview}${suffix}`;
};

const GameDataActionModerationPanel = ({
  pendingActions,
  mutatePendingActions,
}: GameDataActionModerationPanelProps) => {
  const [moderatingActionId, setModeratingActionId] = useState<string | null>(null);
  const isModerating = moderatingActionId !== null;
  const [actionQuery, setActionQuery] = useState('');
  const [actionEntityType, setActionEntityType] = useState<string>('all');
  const [actionStatus, setActionStatus] = useState<ActionStatusFilter>('pending');
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(() => new Set());
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(() => new Set());
  const { success, error } = useToast();

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

  const submitModerationRequest = async (
    actionId: string,
    action: ModerationAction,
    reason?: string | null
  ) => {
    const url = `/api/game-data-actions/moderation/${encodeURIComponent(actionId)}?action=${action}`;
    const init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };

    if (action === 'reject') {
      const body = reason?.trim() ? { reason: reason.trim() } : {};
      init.body = JSON.stringify(body);
    }

    const res = await fetch(url, init);

    if (!res.ok) {
      const responseBody = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(responseBody?.error || '操作失败');
    }
  };

  const moderateAction = async (
    actionId: string,
    action: ModerationAction,
    opts?: { reason?: string | null; skipPrompt?: boolean }
  ) => {
    if (isModerating) return;

    try {
      setModeratingActionId(actionId);
      let reason: string | null = null;

      if (action === 'reject') {
        const provided = typeof opts?.reason === 'string' ? opts.reason : '';
        reason =
          opts?.skipPrompt === true
            ? provided
            : (window.prompt('拒绝原因（可选）', provided) ?? '');
      }

      await submitModerationRequest(actionId, action, reason);
      success(action === 'approve' ? '已批准，该改动已公开' : '已拒绝');
      await mutatePendingActions();
    } catch (failure) {
      error(getModerationFailureMessage(failure));
    } finally {
      setModeratingActionId(null);
    }
  };

  const uniqueEntityTypes = useMemo(() => {
    const set = new Set<string>();
    for (const action of pendingActions) {
      set.add(action.entity_type);
    }
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
    () => filteredActions.filter((action) => action.status === 'pending'),
    [filteredActions]
  );

  const selectedPendingActions = useMemo(
    () => actionableActions.filter((action) => selectedActionIds.has(action.action_id)),
    [actionableActions, selectedActionIds]
  );

  const allVisiblePendingSelected =
    actionableActions.length > 0 &&
    actionableActions.every((action) => selectedActionIds.has(action.action_id));

  useEffect(() => {
    const pendingActionIds = new Set(
      pendingActions
        .filter((action) => action.status === 'pending')
        .map((action) => action.action_id)
    );

    setSelectedActionIds((prev) => {
      const next = new Set<string>();

      for (const actionId of prev) {
        if (pendingActionIds.has(actionId)) {
          next.add(actionId);
        }
      }

      return next.size === prev.size ? prev : next;
    });
  }, [pendingActions]);

  const moderateMany = async (action: ModerationAction) => {
    if (isModerating || selectedPendingActions.length === 0) return;

    const confirmed = window.confirm(
      action === 'approve'
        ? `确认批准并公开 ${selectedPendingActions.length} 条待审核改动？`
        : `确认拒绝 ${selectedPendingActions.length} 条待审核改动？`
    );
    if (!confirmed) return;

    let reason: string | null = null;
    if (action === 'reject') {
      reason = window.prompt('批量拒绝原因（可选，将应用于全部）') ?? '';
    }

    setModeratingActionId('batch');

    const failures: ModerationFailure[] = [];
    let successCount = 0;

    try {
      for (const submission of selectedPendingActions) {
        try {
          await submitModerationRequest(submission.action_id, action, reason);
          successCount += 1;
        } catch (failure) {
          failures.push({
            actionId: submission.action_id,
            message: getModerationFailureMessage(failure),
          });
        }
      }

      await mutatePendingActions();

      const actionLabel = action === 'approve' ? '批准' : '拒绝';
      if (failures.length === 0) {
        success(`已批量${actionLabel} ${successCount} 条`);
      } else if (successCount > 0) {
        error(
          `已${actionLabel} ${successCount} 条，失败 ${failures.length} 条：${summarizeModerationFailures(failures)}`
        );
      } else {
        error(`批量${actionLabel}失败：${summarizeModerationFailures(failures)}`);
      }
    } catch (failure) {
      error(getModerationFailureMessage(failure));
    } finally {
      setModeratingActionId(null);
    }
  };

  const toggleExpanded = (actionId: string) => {
    setExpandedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const toggleSelectedAction = (actionId: string) => {
    setSelectedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const toggleSelectAllVisiblePending = () => {
    setSelectedActionIds((prev) => {
      const next = new Set(prev);

      if (allVisiblePendingSelected) {
        for (const action of actionableActions) {
          next.delete(action.action_id);
        }
      } else {
        for (const action of actionableActions) {
          next.add(action.action_id);
        }
      }

      return next;
    });
  };

  const clearSelectedActions = () => {
    setSelectedActionIds(new Set());
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 rounded-md bg-white p-4 md:flex-row md:items-center md:justify-between dark:bg-slate-800'>
        <div className='flex flex-wrap items-center gap-2'>
          <label className='text-sm text-gray-600 dark:text-slate-300'>状态</label>
          <FormSelect
            title='过滤状态'
            value={actionStatus}
            onChange={(e) => setActionStatus(e.target.value as ActionStatusFilter)}
            fullWidth={false}
            size='sm'
          >
            <option value='pending'>待审核</option>
            <option value='approved'>已批准</option>
            <option value='rejected'>已拒绝</option>
            <option value='synced'>已同步</option>
            <option value='all'>全部</option>
          </FormSelect>

          <label className='text-sm text-gray-600 dark:text-slate-300'>实体类型</label>
          <FormSelect
            title='过滤实体类型'
            value={actionEntityType}
            onChange={(e) => setActionEntityType(e.target.value)}
            fullWidth={false}
            size='sm'
          >
            <option value='all'>全部</option>
            {uniqueEntityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </FormSelect>

          <label className='ml-2 text-sm text-gray-600 dark:text-slate-300'>搜索</label>
          <FormInput
            value={actionQuery}
            onChange={(e) => setActionQuery(e.target.value)}
            placeholder='action_id / 类型 / 提交者'
            className='md:w-64'
            size='sm'
          />

          <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
            <span>
              显示 {filteredActions.length} / {pendingActions.length}
            </span>
            <span>(已选 {selectedPendingActions.length} 条)</span>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            type='button'
            disabled={isModerating || actionableActions.length === 0}
            onClick={toggleSelectAllVisiblePending}
            variant='secondary'
            size='sm'
          >
            {allVisiblePendingSelected ? '取消全选待审核' : '全选待审核'}
          </Button>
          <Button
            type='button'
            disabled={isModerating || selectedActionIds.size === 0}
            onClick={clearSelectedActions}
            variant='secondary'
            size='sm'
          >
            清空勾选
          </Button>
          <Button
            type='button'
            disabled={isModerating}
            onClick={() => void mutatePendingActions()}
            variant='secondary'
            size='sm'
          >
            刷新
          </Button>
          <Button
            type='button'
            disabled={isModerating || selectedPendingActions.length === 0}
            onClick={() => void moderateMany('approve')}
            variant='success'
            size='sm'
          >
            批量批准
          </Button>
          <Button
            type='button'
            disabled={isModerating || selectedPendingActions.length === 0}
            onClick={() => void moderateMany('reject')}
            variant='danger'
            size='sm'
          >
            批量拒绝
          </Button>
        </div>
      </div>

      {pendingActions.length === 0 ? (
        <div className='rounded-md bg-white p-4 text-gray-600 dark:bg-slate-800 dark:text-slate-300'>
          暂无待审核改动
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredActions.map((submission) => {
            const statusMeta =
              ACTION_STATUS_META[submission.status as ActionStatus] ?? ACTION_STATUS_META.pending;
            const isExpanded = expandedActionIds.has(submission.action_id);

            return (
              <div key={submission.action_id} className='rounded-md bg-white p-4 dark:bg-slate-800'>
                <div className='flex items-start gap-3'>
                  <div className='pt-1'>
                    {submission.status === 'pending' ? (
                      <input
                        type='checkbox'
                        checked={selectedActionIds.has(submission.action_id)}
                        disabled={isModerating}
                        onChange={() => toggleSelectedAction(submission.action_id)}
                        aria-label={`选择改动 ${submission.action_id}`}
                        className='h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-green-400'
                      />
                    ) : (
                      <span aria-hidden='true' className='block h-4 w-4' />
                    )}
                  </div>

                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200'>
                        <span className='font-medium'>{submission.entity_type}</span>
                        <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                        <span className={statusMeta.className}>{statusMeta.label}</span>
                        <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                        <span>
                          {submission.created_by_nickname
                            ? `由 ${submission.created_by_nickname} 提交`
                            : '匿名提交'}
                        </span>
                        <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                        <span>
                          {formatCompactDateTime(submission.created_at, {
                            invalidFallback: submission.created_at,
                          })}
                        </span>
                        {submission.status !== 'pending' && submission.reviewed_at && (
                          <>
                            <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                            <span>
                              {submission.reviewed_by_nickname
                                ? `审核：${submission.reviewed_by_nickname}`
                                : '已审核'}
                            </span>
                            <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                            <span>
                              {formatCompactDateTime(submission.reviewed_at, {
                                invalidFallback: submission.reviewed_at,
                              })}
                            </span>
                          </>
                        )}
                      </div>

                      <div className='flex items-center gap-2'>
                        {submission.status === 'pending' && (
                          <>
                            <Button
                              type='button'
                              disabled={isModerating}
                              onClick={() => {
                                const confirmed = window.confirm('确认批准并公开该改动？');
                                if (!confirmed) return;
                                void moderateAction(submission.action_id, 'approve');
                              }}
                              variant='success'
                              size='sm'
                            >
                              批准
                            </Button>
                            <Button
                              type='button'
                              disabled={isModerating}
                              onClick={() => {
                                const confirmed = window.confirm('确认拒绝该改动？');
                                if (!confirmed) return;
                                void moderateAction(submission.action_id, 'reject');
                              }}
                              variant='danger'
                              size='sm'
                            >
                              拒绝
                            </Button>
                          </>
                        )}
                        <Button
                          type='button'
                          onClick={() => toggleExpanded(submission.action_id)}
                          aria-label={isExpanded ? '收起详情' : '展开详情'}
                          aria-expanded={isExpanded}
                          title={isExpanded ? '收起详情' : '展开详情'}
                          variant='secondary'
                          size='sm'
                          className='h-8 w-8 p-0'
                        >
                          <ChevronRightIcon
                            className={cn(
                              'h-4 w-4 transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                            aria-hidden='true'
                          />
                        </Button>
                      </div>
                    </div>

                    {submission.message && (
                      <div className='mt-3 rounded bg-blue-50 p-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'>
                        <span className='font-semibold'>留言：</span>
                        {submission.message}
                      </div>
                    )}

                    {isExpanded && (
                      <div className='mt-3 space-y-2'>
                        <div className='flex flex-wrap items-center justify-between gap-2'>
                          <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400'>
                            <span className='truncate'>action_id: {submission.action_id}</span>
                            {(submission.status === 'approved' ||
                              submission.status === 'synced') && (
                              <span className='rounded bg-gray-100 px-2 py-0.5 whitespace-nowrap text-gray-700 dark:bg-slate-900/60 dark:text-slate-200'>
                                {submission.is_public ? '已' : '未'}公开
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button
                              type='button'
                              onClick={() => void copyText(submission.action_id)}
                              variant='secondary'
                              size='sm'
                            >
                              复制ID
                            </Button>
                            <Button
                              type='button'
                              onClick={() => void copyText(JSON.stringify(submission, null, 2))}
                              variant='secondary'
                              size='sm'
                            >
                              复制JSON
                            </Button>
                          </div>
                        </div>

                        {submission.status === 'rejected' && submission.rejection_reason && (
                          <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200'>
                            拒绝原因：{submission.rejection_reason}
                          </div>
                        )}

                        <GameDataActionPreviewList
                          entry={submission.entry}
                          entityType={submission.entity_type}
                        />

                        <GameDataActionRawPreview
                          entry={submission.entry}
                          entityType={submission.entity_type}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GameDataActionModerationPanel;
