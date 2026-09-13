'use client';

import Link from 'next/link';
import useSWRImmutable from 'swr/immutable';

import { formatCompactDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/design';
import type { GameDataActionDetail, GameDataActionSummary } from '@/lib/gameData/adminActionTypes';
import { getGameDataEntityLabel } from '@/lib/gameData/presentation';
import type { useGameDataModeration } from '@/features/admin/hooks/useGameDataModeration';
import type { GameActionDiffView } from '@/features/admin/utils/gameActionDiff';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ChevronRightIcon } from '@/components/icons/CommonIcons';

import GameDataActionPreviewList, { GameDataActionChangeViewer } from './GameDataActionPreviewList';

type ActionStatus = GameDataActionSummary['status'];

export type ThankTarget = {
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

type GameDataActionRowProps = {
  submission: GameDataActionSummary;
  canApproveActions: boolean;
  canRejectActions: boolean;
  canMarkActionsSynced: boolean;
  canRevokeActions: boolean;
  isModerating: boolean;
  isSelected: boolean;
  isExpanded: boolean;
  diffView: GameActionDiffView;
  showAllDiffContext: boolean;
  copyText: (text: string) => Promise<void>;
  moderateAction: ReturnType<typeof useGameDataModeration>['moderate'];
  onThank: (target: ThankTarget) => void;
  onToggleSelected: () => void;
  onToggleExpanded: () => void;
};

export default function GameDataActionRow({
  submission,
  canApproveActions,
  canRejectActions,
  canMarkActionsSynced,
  canRevokeActions,
  isModerating,
  isSelected,
  isExpanded,
  diffView,
  showAllDiffContext,
  copyText,
  moderateAction,
  onThank,
  onToggleSelected,
  onToggleExpanded,
}: GameDataActionRowProps) {
  const statusMeta =
    ACTION_STATUS_META[submission.status as ActionStatus] ?? ACTION_STATUS_META.pending;
  return (
    <Card className='rounded-md'>
      <div className='flex items-start gap-3'>
        <div className='pt-1'>
          {submission.status === 'pending' &&
          (canApproveActions || (!submission.is_public && canRejectActions)) ? (
            <input
              type='checkbox'
              checked={isSelected}
              disabled={isModerating}
              onChange={onToggleSelected}
              aria-label={`选择改动 ${submission.action_id}`}
              className='bg-surface-sunken h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 dark:border-slate-600 dark:focus:ring-green-400'
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
                        onThank({
                          actionId: submission.action_id,
                          contributionTitle: `${getGameDataEntityLabel(
                            submission.entity_type
                          )}改动`,
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
                        void moderateAction(submission.action_id, 'reject', {
                          reason: window.prompt('拒绝原因（可选）', '') ?? '',
                        });
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
                      onThank({
                        actionId: submission.action_id,
                        contributionTitle: `${getGameDataEntityLabel(submission.entity_type)}改动`,
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
                    const confirmed = window.confirm('确认撤销该改动？撤销后将从公开数据中移除。');
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
                onClick={onToggleExpanded}
                aria-label={isExpanded ? '收起详情' : '展开详情'}
                aria-expanded={isExpanded}
                title={isExpanded ? '收起详情' : '展开详情'}
                variant='secondary'
                size='sm'
                className='h-8 w-8 p-0'
              >
                <ChevronRightIcon
                  className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')}
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
            <GameDataActionDetails
              submission={submission}
              diffView={diffView}
              showAllDiffContext={showAllDiffContext}
              copyText={copyText}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

type GameDataActionDetailsProps = {
  submission: GameDataActionSummary;
  diffView: GameActionDiffView;
  showAllDiffContext: boolean;
  copyText: (text: string) => Promise<void>;
};

function GameDataActionDetails({
  submission,
  diffView,
  showAllDiffContext,
  copyText,
}: GameDataActionDetailsProps) {
  const {
    data: detail,
    error: detailError,
    isLoading: isLoadingDetail,
  } = useSWRImmutable<GameDataActionDetail, Error>(
    `/api/game-data-actions/admin/${encodeURIComponent(submission.action_id)}`,
    async (url: string) => {
      const response = await fetch(url);
      const payload = (await response.json().catch(() => null)) as
        (Partial<GameDataActionDetail> & { error?: string }) | null;
      if (
        !response.ok ||
        payload?.action_id !== submission.action_id ||
        payload.entry === undefined
      ) {
        throw new Error(payload?.error ?? '详情加载失败');
      }
      return payload as GameDataActionDetail;
    },
    { shouldRetryOnError: false }
  );

  return (
    <div className='mt-3 space-y-2'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400'>
          <span className='truncate'>action_id: {submission.action_id}</span>
          {submission.is_public !== undefined && (
            <span className='bg-surface-muted rounded px-2 py-0.5 whitespace-nowrap text-gray-700 dark:text-slate-200'>
              {submission.is_public ? '已' : '未'}公开
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={() => void copyText(submission.action_id)} variant='secondary' size='sm'>
            复制ID
          </Button>
          <Button
            disabled={detail === undefined}
            onClick={() => void copyText(JSON.stringify({ ...submission, ...detail }, null, 2))}
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
        <div className='text-sm text-gray-500 dark:text-slate-400'>详情加载中…</div>
      )}
      {detailError && (
        <div className='rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200'>
          {detailError instanceof Error ? detailError.message : '操作失败'}
        </div>
      )}
      {detail && (
        <>
          <GameDataActionPreviewList entry={detail.entry} entityType={submission.entity_type} />

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
  );
}
