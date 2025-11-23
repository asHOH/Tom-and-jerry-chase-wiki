import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

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
            <input
              ref={inputRef}
              type='text'
              id='link-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder='https://example.com'
              className={clsx(
                'w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                'dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
              )}
            />
          </div>
          <div className='flex justify-end space-x-3'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            >
              取消
            </button>
            <button
              type='submit'
              className='rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:bg-blue-500 dark:hover:bg-blue-600'
            >
              确认
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
