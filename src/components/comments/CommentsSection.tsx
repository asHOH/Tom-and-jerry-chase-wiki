'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';

import { useMobile } from '../../hooks/useMediaQuery';
import { useUser } from '../../hooks/useUser';
import { formatArticleDate } from '../../lib/dateUtils';
import LoginDialog from '../LoginDialog';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

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
  const { role: userRole, nickname: userNickname } = useUser();
  const isMobile = useMobile();

  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string | null } | null>(null);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  } = useSWR<CommentsResponse>(targetId ? apiUrl : null, fetcher);

  const comments = useMemo(() => data?.comments ?? [], [data?.comments]);
  const tree = useMemo(() => buildTree(comments), [comments]);

  const handleSubmit = async () => {
    if (!userRole) {
      setShowLoginDialog(true);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('请输入评论内容');
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
        }),
      });

      const payload = (await response.json().catch(() => null)) as CreateCommentResponse | null;

      if (!response.ok) {
        setError(payload?.error ?? '发表评论失败');
        return;
      }

      setContent('');
      setReplyTo(null);
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
      <div
        key={comment.id}
        className='rounded-lg border border-gray-200 bg-white/70 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/40'
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
          <button
            type='button'
            onClick={() => setReplyTo({ id: comment.id, nickname: comment.author.nickname })}
            className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            回复
          </button>
        </div>

        {tree.get(comment.id)?.length ? (
          <div className='mt-3 space-y-3'>
            {tree.get(comment.id)!.map((child) => renderComment(child, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  const loading = !data && !loadError;

  return (
    <section className='mt-8'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-lg font-bold text-gray-900 dark:text-gray-100'>评论</h2>
        <span className='text-sm text-gray-500 dark:text-gray-400'>{comments.length} 条</span>
      </div>

      <div className='rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/40'>
        {replyTo ? (
          <div className='mb-3 flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200'>
            <div className='min-w-0 truncate'>回复 {replyTo.nickname || '匿名'}</div>
            <button
              type='button'
              onClick={() => setReplyTo(null)}
              className='shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              aria-label='取消回复'
            >
              ✕
            </button>
          </div>
        ) : null}

        {!userRole ? (
          <div className='mb-3 text-sm text-gray-600 dark:text-gray-400'>登录后可发表评论。</div>
        ) : null}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={userRole ? '写下你的评论…' : '请先登录后发表评论'}
          disabled={!userRole || isSubmitting}
          className='h-24 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'
        />

        {error ? <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div> : null}

        <div className='mt-3 flex items-center justify-end gap-2'>
          {!userRole ? (
            <Button
              type='button'
              variant='primary'
              size='sm'
              onClick={() => setShowLoginDialog(true)}
            >
              登录
            </Button>
          ) : null}

          <Button
            type='button'
            onClick={handleSubmit}
            disabled={!userRole || isSubmitting}
            loading={isSubmitting}
            variant='primary'
            size='sm'
            className='bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
          >
            {isSubmitting ? '发送中…' : '发表评论'}
          </Button>
        </div>
      </div>

      <div className='mt-4 space-y-3'>
        {loading ? (
          <div className='flex min-h-30 items-center justify-center'>
            <LoadingSpinner size='md' />
          </div>
        ) : loadError ? (
          <div className='rounded-lg border border-gray-200 bg-white/70 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400'>
            评论加载失败，请稍后再试。
          </div>
        ) : comments.length === 0 ? (
          <div className='rounded-lg border border-gray-200 bg-white/70 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400'>
            暂无评论，来抢沙发吧。
          </div>
        ) : (
          (tree.get(null) ?? []).map((comment) => renderComment(comment, 0))
        )}
      </div>

      {showLoginDialog ? (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      ) : null}
    </section>
  );
}
