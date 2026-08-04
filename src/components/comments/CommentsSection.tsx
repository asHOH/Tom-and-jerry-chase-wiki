'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import { formatArticleDate } from '@/lib/dateUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useUser } from '@/hooks/useUser';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormTextarea } from '@/components/ui/FormControls';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SectionHeader from '@/components/ui/SectionHeader';
import LoginDialog from '@/components/LoginDialog';
import { CommunityConsent } from '@/components/UserContentConsent';

type CommentScope = 'articles';

type ApiComment = {
  id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: {
    id: string;
    nickname: string | null;
  };
};

type CommentsResponse = { comments: ApiComment[] };

type CreateCommentResponse = { comment?: ApiComment; error?: string };

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      const error = new Error('Failed to fetch') as Error & { status?: number };
      error.status = res.status;
      throw error;
    }
    return res.json();
  });

function buildTree(comments: ApiComment[]) {
  const byParent = new Map<string | null, ApiComment[]>();
  for (const comment of comments) {
    const key = comment.parent_id;
    const list = byParent.get(key);
    if (list) {
      list.push(comment);
    } else {
      byParent.set(key, [comment]);
    }
  }
  return byParent;
}

export default function CommentsSection({
  scope,
  targetId,
}: {
  scope: CommentScope;
  targetId: string;
}) {
  const { nickname: userNickname } = useUser();
  const permissions = usePermissions();
  const canComment = permissions.can('comment.create', {
    resourceType: `comments/${scope}`,
    resourceId: targetId,
  });
  const isMobile = useMobile();

  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string | null } | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [communityRulesAccepted, setCommunityRulesAccepted] = useState(false);

  const apiUrl = useMemo(
    () =>
      `/api/comments?scope=${encodeURIComponent(scope)}&targetId=${encodeURIComponent(targetId)}`,
    [scope, targetId]
  );

  const {
    data,
    error: loadError,
    mutate,
  } = useSWR<CommentsResponse>(targetId ? apiUrl : null, fetcher);

  const comments = useMemo(() => data?.comments ?? [], [data?.comments]);
  const tree = useMemo(() => buildTree(comments), [comments]);

  const handleSubmit = async () => {
    if (!canComment) {
      setShowLoginDialog(true);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('请输入评论内容');
      return;
    }
    if (!communityRulesAccepted) {
      setError('请先确认评论发布规则');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope,
          targetId,
          parentId: replyTo?.id,
          content: trimmed,
          communityRulesAccepted: true,
        }),
      });

      const payload = (await response.json().catch(() => null)) as CreateCommentResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? '发表评论失败');
        return;
      }

      setContent('');
      setReplyTo(null);
      setCommunityRulesAccepted(false);
      await mutate();
    } catch (err) {
      console.error('Failed to create comment:', err);
      setError('发表评论失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = (comment: ApiComment, depth: number) => {
    const authorName = comment.author.nickname || '匿名';

    return (
      <Card
        key={comment.id}
        bordered
        className='bg-surface/70 dark:bg-background/40 p-3 shadow-sm'
        style={{ marginLeft: depth ? Math.min(depth, 3) * 12 : 0 }}
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0 text-sm font-semibold text-gray-800 dark:text-gray-200'>
            <span className='truncate'>{authorName}</span>
            {userNickname && comment.author.nickname === userNickname ? (
              <span className='ml-2 text-xs font-normal text-gray-500 dark:text-gray-400'>
                （我）
              </span>
            ) : null}
          </div>
          <div className='shrink-0 text-xs text-gray-500 dark:text-gray-400'>
            {formatArticleDate(comment.created_at)}
          </div>
        </div>

        <div className='mt-2 text-sm wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
          {comment.content}
        </div>

        <div className='mt-2 flex items-center gap-3 text-xs'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setReplyTo({ id: comment.id, nickname: comment.author.nickname })}
            className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            回复
          </Button>
        </div>

        {tree.get(comment.id)?.length ? (
          <div className='mt-3 space-y-3'>
            {tree.get(comment.id)!.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
      </Card>
    );
  };

  const loading = !data && !loadError;

  return (
    <section id='comments' className='mt-8'>
      <SectionHeader title='评论' variant='compact'>
        <span className='text-sm text-gray-500 dark:text-gray-400'>{comments.length} 条</span>
      </SectionHeader>

      <Card bordered className='bg-surface/70 dark:bg-background/40 shadow-sm'>
        {replyTo ? (
          <div className='mb-3 flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-slate-800 dark:text-gray-200'>
            <div className='min-w-0 truncate'>回复 {replyTo.nickname || '匿名'}</div>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => setReplyTo(null)}
              className='shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              aria-label='取消回复'
            >
              ✕
            </Button>
          </div>
        ) : null}

        {!canComment ? (
          <div className='mb-3 text-sm text-gray-600 dark:text-gray-400'>登录后可发表评论。</div>
        ) : null}

        <FormTextarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={canComment ? '写下你的评论…' : '请先登录后发表评论'}
          disabled={!canComment || isSubmitting}
          size='sm'
          className='h-24 resize-none p-3'
        />

        <div className='mt-3'>
          <CommunityConsent
            id={`comments-community-consent-${targetId}`}
            checked={communityRulesAccepted}
            onChange={setCommunityRulesAccepted}
            disabled={!canComment || isSubmitting}
            compact
          />
        </div>

        {error ? <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div> : null}

        <div className='mt-3 flex items-center justify-end gap-2'>
          {!canComment ? (
            <Button variant='primary' size='sm' onClick={() => setShowLoginDialog(true)}>
              登录
            </Button>
          ) : null}

          <Button
            onClick={handleSubmit}
            disabled={!canComment || isSubmitting || !communityRulesAccepted}
            loading={isSubmitting}
            variant='success'
            size='sm'
          >
            {isSubmitting ? '发送中…' : '发表评论'}
          </Button>
        </div>
      </Card>

      <div className='mt-4 space-y-3'>
        {loading ? (
          <div className='flex min-h-30 items-center justify-center'>
            <LoadingSpinner size='md' />
          </div>
        ) : loadError ? (
          <Card
            bordered
            className='bg-surface/70 text-muted-foreground dark:bg-background/40 text-sm'
          >
            评论加载失败，请稍后再试。
          </Card>
        ) : comments.length === 0 ? (
          <Card
            bordered
            className='bg-surface/70 text-muted-foreground dark:bg-background/40 text-sm'
          >
            暂无评论，来抢沙发吧。
          </Card>
        ) : (
          (tree.get(null) ?? []).map((comment) => renderComment(comment, 0))
        )}
      </div>

      <LoginDialog
        open={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        isMobile={isMobile}
      />
    </section>
  );
}
