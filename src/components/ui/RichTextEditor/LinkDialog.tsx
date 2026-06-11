import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
    if (isOpen) {
      setUrl(initialUrl);
      // Focus input after a short delay to allow animation/rendering
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialUrl]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
    onClose();
  };

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div
        className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'
        role='dialog'
        aria-modal='true'
        aria-labelledby='link-dialog-title'
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
              placeholder='https://example.com'
            />
          </div>
          <div className='flex justify-end space-x-3'>
            <Button type='button' onClick={onClose} variant='secondary'>
              取消
            </Button>
            <Button type='submit'>确认</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
