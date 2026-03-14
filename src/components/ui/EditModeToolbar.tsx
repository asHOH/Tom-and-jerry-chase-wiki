'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { AnimatePresence, m, useDragControls, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

import { CheckBadgeIcon, CloseIcon, FolderIcon, TrashIcon } from '@/components/icons/CommonIcons';

export interface EditModeToolbarProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Number of changes made */
  actionCount: number;
  /** Draft info for current entity */
  draftInfo?: { actionCount: number } | null;
  /** Summary of drafts for all entity types */
  draftsSummary?: { entityType: string; entityLabel: string; count: number }[];
  /** Whether publish is in progress */
  isPublishing: boolean;
  /** Called when user clicks discard */
  onDiscard: () => void;
  /** Called when user clicks publish */
  onPublish: (message?: string) => Promise<boolean>;
  /** Called when user wants to exit edit mode */
  onExitEditMode: () => void;
  /** Entity display name for better UX */
  entityName?: string;
}

export default function EditModeToolbar({
  isDirty,
  actionCount,
  draftInfo = null,
  draftsSummary = [],
  isPublishing,
  onDiscard,
  onPublish,
  onExitEditMode,
  entityName,
}: EditModeToolbarProps) {
  const shouldReduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [publishMessage, setPublishMessage] = useState('');
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);
  const discardResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (discardResetTimerRef.current !== null) {
        window.clearTimeout(discardResetTimerRef.current);
      }
      if (typeof document !== 'undefined') {
        document.body.classList.remove('select-none');
      }
    };
  }, []);

  const handlePublish = async () => {
    if (showMessageInput) {
      const didPublish = await onPublish(publishMessage || undefined);
      if (!didPublish) return;
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
        if (discardResetTimerRef.current !== null) {
          window.clearTimeout(discardResetTimerRef.current);
        }
        discardResetTimerRef.current = window.setTimeout(() => {
          setIsConfirmingDiscard(false);
          discardResetTimerRef.current = null;
        }, 3000);
      }
    } else {
      onExitEditMode();
    }
  };

  useEffect(() => {
    if (!isDraftsOpen) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-drafts-dropdown-root]')) return;
      setIsDraftsOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [isDraftsOpen]);

  const totalDraftCount = useMemo(
    () => draftsSummary.reduce((total, item) => total + item.count, 0),
    [draftsSummary]
  );

  const draftLabel = draftInfo ? `草稿：${draftInfo.actionCount} 条修改` : null;
  const draftsButtonLabel = totalDraftCount > 0 ? `草稿(${totalDraftCount})` : '草稿';

  const toolbarContent = (
    <m.div
      className='fixed inset-x-0 bottom-4 z-9999 mx-auto w-[calc(100%-2rem)] max-w-lg'
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      onDragStart={() => document.body.classList.add('select-none')}
      onDragEnd={() => document.body.classList.remove('select-none')}
    >
      <div className='relative rounded-xl bg-white/95 py-3 pr-4 pl-10 shadow-lg ring-1 ring-gray-200 backdrop-blur-sm dark:bg-slate-800/95 dark:ring-slate-700'>
        {/* Drag handle */}
        <div
          className='absolute top-0 bottom-0 left-0 flex w-8 cursor-grab items-center justify-center rounded-l-xl transition-colors hover:bg-gray-100/50 active:cursor-grabbing dark:hover:bg-slate-700/50'
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: 'none' }}
          title='拖动位置'
        >
          <svg
            className='h-4 w-4 text-gray-400 dark:text-gray-500'
            fill='currentColor'
            viewBox='0 0 24 24'
          >
            <circle cx='9' cy='5' r='2' />
            <circle cx='9' cy='12' r='2' />
            <circle cx='9' cy='19' r='2' />
            <circle cx='15' cy='5' r='2' />
            <circle cx='15' cy='12' r='2' />
            <circle cx='15' cy='19' r='2' />
          </svg>
        </div>

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

          {/* Drafts dropdown */}
          <div className='relative' data-drafts-dropdown-root>
            <button
              type='button'
              onClick={() => setIsDraftsOpen((prev) => !prev)}
              disabled={draftsSummary.length === 0}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                draftsSummary.length > 0
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/40'
                  : 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'
              )}
              aria-expanded={isDraftsOpen}
              aria-haspopup='menu'
              aria-label='查看草稿'
              title={draftsSummary.length > 0 ? '查看全部草稿' : '暂无草稿'}
            >
              <FolderIcon size={16} strokeWidth={2} />
              <span className='hidden sm:inline'>{draftsButtonLabel}</span>
            </button>
            <AnimatePresence initial={false}>
              {isDraftsOpen && draftsSummary.length > 0 && (
                <m.div
                  key='drafts-dropdown'
                  className='absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-lg border border-amber-100 bg-white shadow-lg dark:border-amber-900/50 dark:bg-slate-800'
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  style={{ transformOrigin: 'bottom left' }}
                  role='menu'
                >
                  <div className='border-b border-amber-100 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:text-amber-300'>
                    当前草稿
                  </div>
                  <ul className='py-1'>
                    {draftsSummary.map((item) => (
                      <li
                        key={item.entityType}
                        className='px-3 py-2 text-sm text-gray-700 dark:text-gray-200'
                      >
                        <div className='flex items-center justify-between'>
                          <span>{item.entityLabel}</span>
                          <span className='text-amber-600 dark:text-amber-300'>
                            {item.count} 条
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </m.div>
              )}
            </AnimatePresence>
          </div>

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
