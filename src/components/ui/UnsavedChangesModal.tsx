'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { CloseIcon } from '@/components/icons/CommonIcons';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveDraftAndLeave: () => void;
  onDiscardAndLeave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function UnsavedChangesModal({
  isOpen,
  onSaveDraftAndLeave,
  onDiscardAndLeave,
  onCancel,
  isSaving = false,
}: UnsavedChangesModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the modal
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onCancel]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          className='fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm'
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
          role='dialog'
          aria-modal='true'
          aria-labelledby='unsaved-changes-title'
        >
          <m.div
            ref={modalRef}
            tabIndex={-1}
            className='mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl outline-none dark:bg-slate-800'
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={shouldReduceMotion ? { scale: 1, opacity: 0 } : { scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className='mb-4 flex items-start justify-between'>
              <div>
                <h2
                  id='unsaved-changes-title'
                  className='text-lg font-semibold text-gray-900 dark:text-white'
                >
                  未保存的修改
                </h2>
                <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                  您有未保存的编辑内容，是否确定离开？
                </p>
              </div>
              <button
                type='button'
                onClick={onCancel}
                className='rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300'
                aria-label='关闭'
              >
                <CloseIcon className='h-5 w-5' />
              </button>
            </div>

            {/* Warning icon */}
            <div className='mb-4 flex items-center gap-3 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20'>
              <svg
                className='h-5 w-5 shrink-0 text-amber-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={2}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                />
              </svg>
              <span className='text-sm text-amber-700 dark:text-amber-300'>
                离开后，未保存的修改将会丢失
              </span>
            </div>

            {/* Actions */}
            <div className='flex flex-col gap-2'>
              <button
                type='button'
                onClick={onSaveDraftAndLeave}
                disabled={isSaving}
                className='flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600'
              >
                {isSaving ? (
                  <>
                    <svg className='h-4 w-4 animate-spin' fill='none' viewBox='0 0 24 24'>
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    保存中...
                  </>
                ) : (
                  <>
                    <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4'
                      />
                    </svg>
                    保存草稿并离开
                  </>
                )}
              </button>

              <button
                type='button'
                onClick={onDiscardAndLeave}
                disabled={isSaving}
                className='w-full rounded-md bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
              >
                放弃修改并离开
              </button>

              <button
                type='button'
                onClick={onCancel}
                disabled={isSaving}
                className='w-full rounded-md px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-400 dark:hover:text-gray-200'
              >
                取消，继续编辑
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
