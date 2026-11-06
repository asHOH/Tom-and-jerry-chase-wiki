'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useIsClient } from 'usehooks-ts';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import type { ApiComment } from '@/lib/comments/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageShell from '@/components/ui/PageShell';
import { CommentPageButton } from '@/components/comments/CommentPageButton';
import { useCommentPages } from '@/components/comments/useCommentPages';
import LoginDialog from '@/components/LoginDialog';

import { DiscussionInfoBanner } from './components/DiscussionInfoBanner';
import { NewTopicForm } from './components/NewTopicForm';
import { TableOfContents } from './components/TableOfContents';
import { TopicSection } from './components/TopicSection';
import type { CommentNode } from './types';

type TalkPageClientProps = {
  scope: string;
  targetId: string;
  entityTitle: string;
  entityTypeLabel: string;
  parentUrl: string;
};

function DiscussionLoading() {
  return (
    <div className='flex min-h-75 items-center justify-center'>
      <LoadingSpinner size='lg' />
    </div>
  );
}

export function TalkPageClient(props: TalkPageClientProps) {
  const isClient = useIsClient();
  // The browser can restore comment pages that were unavailable during server rendering.
  return isClient ? <Discussion {...props} /> : <DiscussionLoading />;
}

function Discussion({
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

  const pages = useCommentPages(scope, targetId);
  const { byParent, mutate } = pages;
  const topics = useMemo(() => {
    function buildNode(comment: ApiComment, depth: number): CommentNode {
      return {
        id: comment.id,
        parentId: comment.parent_id,
        content: comment.content,
        createdAt: comment.created_at,
        title: comment.title,
        status: comment.status,
        author: comment.author,
        children: (byParent.get(comment.id) ?? []).map((reply) => buildNode(reply, depth + 1)),
        depth,
      };
    }

    function lastActivity(topic: CommentNode) {
      return Date.parse(topic.children.at(-1)?.createdAt ?? topic.createdAt);
    }

    return (byParent.get(null) ?? [])
      .filter((topic) => topic.title)
      .map((topic) => buildNode(topic, 0))
      .sort((a, b) => lastActivity(b) - lastActivity(a));
  }, [byParent]);

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

  if (pages.isLoading && !pages.hasData) {
    return <DiscussionLoading />;
  }

  // Error state
  if (pages.error && !pages.hasData) {
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
      {topics.length === 0 && !pages.hasMore && (
        <Card bordered className='bg-surface/70 dark:bg-background/40 p-8 text-center'>
          <p className='text-gray-500 dark:text-gray-400'>暂无讨论，来创建第一个话题吧</p>
        </Card>
      )}

      {/* Topic sections */}
      {topics.map((node) => (
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
      ))}
      <CommentPageButton pages={pages} />

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        isMobile={isMobile}
      />
    </PageShell>
  );
}
