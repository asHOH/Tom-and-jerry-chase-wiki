import React, { useEffect, useRef, useState } from 'react';

import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormControls';

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
  initialUrl?: string;
}

export default function LinkDialog({
  isOpen,
  onClose,
  onSubmit,
  initialUrl = '',
}: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setUrl(initialUrl);
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
    onClose();
  };

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      ariaLabelledBy='link-dialog-title'
      closeOnEsc={false}
      closeOnOutsideClick={false}
      lockScroll={false}
      panelClassName='inset-auto top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 p-6'
    >
      <h2
        id='link-dialog-title'
        className='mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100'
      >
        插入链接
      </h2>
      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label
            htmlFor='link-url'
            className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'
          >
            链接地址
          </label>
          <FormInput
            ref={inputRef}
            type='text'
            id='link-url'
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder='/characters/汤姆/ 或 https://example.com'
          />
          <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
            站内链接可填写以“/”开头的路径，例如 /characters/汤姆/；发布后会使用站内客户端跳转。
          </p>
        </div>
        <div className='flex justify-end space-x-3'>
          <Button onClick={onClose} variant='secondary'>
            取消
          </Button>
          <Button type='submit'>确认</Button>
        </div>
      </form>
    </BaseDialog>
  );
}
