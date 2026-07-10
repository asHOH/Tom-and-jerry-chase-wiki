'use client';

import { useState } from 'react';

import { formatArticleDate } from '@/lib/dateUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import LoginDialog from '@/components/LoginDialog';

import type { DiscussionTopic } from '../types';

type TopicViewProps = {
  topic: DiscussionTopic;
  comments: Array<{
    id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    title: string | null;
    status: string;
    author: { id: string; nickname: string | null };
  }>;
  scope: string;
  targetId: string;
  userRole: string | null;
  userNickname: string | null;
  onMutate: () => void;
};

export function TopicView({
  topic,
  comments,
  scope,
  targetId,
  userRole,
  userNickname,
  onMutate,
}: TopicViewProps) {
  const isMobile = useMobile();
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const isAdmin = userRole === 'Reviewer' || userRole === 'Coordinator';

  const topicReplies = comments.filter((c) => c.parent_id === topic.id && c.id !== topic.id);

  const handleSubmitReply = async () => {
    if (!userRole) {
      setShowLoginDialog(true);
      return;
    }

    const trimmed = replyContent.trim();
    if (!trimmed) {
      setError('请输入回复内容');
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
          parentId: replyToId ?? topic.id,
          content: trimmed,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        comment?: unknown;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? '回复失败');
        return;
      }

      setReplyContent('');
      setReplyToId(null);
      onMutate();
    } catch {
      setError('回复失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (commentId: string, status: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, status }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? '操作失败');
        return;
      }

      onMutate();
    } catch {
      setError('操作失败，请稍后重试');
    }
  };

  return (
    <div className='space-y-4'>
      {/* Topic post */}
      <div className='rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0 text-sm font-semibold text-gray-800 dark:text-gray-200'>
            <span className='truncate'>{topic.authorNickname || '匿名'}</span>
            {userNickname && topic.authorNickname === userNickname && (
              <span className='ml-2 text-xs font-normal text-gray-500 dark:text-gray-400'>
                （我）
              </span>
            )}
          </div>
          <div className='shrink-0 text-xs text-gray-500 dark:text-gray-400'>
            {formatArticleDate(topic.createdAt)}
          </div>
        </div>

        <div className='mt-3 text-sm wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
          {topic.content}
        </div>

        <div className='mt-3 flex items-center gap-3 text-xs'>
          <button
            type='button'
            onClick={() => {
              if (!userRole) {
                setShowLoginDialog(true);
                return;
              }
              setReplyToId(topic.id);
            }}
            className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            回复
          </button>

          {isAdmin && topic.status !== 'deleted' && (
            <>
              {topic.status !== 'hidden' ? (
                <button
                  type='button'
                  onClick={() => handleStatusChange(topic.id, 'hidden')}
                  className='text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
                >
                  隐藏
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => handleStatusChange(topic.id, 'visible')}
                  className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                >
                  显示
                </button>
              )}
              <button
                type='button'
                onClick={() => {
                  if (window.confirm('确定要删除这条评论吗？')) {
                    void handleStatusChange(topic.id, 'deleted');
                  }
                }}
                className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
              >
                删除
              </button>
            </>
          )}
          {topic.status === 'deleted' && (
            <span className='text-red-500 dark:text-red-400'>已删除</span>
          )}
          {topic.status === 'hidden' && (
            <span className='text-yellow-500 dark:text-yellow-400'>已隐藏</span>
          )}
        </div>
      </div>

      {/* Replies */}
      {topicReplies.map((reply) => (
        <div
          key={reply.id}
          className='rounded-lg border border-gray-200 bg-white/70 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900/40'
          style={{ marginLeft: 24 }}
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0 text-sm font-semibold text-gray-800 dark:text-gray-200'>
              <span className='truncate'>{reply.author.nickname || '匿名'}</span>
              {userNickname && reply.author.nickname === userNickname && (
                <span className='ml-2 text-xs font-normal text-gray-500 dark:text-gray-400'>
                  （我）
                </span>
              )}
            </div>
            <div className='shrink-0 text-xs text-gray-500 dark:text-gray-400'>
              {formatArticleDate(reply.created_at)}
            </div>
          </div>

          <div className='mt-2 text-sm wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
            {reply.status === 'deleted'
              ? '[内容已删除]'
              : reply.status === 'hidden'
                ? '[内容已隐藏]'
                : reply.content}
          </div>

          <div className='mt-2 flex items-center gap-3 text-xs'>
            <button
              type='button'
              onClick={() => {
                if (!userRole) {
                  setShowLoginDialog(true);
                  return;
                }
                setReplyToId(reply.id);
              }}
              className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            >
              回复
            </button>

            {isAdmin && reply.status !== 'deleted' && (
              <>
                {reply.status !== 'hidden' ? (
                  <button
                    type='button'
                    onClick={() => handleStatusChange(reply.id, 'hidden')}
                    className='text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
                  >
                    隐藏
                  </button>
                ) : (
                  <button
                    type='button'
                    onClick={() => handleStatusChange(reply.id, 'visible')}
                    className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                  >
                    显示
                  </button>
                )}
                <button
                  type='button'
                  onClick={() => {
                    if (window.confirm('确定要删除这条评论吗？')) {
                      void handleStatusChange(reply.id, 'deleted');
                    }
                  }}
                  className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                >
                  删除
                </button>
              </>
            )}
            {reply.status === 'deleted' && (
              <span className='text-red-500 dark:text-red-400'>已删除</span>
            )}
            {reply.status === 'hidden' && (
              <span className='text-yellow-500 dark:text-yellow-400'>已隐藏</span>
            )}
          </div>
        </div>
      ))}

      {/* Reply form */}
      {replyToId !== null && (
        <div className='rounded-lg border border-gray-200 bg-white/70 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/40'>
          {replyToId !== topic.id && (
            <div className='mb-3 flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200'>
              <div className='min-w-0 truncate'>
                回复 {comments.find((c) => c.id === replyToId)?.author.nickname || '匿名'}
              </div>
              <button
                type='button'
                onClick={() => setReplyToId(null)}
                className='shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                aria-label='取消回复'
              >
                ✕
              </button>
            </div>
          )}

          {!userRole && (
            <div className='mb-3 text-sm text-gray-600 dark:text-gray-400'>登录后可参与讨论。</div>
          )}

          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={userRole ? '写下你的回复…' : '请先登录后发表回复'}
            disabled={!userRole || isSubmitting}
            className='h-24 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'
          />

          {error && <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div>}

          <div className='mt-3 flex items-center justify-end gap-2'>
            <button
              type='button'
              onClick={() => setReplyToId(null)}
              className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            >
              取消
            </button>
            {!userRole ? (
              <button
                type='button'
                onClick={() => setShowLoginDialog(true)}
                className='rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
              >
                登录
              </button>
            ) : null}
            <button
              type='button'
              onClick={() => void handleSubmitReply()}
              disabled={!userRole || isSubmitting}
              className='rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60 dark:bg-green-700 dark:hover:bg-green-600'
            >
              {isSubmitting ? '发送中…' : '发表回复'}
            </button>
          </div>
        </div>
      )}

      {showLoginDialog && (
        <LoginDialog onClose={() => setShowLoginDialog(false)} isMobile={isMobile} />
      )}
    </div>
  );
}
