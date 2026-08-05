import type { Json } from '@/data/database.types';

export type ReviewVoteChoice = 'approve' | 'reject' | 'abstain';
export type ReviewActionStatus = 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';

export type ReviewAction = {
  id: string;
  entityType: string;
  entry: Json;
  status: ReviewActionStatus;
  isPublic: boolean;
  rejectionReason: string | null;
  reviewedAt: string | null;
  votes: { approve: number; reject: number; abstain: number };
  myVote: ReviewVoteChoice | null;
  capabilities: {
    vote: boolean;
    viewVotes: boolean;
    approve: boolean;
    reject: boolean;
    revoke: boolean;
    sync: boolean;
  };
};

export type ReviewSubmission = {
  id: string;
  topicId: string;
  createdAt: string;
  creatorNickname: string | null;
  message: string | null;
  actions: ReviewAction[];
};

export type ReviewEvent = {
  id: string;
  operationId: string;
  submissionId: string;
  topicId: string;
  actionId: string;
  type:
    | 'submitted'
    | 'linked'
    | 'moved_out'
    | 'unlinked'
    | 'approved'
    | 'rejected'
    | 'revoked'
    | 'synced';
  actorNickname: string | null;
  note: string | null;
  resultingStatus: ReviewActionStatus;
  votes: { approve: number; reject: number; abstain: number };
  createdAt: string;
};

export type DiscussionReviewWorkspaceResponse = {
  submissionsByTopic: Record<string, ReviewSubmission[]>;
  eventsByTopic: Record<string, ReviewEvent[]>;
};
