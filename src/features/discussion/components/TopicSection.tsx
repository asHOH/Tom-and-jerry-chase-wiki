'use client';

import { useState } from 'react';

import { formatArticleDate } from '@/lib/dateUtils';
import Button from '@/components/ui/Button';

import type { CommentNode } from '../types';

type TopicSectionProps = {
  topic: CommentNode;
  scope: string;
  targetId: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  userNickname: string | null;
  onMutate: () => void;
  onLoginRequired: () => void;
};

export function TopicSection({
  topic,
  scope,
  targetId,
  isAdmin,
  isAuthenticated,
  userNickname,
  onMutate,
  onLoginRequired,
}: TopicSectionProps) {
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitReply = async (parentId: string) => {
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
        body: JSON.stringify({ scope, targetId, parentId, content: trimmed }),
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
      setReplyTargetId(null);
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

  const startReply = (targetId: string) => {
    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    setReplyTargetId(targetId);
    setReplyContent('');
    setError(null);
  };

  return (
    <section id={`comment-${topic.id}`}>
      <hr className='border-gray-200 dark:border-slate-700' />

      <div className='py-5'>
        {/* Topic heading */}
        <h2
          id={`topic-${topic.id}`}
          className='text-xl font-semibold text-gray-900 dark:text-gray-100'
        >
          {topic.title || '（无标题）'}
        </h2>

        {/* Topic post */}
        <div className='mt-3'>
          {topic.status === 'deleted' ? (
            <div className='text-sm text-gray-400 italic dark:text-gray-500'>[内容已删除]</div>
          ) : topic.status === 'hidden' ? (
            <div className='text-sm text-gray-400 italic dark:text-gray-500'>[内容已隐藏]</div>
          ) : (
            <>
              <div className='text-sm wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                {topic.content}
              </div>
              <div className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                — {topic.author.nickname || '匿名'} {formatArticleDate(topic.createdAt)}
              </div>
            </>
          )}

          {/* Topic actions */}
          <div className='mt-2 flex items-center gap-3 text-xs'>
            <button
              type='button'
              onClick={() => startReply(topic.id)}
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

        {/* Reply tree */}
        {topic.children.length > 0 && (
          <div className='mt-4 space-y-3'>
            {topic.children.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                isAdmin={isAdmin}
                userNickname={userNickname}
                onReply={startReply}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Inline reply form */}
        {replyTargetId !== null && (
          <div className='mt-4 rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/30'>
            {replyTargetId !== topic.id && (
              <div className='mb-3 flex items-center justify-between rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 dark:bg-slate-800 dark:text-gray-300'>
                <span className='truncate'>
                  回复 {findAuthorInTree(topic, replyTargetId) || '匿名'}
                </span>
                <button
                  type='button'
                  onClick={() => setReplyTargetId(null)}
                  className='shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                  aria-label='取消回复'
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder='写下你的回复…'
              maxLength={2000}
              disabled={isSubmitting}
              className='h-24 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500'
            />

            {error && <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div>}

            <div className='mt-3 flex items-center justify-end gap-2'>
              <Button variant='secondary' size='sm' onClick={() => setReplyTargetId(null)}>
                取消
              </Button>
              <Button
                variant='success'
                size='sm'
                onClick={() => void handleSubmitReply(replyTargetId)}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? '发送中…' : '发表回复'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Recursively renders a single reply and its children. */
function ReplyItem({
  reply,
  isAdmin,
  userNickname,
  onReply,
  onStatusChange,
}: {
  reply: CommentNode;
  isAdmin: boolean;
  userNickname: string | null;
  onReply: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const isDeleted = reply.status === 'deleted';
  const isHidden = reply.status === 'hidden';

  return (
    <>
      <div
        id={`comment-${reply.id}`}
        className='text-sm'
        style={{ marginLeft: `${Math.min(reply.depth, 4) * 1.5}rem` }}
      >
        {isDeleted ? (
          <div className='text-gray-400 italic dark:text-gray-500'>[内容已删除]</div>
        ) : isHidden ? (
          <div className='text-gray-400 italic dark:text-gray-500'>[内容已隐藏]</div>
        ) : (
          <>
            <div className='wrap-break-word whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
              {reply.content}
            </div>
            <div className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              — {reply.author.nickname || '匿名'} {formatArticleDate(reply.createdAt)}
              {userNickname && reply.author.nickname === userNickname && (
                <span className='ml-1'>（我）</span>
              )}
            </div>
          </>
        )}

        {/* Reply actions */}
        <div className='mt-1 flex items-center gap-3 text-xs'>
          <button
            type='button'
            onClick={() => onReply(reply.id)}
            className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            回复
          </button>

          {isAdmin && !isDeleted && (
            <>
              {!isHidden ? (
                <button
                  type='button'
                  onClick={() => onStatusChange(reply.id, 'hidden')}
                  className='text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
                >
                  隐藏
                </button>
              ) : (
                <button
                  type='button'
                  onClick={() => onStatusChange(reply.id, 'visible')}
                  className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                >
                  显示
                </button>
              )}
              <button
                type='button'
                onClick={() => {
                  if (window.confirm('确定要删除这条评论吗？')) {
                    void onStatusChange(reply.id, 'deleted');
                  }
                }}
                className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
              >
                删除
              </button>
            </>
          )}
          {isDeleted && <span className='text-red-500 dark:text-red-400'>已删除</span>}
          {isHidden && <span className='text-yellow-500 dark:text-yellow-400'>已隐藏</span>}
        </div>
      </div>

      {/* Recursively render children */}
      {reply.children.map((child) => (
        <ReplyItem
          key={child.id}
          reply={child}
          isAdmin={isAdmin}
          userNickname={userNickname}
          onReply={onReply}
          onStatusChange={onStatusChange}
        />
      ))}
    </>
  );
}

/** Find the author nickname of a comment anywhere in the topic tree. */
function findAuthorInTree(topic: CommentNode, targetId: string): string | null {
  if (topic.id === targetId) return topic.author.nickname;
  const stack = [...topic.children];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (node.id === targetId) return node.author.nickname;
    stack.push(...node.children);
  }
  return null;
}
