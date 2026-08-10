'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import type {
  GameDataActionDetail,
  GameDataActionStatusFilter,
  GameDataActionSummary,
} from '@/lib/gameData/adminActionTypes';
import { GAME_DATA_ENTITY_LABELS } from '@/lib/gameData/contributionDisplay';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { useToast } from '@/context/ToastContext';
import { Database } from '@/data/database.types';
import type { GameActionDiffView } from '@/features/admin/utils/gameActionDiff';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormSelect } from '@/components/ui/FormControls';
import ThankContributionDialog from '@/components/contributions/ThankContributionDialog';
import { ChevronRightIcon } from '@/components/icons/CommonIcons';

import GameDataActionPreviewList, { GameDataActionChangeViewer } from './GameDataActionPreviewList';

type ActionStatus = Database['public']['Enums']['game_data_action_status'];
export type { GameDataActionStatusFilter } from '@/lib/gameData/adminActionTypes';
export type PendingGameDataAction = GameDataActionSummary;

type GameDataActionModerationPanelProps = {
  canApproveActions?: boolean;
  canRejectActions?: boolean;
  canMarkActionsSynced?: boolean;
  canRevokeActions?: boolean;
  actionStatus?: GameDataActionStatusFilter;
  onActionStatusChange?: (status: GameDataActionStatusFilter) => void;
  actionEntityType?: PublishableEntityType | null;
  onActionEntityTypeChange?: (entityType: PublishableEntityType | null) => void;
  actionId?: string | null;
  onActionIdChange?: (actionId: string | null) => void;
  pendingActions: PendingGameDataAction[];
  currentPage?: number;
  totalPages?: number;
  isPageLoading?: boolean;
  onFirstPage?: () => void;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onLastPage?: () => void;
  pageKey?: string;
  mutatePendingActions: () => Promise<unknown> | unknown;
};

type PendingModerationAction = 'approve' | 'reject';
type ModerationAction = PendingModerationAction | 'mark-synced' | 'revoke';

type ModerationFailure = {
  actionId: string;
  message: string;
};

type ThankTarget = {
  actionId: string;
  contributionTitle: string;
  approveFirst: boolean;
};

const ACTION_STATUS_META: Record<ActionStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'text-orange-700 dark:text-orange-300' },
  approved: { label: '已批准', className: 'text-green-700 dark:text-green-300' },
  rejected: { label: '已拒绝', className: 'text-red-700 dark:text-red-300' },
  synced: { label: '已同步', className: 'text-purple-700 dark:text-purple-300' },
  revoked: { label: '已撤销', className: 'text-gray-700 dark:text-gray-300' },
};

const MODERATION_ACTION_SUCCESS_MESSAGE: Record<ModerationAction, string> = {
  approve: '已批准，该改动已公开',
  reject: '已拒绝',
  'mark-synced': '已标记为已同步',
  revoke: '已撤销，该改动已从公开 replay 移除',
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  canApproveActions: canApproveActions = true,
  canRejectActions: canRejectActions = true,
  canMarkActionsSynced: canMarkActionsSynced = false,
  canRevokeActions: canRevokeActions = false,
  actionStatus: controlledActionStatus,
  onActionStatusChange,
  actionEntityType: controlledActionEntityType,
  onActionEntityTypeChange,
  actionId: controlledActionId,
  onActionIdChange,
  pendingActions,
  currentPage = 0,
  totalPages = 0,
  isPageLoading = false,
  onFirstPage,
  onNextPage,
  onPreviousPage,
  onLastPage,
  pageKey = '',
  mutatePendingActions,
}: GameDataActionModerationPanelProps) => {
  const [moderatingActionId, setModeratingActionId] = useState<string | null>(null);
  const isModerating = moderatingActionId !== null;
  const [actionIdDraft, setActionIdDraft] = useState('');
  const [uncontrolledActionEntityType, setUncontrolledActionEntityType] =
    useState<PublishableEntityType | null>(null);
  const actionEntityType =
    controlledActionEntityType === undefined
      ? uncontrolledActionEntityType
      : controlledActionEntityType;
  const [uncontrolledActionId, setUncontrolledActionId] = useState<string | null>(null);
  const actionId = controlledActionId === undefined ? uncontrolledActionId : controlledActionId;
  const [uncontrolledActionStatus, setUncontrolledActionStatus] =
    useState<GameDataActionStatusFilter>('pending');
  const actionStatus = controlledActionStatus ?? uncontrolledActionStatus;
  const [expandedActionIds, setExpandedActionIds] = useState<Set<string>>(() => new Set());
  const [actionDetails, setActionDetails] = useState<Record<string, GameDataActionDetail>>({});
  const [loadingDetailActionIds, setLoadingDetailActionIds] = useState<Set<string>>(
    () => new Set()
  );
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(() => new Set());
  const [diffView, setDiffView] = useState<GameActionDiffView>('unified');
  const [showAllDiffContext, setShowAllDiffContext] = useState(false);
  const [thankTarget, setThankTarget] = useState<ThankTarget | null>(null);
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

  const submitThanksRequest = async (actionId: string, message: string) => {
    const response = await fetch(
      `/api/contributions/game-data/${encodeURIComponent(actionId)}/thank`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }
    );
    const payload = (await response.json().catch(() => null)) as {
      created?: boolean;
      error?: string;
    } | null;
    if (!response.ok) {
      throw new Error(payload?.error ?? '感谢发送失败');
    }
    return payload?.created !== false;
  };

  const moderateAction = async (
    actionId: string,
    action: ModerationAction,
    opts?: { reason?: string | null; skipPrompt?: boolean; thankMessage?: string }
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
      let thanksFailed = false;
      if (action === 'approve' && opts?.thankMessage) {
        try {
          await submitThanksRequest(actionId, opts.thankMessage);
        } catch (thankError) {
          error(
            `改动已批准，但感谢发送失败：${
              thankError instanceof Error ? thankError.message : '未知错误'
            }`
          );
          thanksFailed = true;
        }
      }
      if (!thanksFailed) {
        success(
          action === 'approve' && opts?.thankMessage
            ? '已批准并向编辑者发送感谢'
            : MODERATION_ACTION_SUCCESS_MESSAGE[action]
        );
      }
      await mutatePendingActions();
    } catch (failure) {
      error(getModerationFailureMessage(failure));
    } finally {
      setModeratingActionId(null);
    }
  };

  const thankApprovedAction = async (actionId: string, message: string) => {
    if (isModerating) return;
    setModeratingActionId(actionId);
    try {
      const created = await submitThanksRequest(actionId, message);
      success(created ? '已向编辑者发送感谢' : '这次贡献已经感谢过了');
    } catch (failure) {
      error(getModerationFailureMessage(failure));
    } finally {
      setModeratingActionId(null);
    }
  };

  const filteredActions = pendingActions;

  const actionableActions = useMemo(
    () =>
      filteredActions.filter(
        (action) =>
          action.status === 'pending' &&
          (canApproveActions || (!action.is_public && canRejectActions))
      ),
    [canApproveActions, canRejectActions, filteredActions]
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
        .filter(
          (action) =>
            action.status === 'pending' &&
            (canApproveActions || (!action.is_public && canRejectActions))
        )
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
  }, [canApproveActions, canRejectActions, pendingActions]);

  useEffect(() => {
    setSelectedActionIds(new Set());
    setExpandedActionIds(new Set());
  }, [pageKey]);

  const moderateMany = async (action: PendingModerationAction) => {
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

    try {
      const response = await fetch('/api/game-data-actions/moderation/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionIds: selectedPendingActions.map((submission) => submission.action_id),
          action,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        failures?: ModerationFailure[];
        succeeded?: string[];
      } | null;
      if (!response.ok) {
        throw new Error(result?.error || '批量操作失败');
      }

      const failures = result?.failures ?? [];
      const successCount = result?.succeeded?.length ?? 0;

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

  const toggleExpanded = (selectedActionId: string) => {
    const shouldLoad =
      !expandedActionIds.has(selectedActionId) &&
      actionDetails[selectedActionId] === undefined &&
      !loadingDetailActionIds.has(selectedActionId);

    setExpandedActionIds((prev) => {
      const next = new Set(prev);
      if (next.has(selectedActionId)) {
        next.delete(selectedActionId);
      } else {
        next.add(selectedActionId);
      }
      return next;
    });

    if (!shouldLoad) return;
    setLoadingDetailActionIds((current) => new Set(current).add(selectedActionId));
    setDetailErrors((current) => {
      const next = { ...current };
      delete next[selectedActionId];
      return next;
    });

    void fetch(`/api/game-data-actions/admin/${encodeURIComponent(selectedActionId)}`)
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          (Partial<GameDataActionDetail> & { error?: string }) | null;
        if (
          !response.ok ||
          payload?.action_id !== selectedActionId ||
          payload.entry === undefined
        ) {
          throw new Error(payload?.error ?? '详情加载失败');
        }
        setActionDetails((current) => ({
          ...current,
          [selectedActionId]: payload as GameDataActionDetail,
        }));
      })
      .catch((failure: unknown) => {
        setDetailErrors((current) => ({
          ...current,
          [selectedActionId]: getModerationFailureMessage(failure),
        }));
      })
      .finally(() => {
        setLoadingDetailActionIds((current) => {
          const next = new Set(current);
          next.delete(selectedActionId);
          return next;
        });
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

  const paginationDisabled = isModerating || isPageLoading;
  const canGoBackward = currentPage > 1;
  const canGoForward = totalPages > 0 && currentPage < totalPages;

  return (
    <div className='space-y-4'>
      <Card className='flex flex-col gap-3 rounded-md md:flex-row md:items-center md:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          <label className='text-sm text-gray-600 dark:text-slate-300'>状态</label>
          <FormSelect
            title='过滤状态'
            value={actionStatus}
            disabled={isModerating}
            onChange={(e) => {
              const nextStatus = e.target.value as GameDataActionStatusFilter;
              setUncontrolledActionStatus(nextStatus);
              setUncontrolledActionId(null);
              setActionIdDraft('');
              onActionIdChange?.(null);
              onActionStatusChange?.(nextStatus);
            }}
            fullWidth={false}
            size='sm'
          >
            <option value='pending'>待审核</option>
            <option value='approved'>已批准</option>
            <option value='rejected'>已拒绝</option>
            <option value='synced'>已同步</option>
            <option value='revoked'>已撤销</option>
            <option value='all'>全部</option>
          </FormSelect>

          <label className='text-sm text-gray-600 dark:text-slate-300'>实体类型</label>
          <FormSelect
            title='过滤实体类型'
            value={actionEntityType ?? 'all'}
            onChange={(e) => {
              const value = e.target.value;
              const nextEntityType = value === 'all' ? null : (value as PublishableEntityType);
              setUncontrolledActionEntityType(nextEntityType);
              setUncontrolledActionId(null);
              setActionIdDraft('');
              onActionIdChange?.(null);
              onActionEntityTypeChange?.(nextEntityType);
            }}
            fullWidth={false}
            size='sm'
          >
            <option value='all'>全部</option>
            {PUBLISHABLE_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {GAME_DATA_ENTITY_LABELS[type] ?? type}（{type}）
              </option>
            ))}
          </FormSelect>

          <label className='ml-2 text-sm text-gray-600 dark:text-slate-300'>精确ID</label>
          <FormInput
            value={actionIdDraft}
            onChange={(e) => setActionIdDraft(e.target.value)}
            placeholder='完整 action UUID'
            className='md:w-64'
            size='sm'
          />
          <Button
            disabled={
              isModerating ||
              (actionIdDraft.trim() !== '' && !UUID_PATTERN.test(actionIdDraft.trim()))
            }
            onClick={() => {
              const nextActionId = actionIdDraft.trim() || null;
              setUncontrolledActionId(nextActionId);
              onActionIdChange?.(nextActionId);
            }}
            variant='secondary'
            size='sm'
          >
            {actionId === null ? '查找ID' : '更新ID'}
          </Button>
          {actionId !== null && (
            <Button
              disabled={isModerating}
              onClick={() => {
                setActionIdDraft('');
                setUncontrolledActionId(null);
                onActionIdChange?.(null);
              }}
              variant='secondary'
              size='sm'
            >
              清除ID
            </Button>
          )}

          <label className='ml-2 text-sm text-gray-600 dark:text-slate-300'>对比方式</label>
          <FormSelect
            title='选择改动对比方式'
            value={diffView}
            onChange={(e) => setDiffView(e.target.value as GameActionDiffView)}
            fullWidth={false}
            size='sm'
          >
            <option value='unified'>统一差异</option>
            <option value='normal'>传统 diff</option>
            <option value='split'>并排对比</option>
          </FormSelect>

          <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
            <span>本页已加载 {pendingActions.length} 条</span>
            <span>(已选 {selectedPendingActions.length} 条)</span>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Button
            disabled={isModerating || actionableActions.length === 0}
            onClick={toggleSelectAllVisiblePending}
            variant='secondary'
            size='sm'
          >
            {allVisiblePendingSelected ? '取消全选待审核' : '全选待审核'}
          </Button>
          <Button
            disabled={diffView === 'normal'}
            onClick={() => setShowAllDiffContext((current) => !current)}
            variant='secondary'
            size='sm'
            title={diffView === 'normal' ? '传统 diff 不显示上下文行' : undefined}
          >
            {showAllDiffContext ? '仅显示3行上下文' : '显示全部上下文'}
          </Button>
          <Button
            disabled={isModerating || selectedActionIds.size === 0}
            onClick={clearSelectedActions}
            variant='secondary'
            size='sm'
          >
            清空勾选
          </Button>
          <Button
            disabled={isModerating}
            onClick={() => void mutatePendingActions()}
            variant='secondary'
            size='sm'
          >
            刷新
          </Button>
          {canApproveActions && (
            <Button
              disabled={isModerating || selectedPendingActions.length === 0}
              onClick={() => void moderateMany('approve')}
              variant='success'
              size='sm'
            >
              批量批准
            </Button>
          )}
          {canRejectActions && (
            <Button
              disabled={isModerating || selectedPendingActions.length === 0}
              onClick={() => void moderateMany('reject')}
              variant='danger'
              size='sm'
            >
              批量拒绝
            </Button>
          )}
        </div>
      </Card>

      {isPageLoading && pendingActions.length === 0 ? (
        <Card className='rounded-md text-gray-600 dark:text-slate-300'>改动列表加载中…</Card>
      ) : pendingActions.length === 0 ? (
        <Card className='rounded-md text-gray-600 dark:text-slate-300'>本页没有符合条件的改动</Card>
      ) : (
        <div className='space-y-3'>
          {filteredActions.map((submission) => {
            const statusMeta =
              ACTION_STATUS_META[submission.status as ActionStatus] ?? ACTION_STATUS_META.pending;
            const isExpanded = expandedActionIds.has(submission.action_id);
            const detail = actionDetails[submission.action_id];
            const isLoadingDetail = loadingDetailActionIds.has(submission.action_id);
            const detailError = detailErrors[submission.action_id];

            return (
              <Card key={submission.action_id} className='rounded-md'>
                <div className='flex items-start gap-3'>
                  <div className='pt-1'>
                    {submission.status === 'pending' &&
                    (canApproveActions || (!submission.is_public && canRejectActions)) ? (
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
                        {submission.is_public && submission.status === 'pending' && (
                          <>
                            <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                            <span className='rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
                              已公开
                            </span>
                          </>
                        )}
                        <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                        <span>
                          {submission.created_by_nickname && submission.created_by ? (
                            <>
                              由{' '}
                              <Link
                                href={`/users/${encodeURIComponent(submission.created_by_nickname)}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='font-medium text-blue-600 hover:underline dark:text-blue-400'
                              >
                                {submission.created_by_nickname}
                              </Link>{' '}
                              提交
                            </>
                          ) : (
                            '匿名提交'
                          )}
                        </span>
                        <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                        <span>
                          {formatCompactDateTime(submission.created_at, {
                            invalidFallback: submission.created_at,
                          })}
                        </span>
                        {submission.status !== 'pending' &&
                          submission.reviewed_at &&
                          submission.created_by !== submission.reviewed_by && (
                            <>
                              <span className='mx-1 text-gray-300 dark:text-slate-600'>·</span>
                              <span>
                                {submission.reviewed_by_nickname && submission.reviewed_by ? (
                                  <>
                                    审核：
                                    <Link
                                      href={`/users/${encodeURIComponent(submission.reviewed_by_nickname)}`}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='font-medium text-blue-600 hover:underline dark:text-blue-400'
                                    >
                                      {submission.reviewed_by_nickname}
                                    </Link>
                                  </>
                                ) : (
                                  '已审核'
                                )}
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
                            {canApproveActions && (
                              <Button
                                disabled={isModerating}
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    submission.is_public
                                      ? '确认审核通过该已公开改动？'
                                      : '确认批准并公开该改动？'
                                  );
                                  if (!confirmed) return;
                                  void moderateAction(submission.action_id, 'approve');
                                }}
                                variant='success'
                                size='sm'
                              >
                                批准
                              </Button>
                            )}
                            {canApproveActions && submission.created_by && (
                              <Button
                                disabled={isModerating}
                                onClick={() =>
                                  setThankTarget({
                                    actionId: submission.action_id,
                                    contributionTitle: `${
                                      GAME_DATA_ENTITY_LABELS[submission.entity_type] ??
                                      submission.entity_type
                                    }改动`,
                                    approveFirst: true,
                                  })
                                }
                                variant='secondary'
                                size='sm'
                              >
                                批准并感谢
                              </Button>
                            )}
                            {!submission.is_public && canRejectActions && (
                              <Button
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
                            )}
                            {submission.is_public && canRevokeActions && (
                              <Button
                                disabled={isModerating}
                                onClick={() => {
                                  const confirmed = window.confirm(
                                    '确认撤销该已公开改动？撤销后将从公开数据中移除。'
                                  );
                                  if (!confirmed) return;
                                  void moderateAction(submission.action_id, 'revoke');
                                }}
                                variant='danger'
                                size='sm'
                              >
                                撤销
                              </Button>
                            )}
                          </>
                        )}
                        {canMarkActionsSynced && submission.status === 'approved' && (
                          <Button
                            disabled={isModerating}
                            onClick={() => {
                              const confirmed = window.confirm('确认将该改动标记为已同步？');
                              if (!confirmed) return;
                              void moderateAction(submission.action_id, 'mark-synced');
                            }}
                            variant='secondary'
                            size='sm'
                          >
                            标为已同步
                          </Button>
                        )}
                        {canApproveActions &&
                          submission.created_by &&
                          (submission.status === 'approved' || submission.status === 'synced') && (
                            <Button
                              disabled={isModerating}
                              onClick={() =>
                                setThankTarget({
                                  actionId: submission.action_id,
                                  contributionTitle: `${
                                    GAME_DATA_ENTITY_LABELS[submission.entity_type] ??
                                    submission.entity_type
                                  }改动`,
                                  approveFirst: false,
                                })
                              }
                              variant='secondary'
                              size='sm'
                            >
                              感谢
                            </Button>
                          )}
                        {canRevokeActions && submission.status === 'approved' && (
                          <Button
                            disabled={isModerating}
                            onClick={() => {
                              const confirmed =
                                window.confirm('确认撤销该改动？撤销后将从公开数据中移除。');
                              if (!confirmed) return;
                              void moderateAction(submission.action_id, 'revoke');
                            }}
                            variant='danger'
                            size='sm'
                          >
                            撤销
                          </Button>
                        )}
                        <Button
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
                            {submission.is_public !== undefined && (
                              <span className='rounded bg-gray-100 px-2 py-0.5 whitespace-nowrap text-gray-700 dark:bg-slate-900/60 dark:text-slate-200'>
                                {submission.is_public ? '已' : '未'}公开
                              </span>
                            )}
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button
                              onClick={() => void copyText(submission.action_id)}
                              variant='secondary'
                              size='sm'
                            >
                              复制ID
                            </Button>
                            <Button
                              disabled={detail === undefined}
                              onClick={() =>
                                void copyText(JSON.stringify({ ...submission, ...detail }, null, 2))
                              }
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

                        {isLoadingDetail && (
                          <div className='text-sm text-gray-500 dark:text-slate-400'>
                            详情加载中…
                          </div>
                        )}
                        {detailError && (
                          <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200'>
                            {detailError}
                          </div>
                        )}
                        {detail && (
                          <>
                            <GameDataActionPreviewList
                              entry={detail.entry}
                              entityType={submission.entity_type}
                            />

                            <GameDataActionChangeViewer
                              entry={detail.entry}
                              entityType={submission.entity_type}
                              view={diffView}
                              showAllContext={showAllDiffContext}
                              onCopyText={copyText}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className='flex flex-wrap items-center justify-end gap-2' aria-live='polite'>
        <span className='mr-1 text-sm text-gray-600 dark:text-slate-300'>
          {isPageLoading ? '分页加载中…' : `第 ${currentPage} / ${totalPages} 页`}
        </span>
        <Button
          disabled={!canGoBackward || paginationDisabled}
          onClick={onFirstPage}
          variant='secondary'
          size='sm'
        >
          首页
        </Button>
        <Button
          disabled={!canGoBackward || paginationDisabled}
          onClick={onPreviousPage}
          variant='secondary'
          size='sm'
        >
          上一页
        </Button>
        <Button
          disabled={!canGoForward || paginationDisabled}
          onClick={onNextPage}
          variant='secondary'
          size='sm'
        >
          下一页
        </Button>
        <Button
          disabled={!canGoForward || paginationDisabled}
          onClick={onLastPage}
          variant='secondary'
          size='sm'
        >
          尾页
        </Button>
      </div>

      <ThankContributionDialog
        open={thankTarget !== null}
        contributionTitle={thankTarget?.contributionTitle ?? '这次游戏数据贡献'}
        submitting={thankTarget ? moderatingActionId === thankTarget.actionId : false}
        actionLabel={thankTarget?.approveFirst ? '批准并发送感谢' : '发送感谢'}
        onClose={() => setThankTarget(null)}
        onSubmit={(message) => {
          const target = thankTarget;
          if (!target) return;
          setThankTarget(null);
          if (target.approveFirst) {
            void moderateAction(target.actionId, 'approve', { thankMessage: message });
          } else {
            void thankApprovedAction(target.actionId, message);
          }
        }}
      />
    </div>
  );
};

export default GameDataActionModerationPanel;
