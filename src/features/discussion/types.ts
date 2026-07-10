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

/** Comment node in a reply tree, with nested children and indentation depth. */
export type CommentNode = {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  title: string | null;
  status: string;
  author: { id: string; nickname: string | null };
  children: CommentNode[];
  depth: number;
};
