'use client';

import { useState } from 'react';
import Link from 'next/link';

import { formatArticleDate } from '@/lib/dateUtils';
import Button from '@/components/ui/Button';

import type { CommentNode } from '../types';
import { ReplyForm } from './ReplyForm';

function AuthorLink({ nickname }: { nickname: string | null }) {
  const displayName = nickname || '匿名';

  if (!nickname) return <span>{displayName}</span>;

  return (
    <Link
      href={`/users/${encodeURIComponent(nickname)}/`}
      className='text-blue-600 hover:underline dark:text-blue-400'
    >
      {displayName}
    </Link>
  );
}

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
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (commentId: string, status: string) => {
    try {
      setError(null);
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
    setError(null);
  };

  return (
    <section id={`comment-${topic.id}`}>
      <hr className='border-border' />

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
                — <AuthorLink nickname={topic.author.nickname} />{' '}
                {formatArticleDate(topic.createdAt)}
              </div>
            </>
          )}

          {/* Topic actions */}
          <div className='mt-2 flex items-center gap-3 text-xs'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => startReply(topic.id)}
              className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            >
              回复
            </Button>

            {isAdmin && topic.status !== 'deleted' && (
              <>
                {topic.status !== 'hidden' ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => handleStatusChange(topic.id, 'hidden')}
                    className='text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
                  >
                    隐藏
                  </Button>
                ) : (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => handleStatusChange(topic.id, 'visible')}
                    className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                  >
                    显示
                  </Button>
                )}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => {
                    if (window.confirm('确定要删除这条评论吗？')) {
                      void handleStatusChange(topic.id, 'deleted');
                    }
                  }}
                  className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                >
                  删除
                </Button>
              </>
            )}
            {topic.status === 'deleted' && (
              <span className='text-red-500 dark:text-red-400'>已删除</span>
            )}
            {topic.status === 'hidden' && (
              <span className='text-yellow-500 dark:text-yellow-400'>已隐藏</span>
            )}
          </div>
          {error && <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div>}
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

        {replyTargetId !== null && (
          <ReplyForm
            scope={scope}
            targetId={targetId}
            parentId={replyTargetId}
            replyToNickname={
              replyTargetId === topic.id ? null : findAuthorInTree(topic, replyTargetId)
            }
            onSuccess={() => {
              setReplyTargetId(null);
              onMutate();
            }}
            onCancel={() => setReplyTargetId(null)}
            isAuthenticated={isAuthenticated}
            className='mt-4 px-4 py-3'
          />
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
              — <AuthorLink nickname={reply.author.nickname} /> {formatArticleDate(reply.createdAt)}
              {userNickname && reply.author.nickname === userNickname && (
                <span className='ml-1'>（我）</span>
              )}
            </div>
          </>
        )}

        {/* Reply actions */}
        <div className='mt-1 flex items-center gap-3 text-xs'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => onReply(reply.id)}
            className='text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          >
            回复
          </Button>

          {isAdmin && !isDeleted && (
            <>
              {!isHidden ? (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => onStatusChange(reply.id, 'hidden')}
                  className='text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200'
                >
                  隐藏
                </Button>
              ) : (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => onStatusChange(reply.id, 'visible')}
                  className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                >
                  显示
                </Button>
              )}
              <Button
                variant='unstyled'
                type='button'
                onClick={() => {
                  if (window.confirm('确定要删除这条评论吗？')) {
                    void onStatusChange(reply.id, 'deleted');
                  }
                }}
                className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
              >
                删除
              </Button>
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
