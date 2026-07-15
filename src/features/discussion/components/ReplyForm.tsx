'use client';

import { useState } from 'react';

type ReplyFormProps = {
  scope: string;
  targetId: string;
  parentId: string;
  replyToNickname: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  isAuthenticated: boolean;
};

export function ReplyForm({
  scope,
  targetId,
  parentId,
  replyToNickname,
  onSuccess,
  onCancel,
  isAuthenticated,
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
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
          parentId,
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

      setContent('');
      onSuccess();
    } catch {
      setError('回复失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='rounded-lg border border-gray-200 bg-gray-50/60 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/30'>
      {replyToNickname && (
        <div className='mb-3 flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200'>
          <div className='min-w-0 truncate'>回复 {replyToNickname}</div>
          <button
            type='button'
            onClick={onCancel}
            className='shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            aria-label='取消回复'
          >
            ✕
          </button>
        </div>
      )}

      {!isAuthenticated && (
        <div className='mb-3 text-sm text-gray-600 dark:text-gray-400'>登录后可参与讨论。</div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isAuthenticated ? '写下你的回复…' : '请先登录后发表回复'}
        disabled={!isAuthenticated || isSubmitting}
        maxLength={2000}
        className='h-24 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100'
      />

      {error && <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div>}

      <div className='mt-3 flex justify-end gap-2'>
        <button
          type='button'
          onClick={onCancel}
          className='rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
        >
          取消
        </button>
        <button
          type='button'
          onClick={() => void handleSubmit()}
          disabled={!isAuthenticated || isSubmitting}
          className='rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60 dark:bg-green-700 dark:hover:bg-green-600'
        >
          {isSubmitting ? '发送中…' : '发表回复'}
        </button>
      </div>
    </div>
  );
}
