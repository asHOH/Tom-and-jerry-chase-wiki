'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageShell from '@/components/ui/PageShell';
import LoginDialog from '@/components/LoginDialog';

import { DiscussionInfoBanner } from './components/DiscussionInfoBanner';
import { NewTopicForm } from './components/NewTopicForm';
import { TableOfContents } from './components/TableOfContents';
import { TopicSection } from './components/TopicSection';
import type { CommentNode } from './types';

type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  title: string | null;
  status: string;
  author: {
    id: string;
    nickname: string | null;
  };
};

type CommentsResponse = { comments: ApiComment[] };

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const error = new Error('Failed to fetch') as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

/** Build a nested reply tree from flat comments. */
function buildReplyTree(comments: ApiComment[], parentId: string, depth: number): CommentNode[] {
  return comments
    .filter((c) => c.parent_id === parentId)
    .map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      content: c.content,
      createdAt: c.created_at,
      title: c.title,
      status: c.status,
      author: c.author,
      children: buildReplyTree(comments, c.id, depth + 1),
      depth,
    }));
}

type TalkPageClientProps = {
  scope: string;
  targetId: string;
  entityTitle: string;
  entityTypeLabel: string;
  parentUrl: string;
};

export function TalkPageClient({
  scope,
  targetId,
  entityTitle,
  entityTypeLabel,
  parentUrl,
}: TalkPageClientProps) {
  const { nickname } = useUser();
  const permissions = usePermissions();
  const isMobile = useMobile();
  const isAdmin = permissions.can('comment.moderate', {
    resourceType: `comments/${scope}`,
    resourceId: targetId,
  });

  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const apiUrl = useMemo(
    () =>
      `/api/comments?scope=${encodeURIComponent(scope)}&targetId=${encodeURIComponent(targetId)}`,
    [scope, targetId]
  );

  const {
    data,
    error: loadError,
    mutate,
    isLoading,
  } = useSWR<CommentsResponse>(targetId ? apiUrl : null, fetcher);

  const comments = useMemo(() => data?.comments ?? [], [data]);

  const topics = useMemo(() => {
    return comments
      .filter((c) => c.parent_id === null && c.title)
      .map((topic) => {
        const replies = comments.filter((c) => c.parent_id === topic.id);
        const lastActivity =
          replies.length > 0 ? replies[replies.length - 1]!.created_at : topic.created_at;
        return {
          id: topic.id,
          title: topic.title,
          authorId: topic.author.id,
          authorNickname: topic.author.nickname,
          content: topic.content,
          createdAt: topic.created_at,
          replyCount: replies.length,
          lastActivityAt: lastActivity,
          status: topic.status,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
  }, [comments]);

  const topicTrees = useMemo(() => {
    return topics.map((topic) => {
      const topicComment = comments.find((c) => c.id === topic.id);
      if (!topicComment) return null;
      return {
        id: topicComment.id,
        parentId: topicComment.parent_id,
        content: topicComment.content,
        createdAt: topicComment.created_at,
        title: topicComment.title,
        status: topicComment.status,
        author: topicComment.author,
        children: buildReplyTree(comments, topicComment.id, 1),
        depth: 0,
      } satisfies CommentNode;
    });
  }, [topics, comments]);

  const handleCreateTopic = useCallback(() => {
    if (!nickname) {
      setShowLoginDialog(true);
      return;
    }
    setShowNewTopicForm(true);
  }, [nickname]);

  const handleMutate = useCallback(() => {
    void mutate();
  }, [mutate]);

  const handleLoginRequired = useCallback(() => {
    setShowLoginDialog(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <LoadingSpinner size='lg' />
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950'>
        <p className='text-red-600 dark:text-red-400'>讨论加载失败</p>
        <Button variant='danger' size='sm' className='mt-3' onClick={() => void mutate()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <PageShell width='narrow' className='py-6'>
      {/* Page header */}
      <nav className='mb-1'>
        <Link
          href={parentUrl}
          className='text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
        >
          ← 返回至 {entityTitle}
          {entityTitle !== entityTypeLabel && <span> ({entityTypeLabel})</span>}
        </Link>
      </nav>

      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            {entityTitle}
            {entityTitle !== entityTypeLabel && (
              <span className='text-gray-500 dark:text-gray-400'> ({entityTypeLabel})</span>
            )}
          </h1>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>讨论</p>
        </div>
        <Button variant='success' size='sm' onClick={handleCreateTopic}>
          新建话题
        </Button>
      </div>

      {/* Info banner */}
      <DiscussionInfoBanner entityTitle={entityTitle} entityTypeLabel={entityTypeLabel} />

      {/* New topic form */}
      {showNewTopicForm && (
        <NewTopicForm
          scope={scope}
          targetId={targetId}
          onSuccess={() => {
            setShowNewTopicForm(false);
            void mutate();
          }}
          onCancel={() => setShowNewTopicForm(false)}
        />
      )}

      {/* Table of contents */}
      {topics.length > 1 && <TableOfContents topics={topics} />}

      {/* Empty state */}
      {topics.length === 0 && (
        <Card bordered className='bg-surface/70 dark:bg-background/40 p-8 text-center'>
          <p className='text-gray-500 dark:text-gray-400'>暂无讨论，来创建第一个话题吧</p>
        </Card>
      )}

      {/* Topic sections */}
      {topicTrees.map(
        (node) =>
          node && (
            <TopicSection
              key={node.id}
              topic={node}
              scope={scope}
              targetId={targetId}
              isAuthenticated={Boolean(nickname)}
              isAdmin={isAdmin}
              userNickname={null}
              onMutate={handleMutate}
              onLoginRequired={handleLoginRequired}
            />
          )
      )}

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        isMobile={isMobile}
      />
    </PageShell>
  );
}
