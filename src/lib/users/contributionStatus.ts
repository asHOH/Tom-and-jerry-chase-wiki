export type ContributionKind = 'article' | 'gameData';

export type ContributionStatus = 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';

export type ContributionStatusItem = {
  id: string;
  kind: ContributionKind;
  title: string;
  description: string | null;
  status: ContributionStatus;
  isPublic: boolean;
  createdAt: string;
  reviewedAt: string | null;
  feedback: string | null;
  href: string | null;
  previewHref: string | null;
  reviseHref: string | null;
  discussionHref: string | null;
  thanked: boolean;
  thankMessage: string | null;
};

export type ContributionStatusResponse = {
  contributions: ContributionStatusItem[];
  truncated: boolean;
};
