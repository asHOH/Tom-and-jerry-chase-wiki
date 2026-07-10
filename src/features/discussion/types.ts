export type DiscussionTopic = {
  id: string;
  title: string | null;
  authorId: string;
  authorNickname: string | null;
  content: string;
  createdAt: string;
  replyCount: number;
  lastActivityAt: string;
  status: string;
};

export type DiscussionPost = {
  id: string;
  parentId: string | null;
  authorId: string;
  authorNickname: string | null;
  content: string;
  createdAt: string;
  status: string;
};

export type ViewMode = 'list' | 'topic';
