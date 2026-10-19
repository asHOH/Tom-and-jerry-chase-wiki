import type { ContributionStatus } from '@/lib/users/contributionStatus';

export const SUBMISSION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'synced',
  'revoked',
] as const satisfies readonly ContributionStatus[];

type SubmissionStatusContext = 'article' | 'contribution' | 'gameData';

type StatusPresentation = {
  label: string;
  textClassName: string;
  badgeClassName: string;
  borderClassName: string;
};

const statusPresentations = {
  pending: {
    label: '待审核',
    textClassName: 'text-status-warning-foreground',
    badgeClassName: 'bg-status-warning text-status-warning-foreground',
    borderClassName: 'border-status-warning-border',
  },
  approved: {
    label: '已批准',
    textClassName: 'text-status-success-foreground',
    badgeClassName: 'bg-status-success text-status-success-foreground',
    borderClassName: 'border-status-success-border',
  },
  rejected: {
    label: '已拒绝',
    textClassName: 'text-status-error-foreground',
    badgeClassName: 'bg-status-error text-status-error-foreground',
    borderClassName: 'border-status-error-border',
  },
  synced: {
    label: '已同步',
    textClassName: 'text-status-synced-foreground',
    badgeClassName: 'bg-status-synced text-status-synced-foreground',
    borderClassName: 'border-status-synced-border',
  },
  revoked: {
    label: '已撤销',
    textClassName: 'text-foreground',
    badgeClassName: 'bg-surface-muted text-foreground',
    borderClassName: 'border-border',
  },
  unknown: {
    label: '状态未知',
    textClassName: 'text-foreground',
    badgeClassName: 'bg-surface-muted text-foreground',
    borderClassName: 'border-border',
  },
} satisfies Record<ContributionStatus | 'unknown', StatusPresentation>;

export function getSubmissionStatusPresentation(
  status: string | null | undefined,
  context: SubmissionStatusContext
) {
  const resolvedStatus =
    status &&
    Object.hasOwn(statusPresentations, status) &&
    !(context === 'article' && status === 'synced')
      ? (status as keyof typeof statusPresentations)
      : 'unknown';
  const presentation = statusPresentations[resolvedStatus];
  const label =
    resolvedStatus === 'approved'
      ? { article: '已发布', contribution: '已通过', gameData: '已批准' }[context]
      : resolvedStatus === 'rejected' && context === 'contribution'
        ? '未通过'
        : presentation.label;

  return { ...presentation, status: resolvedStatus, label };
}
