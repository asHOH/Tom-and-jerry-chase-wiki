'use client';

import { useState } from 'react';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { FormInput, FormTextarea } from '@/components/ui/FormControls';
import { CommunityConsent } from '@/components/UserContentConsent';

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
  const [communityRulesAccepted, setCommunityRulesAccepted] = useState(false);

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
    if (!communityRulesAccepted) {
      setError('请先确认讨论发布规则');
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
          communityRulesAccepted: true,
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
    <Card bordered className='mb-8 px-5 py-4'>
      <h3 className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>新建话题</h3>

      <FormInput
        type='text'
        size='sm'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='话题标题'
        maxLength={200}
        className='p-3'
      />

      <FormTextarea
        size='sm'
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder='话题内容'
        maxLength={2000}
        className='mt-3 h-32 resize-none p-3'
      />

      <div className='mt-3'>
        <CommunityConsent
          id='new-topic-community-consent'
          checked={communityRulesAccepted}
          onChange={setCommunityRulesAccepted}
          disabled={isSubmitting}
          compact
        />
      </div>

      {error && <div className='mt-2 text-sm text-red-600 dark:text-red-400'>{error}</div>}

      <div className='mt-3 flex justify-end gap-2'>
        <Button variant='secondary' size='sm' onClick={onCancel}>
          取消
        </Button>
        <Button
          variant='success'
          size='sm'
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !communityRulesAccepted}
          loading={isSubmitting}
        >
          {isSubmitting ? '发布中…' : '发布话题'}
        </Button>
      </div>
    </Card>
  );
}
