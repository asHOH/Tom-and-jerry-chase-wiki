'use client';

import { useEffect, useState } from 'react';

import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { FormTextarea } from '@/components/ui/FormControls';
import { CloseIcon } from '@/components/icons/CommonIcons';

export const THANK_MESSAGE_TEMPLATES = [
  '感谢你认真核对并完善这项内容，你的贡献让资料更加准确。',
  '感谢你为本次版本更新补充资料，也期待你继续参与编辑！',
  '这次修改说明清晰、依据充分，感谢你帮助提升百科内容质量。',
  '感谢你的贡献！这个改动已经帮助我们完善相关条目。',
] as const;

type ThankContributionDialogProps = {
  open: boolean;
  contributionTitle: string;
  submitting?: boolean;
  actionLabel?: string;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export default function ThankContributionDialog({
  open,
  contributionTitle,
  submitting = false,
  actionLabel = '发送感谢',
  onClose,
  onSubmit,
}: ThankContributionDialogProps) {
  const [message, setMessage] = useState<string>(THANK_MESSAGE_TEMPLATES[0]);

  useEffect(() => {
    if (open) setMessage(THANK_MESSAGE_TEMPLATES[0]);
  }, [open, contributionTitle]);

  const normalizedMessage = message.trim();

  return (
    <BaseDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !submitting) onClose();
      }}
      ariaLabelledBy='thank-contribution-title'
      ariaDescribedBy='thank-contribution-description'
      closeOnEsc={!submitting}
      closeOnOutsideClick={!submitting}
      panelClassName='md:h-auto md:max-h-[85vh] md:w-full md:max-w-xl'
    >
      <div className='p-5 sm:p-6'>
        <div className='flex items-start justify-between gap-4'>
          <div>
            <h2
              id='thank-contribution-title'
              className='text-xl font-semibold text-gray-900 dark:text-gray-100'
            >
              感谢编辑者
            </h2>
            <p
              id='thank-contribution-description'
              className='mt-1 text-sm text-gray-500 dark:text-gray-400'
            >
              为 {contributionTitle} 写一段真诚、具体的感谢。
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-8 w-8 shrink-0 p-0'
            aria-label='关闭感谢窗口'
            disabled={submitting}
            onClick={onClose}
          >
            <CloseIcon className='size-5' />
          </Button>
        </div>

        <div className='mt-5'>
          <div className='mb-2 text-sm font-medium text-gray-700 dark:text-gray-200'>常用模板</div>
          <div className='grid gap-2 sm:grid-cols-2'>
            {THANK_MESSAGE_TEMPLATES.map((template, index) => (
              <Button
                key={template}
                type='button'
                variant={message === template ? 'primary' : 'secondary'}
                size='sm'
                className='h-auto min-h-10 justify-start py-2 text-left whitespace-normal'
                disabled={submitting}
                onClick={() => setMessage(template)}
              >
                {index + 1}. {template}
              </Button>
            ))}
          </div>
        </div>

        <div className='mt-5'>
          <div className='mb-2 flex items-center justify-between gap-3'>
            <label
              htmlFor='thank-contribution-message'
              className='text-sm font-medium text-gray-700 dark:text-gray-200'
            >
              感谢内容
            </label>
            <span className='text-xs text-gray-500 dark:text-gray-400'>{message.length} / 500</span>
          </div>
          <FormTextarea
            id='thank-contribution-message'
            value={message}
            maxLength={500}
            rows={5}
            disabled={submitting}
            className='resize-y'
            placeholder='写下对这次贡献的具体感谢…'
            onChange={(event) => setMessage(event.target.value)}
          />
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            模板只是起点，可以根据这次贡献自由修改。
          </p>
        </div>

        <div className='mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <Button type='button' variant='secondary' disabled={submitting} onClick={onClose}>
            取消
          </Button>
          <Button
            type='button'
            variant='primary'
            loading={submitting}
            disabled={submitting || !normalizedMessage}
            onClick={() => onSubmit(normalizedMessage)}
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
