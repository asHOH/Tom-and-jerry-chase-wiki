'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { CheckBadgeIcon, CloseIcon, TrashIcon } from '@/components/icons/CommonIcons';

export interface EditModeToolbarProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Number of changes made */
  actionCount: number;
  /** Draft info for current entity */
  draftInfo?: { actionCount: number } | null;
  /** Whether publish is in progress */
  isPublishing: boolean;
  /** Called when user clicks discard */
  onDiscard: () => void;
  /** Called when user clicks publish */
  onPublish: (message?: string) => Promise<void>;
  /** Called when user wants to exit edit mode */
  onExitEditMode: () => void;
  /** Entity display name for better UX */
  entityName?: string;
}

export default function EditModeToolbar({
  isDirty,
  actionCount,
  draftInfo = null,
  isPublishing,
  onDiscard,
  onPublish,
  onExitEditMode,
  entityName,
}: EditModeToolbarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const handlePublish = async () => {
    if (showMessageInput) {
      await onPublish(publishMessage || undefined);
      setPublishMessage('');
      setShowMessageInput(false);
      onExitEditMode();
    } else {
      setShowMessageInput(true);
    }
  };

  const handleDiscard = () => {
    if (isDirty) {
      if (isConfirmingDiscard) {
        onDiscard();
        setIsConfirmingDiscard(false);
        onExitEditMode();
      } else {
        setIsConfirmingDiscard(true);
        // Auto-reset after 3 seconds
        setTimeout(() => setIsConfirmingDiscard(false), 3000);
      }
    } else {
      onExitEditMode();
    }
  };

  const draftLabel = draftInfo ? `草稿：${draftInfo.actionCount} 条修改` : null;

  const toolbarContent = (
    <m.div
      className='fixed bottom-4 left-1/2 z-9999 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2'
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className='rounded-xl bg-white/95 px-4 py-3 shadow-lg ring-1 ring-gray-200 backdrop-blur-sm dark:bg-slate-800/95 dark:ring-slate-700'>
        {/* Header with edit status */}
        <div className='mb-3 flex items-center justify-between text-sm'>
          <div className='flex items-center gap-2'>
            <span className='inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500' />
            <span className='font-medium text-gray-900 dark:text-white'>
              编辑模式
              {entityName && (
                <span className='ml-1 text-gray-500 dark:text-gray-400'>· {entityName}</span>
              )}
            </span>
          </div>
          <span className='text-gray-500 dark:text-gray-400'>
            {draftLabel || (actionCount > 0 ? `${actionCount} 条修改` : '暂无修改')}
          </span>
        </div>

        {/* Publish message input */}
        <AnimatePresence>
          {showMessageInput && (
            <m.div
              className='mb-3'
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className='relative'>
                <textarea
                  className='w-full resize-none rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400'
                  rows={2}
                  placeholder='描述您的修改内容（可选）'
                  value={publishMessage}
                  onChange={(e) => setPublishMessage(e.target.value)}
                  disabled={isPublishing}
                />
                <button
                  type='button'
                  onClick={() => {
                    setShowMessageInput(false);
                    setPublishMessage('');
                  }}
                  className='absolute top-1 right-1 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-600 dark:hover:text-gray-300'
                  aria-label='取消'
                >
                  <CloseIcon className='h-4 w-4' />
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className='flex items-center gap-2'>
          {/* Discard */}
          <button
            type='button'
            onClick={handleDiscard}
            disabled={isPublishing}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isConfirmingDiscard
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600',
              isPublishing && 'cursor-not-allowed opacity-60'
            )}
            title={isDirty ? '放弃修改' : '退出编辑'}
          >
            {isDirty ? (
              <>
                <TrashIcon size={16} strokeWidth={2} />
                <span className='hidden sm:inline'>
                  {isConfirmingDiscard ? '确认放弃？' : '放弃'}
                </span>
              </>
            ) : (
              <>
                <CloseIcon className='h-4 w-4' strokeWidth={2} />
                <span className='hidden sm:inline'>退出</span>
              </>
            )}
          </button>

          {/* Spacer */}
          <div className='flex-1' />

          {/* Publish */}
          <button
            type='button'
            onClick={handlePublish}
            disabled={!isDirty || isPublishing}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              isDirty && !isPublishing
                ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                : 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-500'
            )}
          >
            {isPublishing ? (
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
                <span>发布中...</span>
              </>
            ) : (
              <>
                <CheckBadgeIcon size={16} strokeWidth={2} />
                <span>{showMessageInput ? '确认发布' : '发布'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </m.div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(toolbarContent, document.body);
  }

  return null;
}
