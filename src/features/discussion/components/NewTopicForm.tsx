'use client';

import { useState } from 'react';

type NewTopicFormProps = {
  scope: string;
  targetId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function NewTopicForm({ scope, targetId, onSuccess, onCancel }: NewTopicFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setError('请输入话题标题');
      return;
    }
    if (!trimmedContent) {
      setError('请输入话题内容');
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
          title: trimmedTitle,
          content: trimmedContent,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        comment?: unknown;
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? '创建话题失败');
        return;
      }

      onSuccess();
    } catch {
      setError('创建话题失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900'>
      <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>新建话题</h3>

      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='话题标题'
        maxLength={200}
        className='w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500'
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder='话题内容'
        maxLength={2000}
        className='mt-3 h-32 w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500'
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
          disabled={isSubmitting}
          className='rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60 dark:bg-green-700 dark:hover:bg-green-600'
        >
          {isSubmitting ? '发布中…' : '发布话题'}
        </button>
      </div>
    </div>
  );
}
