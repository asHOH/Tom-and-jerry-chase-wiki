'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import Button from '@/components/ui/Button';
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
              <Button
                type='button'
                onClick={onSaveDraftAndLeave}
                disabled={isSaving}
                loading={isSaving}
                variant='primary'
                size='sm'
                fullWidth
                className='gap-2'
              >
                保存草稿并离开
              </Button>

              <Button
                type='button'
                onClick={onDiscardAndLeave}
                disabled={isSaving}
                variant='secondary'
                size='sm'
                fullWidth
              >
                放弃修改并离开
              </Button>

              <Button
                type='button'
                onClick={onCancel}
                disabled={isSaving}
                variant='ghost'
                size='sm'
                fullWidth
              >
                取消，继续编辑
              </Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
