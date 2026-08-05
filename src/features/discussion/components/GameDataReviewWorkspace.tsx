'use client';

import { useState } from 'react';

import { formatArticleDate } from '@/lib/dateUtils';
import GameDataActionVisualDiff from '@/features/shared/components/GameDataActionVisualDiff';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

import type { ReviewAction, ReviewEvent, ReviewSubmission, ReviewVoteChoice } from '../reviewTypes';

const STATUS_LABELS: Record<ReviewAction['status'], string> = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝',
  synced: '已同步',
  revoked: '已撤销',
};

const EVENT_LABELS: Record<ReviewEvent['type'], string> = {
  submitted: '提交了改动',
  linked: '将改动关联到此讨论',
  moved_out: '将改动移出此讨论',
  unlinked: '取消了改动关联',
  approved: '批准了改动',
  rejected: '拒绝了改动',
  revoked: '撤销了改动',
  synced: '将改动标记为已同步',
};

type GameDataReviewWorkspaceProps = {
  submissions: ReviewSubmission[];
  events: ReviewEvent[];
  onMutate: () => void;
};

export function GameDataReviewWorkspace({
  submissions,
  events,
  onMutate,
}: GameDataReviewWorkspaceProps) {
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(() => new Set());
  const [publicMessages, setPublicMessages] = useState<Record<string, string>>({});
  const [auditVotes, setAuditVotes] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);

  const vote = async (action: ReviewAction, choice: ReviewVoteChoice) => {
    try {
      setBusyActionId(action.id);
      setError(null);
      const response = await fetch(`/api/game-data-actions/${encodeURIComponent(action.id)}/vote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice,
          ...(publicMessages[action.id]?.trim()
            ? { publicMessage: publicMessages[action.id]!.trim() }
            : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? '投票失败');
      setPublicMessages((current) => ({ ...current, [action.id]: '' }));
      onMutate();
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : '投票失败');
    } finally {
      setBusyActionId(null);
    }
  };

  const withdrawVote = async (action: ReviewAction) => {
    try {
      setBusyActionId(action.id);
      setError(null);
      const response = await fetch(`/api/game-data-actions/${encodeURIComponent(action.id)}/vote`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('撤回投票失败');
      onMutate();
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : '撤回投票失败');
    } finally {
      setBusyActionId(null);
    }
  };

  const moderate = async (
    action: ReviewAction,
    operation: 'approve' | 'reject' | 'revoke' | 'mark-synced'
  ) => {
    const note = window.prompt('审核说明（可选）') ?? '';
    try {
      setBusyActionId(action.id);
      setError(null);
      const response = await fetch(
        `/api/game-data-actions/moderation/${encodeURIComponent(action.id)}?action=${operation}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(operation === 'reject' ? { reason: note } : { note }),
        }
      );
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? '审核操作失败');
      onMutate();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : '审核操作失败');
    } finally {
      setBusyActionId(null);
    }
  };

  const moderateGroup = async (submission: ReviewSubmission, operation: 'approve' | 'reject') => {
    const actionIds = submission.actions
      .filter(
        (action) => action.status === 'pending' && (operation !== 'reject' || !action.isPublic)
      )
      .map((action) => action.id);
    if (actionIds.length === 0) return;
    const reason = window.prompt('批量审核说明（可选）') ?? '';
    try {
      setBusyActionId(submission.id);
      setError(null);
      const response = await fetch('/api/game-data-actions/moderation/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds, action: operation, reason }),
      });
      if (!response.ok) throw new Error('批量审核失败');
      onMutate();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : '批量审核失败');
    } finally {
      setBusyActionId(null);
    }
  };

  const loadAudit = async (action: ReviewAction) => {
    const response = await fetch(
      `/api/game-data-actions/${encodeURIComponent(action.id)}/vote/audit`
    );
    const payload = (await response.json().catch(() => null)) as {
      votes?: Array<{ choice: ReviewVoteChoice; nickname: string | null; updatedAt: string }>;
      error?: string;
    } | null;
    if (!response.ok) {
      setError(payload?.error ?? '投票审计加载失败');
      return;
    }
    setAuditVotes((current) => ({
      ...current,
      [action.id]: (payload?.votes ?? []).map(
        (item) =>
          `${item.nickname || '未设置昵称'}：${item.choice === 'approve' ? '赞成' : item.choice === 'reject' ? '反对' : '弃权'} · ${formatArticleDate(item.updatedAt)}`
      ),
    }));
  };

  if (submissions.length === 0 && events.length === 0) return null;
  const timelineEvents = [
    ...new Map(
      events.map((event) => [`${event.operationId}:${event.type}:${event.submissionId}`, event])
    ).values(),
  ];

  return (
    <div className='mt-4 space-y-4'>
      <h3 className='text-base font-semibold text-purple-900 dark:text-purple-100'>游戏数据审核</h3>
      {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}
      {submissions.map((submission) => {
        const pendingActions = submission.actions.filter((action) => action.status === 'pending');
        const statuses = new Set(submission.actions.map((action) => action.status));
        const aggregateStatus =
          statuses.size === 1
            ? STATUS_LABELS[submission.actions[0]?.status ?? 'pending']
            : '混合状态';
        return (
          <Card key={submission.id} bordered className='border-purple-200 dark:border-purple-900'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <div className='font-medium'>
                  {submission.creatorNickname || '匿名贡献者'}提交的改动
                </div>
                <div className='text-xs text-gray-500'>
                  {formatArticleDate(submission.createdAt)} · {submission.actions.length} 项改动 ·{' '}
                  {aggregateStatus}
                </div>
              </div>
              {pendingActions.length > 1 && (
                <div className='flex gap-2'>
                  {pendingActions.every((action) => action.capabilities.approve) && (
                    <Button
                      size='sm'
                      variant='success'
                      onClick={() => void moderateGroup(submission, 'approve')}
                    >
                      全部批准
                    </Button>
                  )}
                  {pendingActions.every(
                    (action) => action.capabilities.reject && !action.isPublic
                  ) && (
                    <Button
                      size='sm'
                      variant='danger'
                      onClick={() => void moderateGroup(submission, 'reject')}
                    >
                      全部拒绝
                    </Button>
                  )}
                </div>
              )}
            </div>
            {submission.message && (
              <p className='mt-2 text-sm text-gray-700 dark:text-gray-300'>{submission.message}</p>
            )}
            <div className='mt-3 space-y-3'>
              {submission.actions.map((action) => {
                const isBusy = busyActionId === action.id || busyActionId === submission.id;
                const expanded = expandedActions.has(action.id);
                const approveConflicts = action.votes.reject > action.votes.approve;
                const rejectConflicts = action.votes.approve > action.votes.reject;
                return (
                  <div
                    key={action.id}
                    className='rounded-lg border border-gray-200 p-3 dark:border-slate-700'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <div className='text-sm'>
                        <span className='font-medium'>{action.entityType}</span>
                        <span className='ml-2 text-gray-500'>{STATUS_LABELS[action.status]}</span>
                      </div>
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() =>
                          setExpandedActions((current) => {
                            const next = new Set(current);
                            if (next.has(action.id)) next.delete(action.id);
                            else next.add(action.id);
                            return next;
                          })
                        }
                      >
                        {expanded ? '收起差异' : '查看差异'}
                      </Button>
                    </div>
                    <div className='mt-2 flex flex-wrap gap-2 text-xs'>
                      <span className='rounded bg-green-100 px-2 py-1 text-green-800'>
                        赞成 {action.votes.approve}
                      </span>
                      <span className='rounded bg-red-100 px-2 py-1 text-red-800'>
                        反对 {action.votes.reject}
                      </span>
                      <span className='rounded bg-gray-100 px-2 py-1 text-gray-700'>
                        弃权 {action.votes.abstain}
                      </span>
                      {action.myVote && (
                        <span className='px-2 py-1'>
                          我的投票：
                          {action.myVote === 'approve'
                            ? '赞成'
                            : action.myVote === 'reject'
                              ? '反对'
                              : '弃权'}
                        </span>
                      )}
                    </div>
                    {action.status === 'pending' && action.capabilities.vote && (
                      <div className='mt-3 space-y-2'>
                        <input
                          value={publicMessages[action.id] ?? ''}
                          onChange={(event) =>
                            setPublicMessages((current) => ({
                              ...current,
                              [action.id]: event.target.value,
                            }))
                          }
                          maxLength={1800}
                          placeholder='公开说明（可选；会显示您的昵称和立场）'
                          className='w-full rounded border border-gray-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-600'
                        />
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            size='sm'
                            variant='success'
                            disabled={isBusy}
                            onClick={() => void vote(action, 'approve')}
                          >
                            赞成
                          </Button>
                          <Button
                            size='sm'
                            variant='danger'
                            disabled={isBusy}
                            onClick={() => void vote(action, 'reject')}
                          >
                            反对
                          </Button>
                          <Button
                            size='sm'
                            variant='secondary'
                            disabled={isBusy}
                            onClick={() => void vote(action, 'abstain')}
                          >
                            弃权
                          </Button>
                          {action.myVote && (
                            <Button
                              size='sm'
                              variant='ghost'
                              disabled={isBusy}
                              onClick={() => void withdrawVote(action)}
                            >
                              撤回投票
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {action.capabilities.viewVotes && (
                      <div className='mt-2'>
                        <Button size='sm' variant='ghost' onClick={() => void loadAudit(action)}>
                          查看实名投票审计
                        </Button>
                        {auditVotes[action.id]?.map((line) => (
                          <div key={line} className='mt-1 text-xs text-gray-500'>
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                    {action.status === 'pending' &&
                      ((action.capabilities.approve && approveConflicts) ||
                        (action.capabilities.reject && rejectConflicts)) && (
                        <p className='mt-2 text-xs text-amber-700 dark:text-amber-300'>
                          提示：当前投票多数意见为
                          {approveConflicts ? '反对' : '赞成'}；审核决定仍以审核者操作为准。
                        </p>
                      )}
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {action.status === 'pending' && action.capabilities.approve && (
                        <Button
                          size='sm'
                          variant='success'
                          disabled={isBusy}
                          onClick={() => void moderate(action, 'approve')}
                        >
                          批准
                        </Button>
                      )}
                      {action.status === 'pending' &&
                        !action.isPublic &&
                        action.capabilities.reject && (
                          <Button
                            size='sm'
                            variant='danger'
                            disabled={isBusy}
                            onClick={() => void moderate(action, 'reject')}
                          >
                            拒绝
                          </Button>
                        )}
                      {action.status === 'pending' &&
                        action.isPublic &&
                        action.capabilities.revoke && (
                          <Button
                            size='sm'
                            variant='danger'
                            disabled={isBusy}
                            onClick={() => void moderate(action, 'revoke')}
                          >
                            撤销
                          </Button>
                        )}
                      {action.status === 'approved' && action.capabilities.sync && (
                        <Button
                          size='sm'
                          variant='secondary'
                          disabled={isBusy}
                          onClick={() => void moderate(action, 'mark-synced')}
                        >
                          标为已同步
                        </Button>
                      )}
                      {action.status === 'approved' && action.capabilities.revoke && (
                        <Button
                          size='sm'
                          variant='danger'
                          disabled={isBusy}
                          onClick={() => void moderate(action, 'revoke')}
                        >
                          撤销
                        </Button>
                      )}
                    </div>
                    {action.rejectionReason && (
                      <p className='mt-2 text-sm text-red-700'>
                        审核说明：{action.rejectionReason}
                      </p>
                    )}
                    {expanded && <GameDataActionVisualDiff entry={action.entry} className='mt-3' />}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      {timelineEvents.length > 0 && (
        <div className='space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-slate-900/40'>
          <h4 className='text-sm font-medium'>审核时间线</h4>
          {timelineEvents.map((event) => (
            <div key={event.id} className='text-xs text-gray-600 dark:text-gray-400'>
              {event.actorNickname || '系统'}
              {EVENT_LABELS[event.type]} · {STATUS_LABELS[event.resultingStatus]}
              {' · '}
              {formatArticleDate(event.createdAt)}
              {event.type !== 'submitted' &&
                ` · 投票 ${event.votes.approve}/${event.votes.reject}/${event.votes.abstain}`}
              {event.note && ` · ${event.note}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
