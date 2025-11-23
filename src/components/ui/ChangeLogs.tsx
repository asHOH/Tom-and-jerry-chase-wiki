'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { contributors } from '@/data/contributors';
import { changeLogs, type ChangeType } from '@/data/generated/changeLogs';

const typeColors: Record<ChangeType, string> = {
  feat: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  fix: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  docs: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  refactor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  perf: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  test: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  chore: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  revert: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
};

const typeLabels: Record<ChangeType, string> = {
  feat: '新功能',
  fix: '修复',
  docs: '文档',
  style: '样式',
  refactor: '重构',
  perf: '性能',
  test: '测试',
  chore: '杂项',
  revert: '还原',
  other: '其他',
};

export interface ChangeLogsRef {
  openChangeLogs: () => void;
  isOpen: () => boolean;
}

const ChangeLogs = forwardRef<ChangeLogsRef>((_props, ref) => {
  const [isChangeLogsOpen, setIsChangeLogsOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    openChangeLogs: () => setIsChangeLogsOpen(true),
    isOpen: () => isChangeLogsOpen,
  }));

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isChangeLogsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChangeLogsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isChangeLogsOpen]);

  if (!changeLogs || changeLogs.length === 0) {
    return null;
  }

  return (
    <>
      {/* ChangeLogs Button */}
      <button
        type='button'
        onClick={() => setIsChangeLogsOpen(true)}
        className='flex min-w-[180px] flex-col items-center justify-center gap-2 rounded-md border-none bg-gray-200 px-6 py-4 text-center text-gray-800 shadow-md transition-colors duration-200 focus:outline-none dark:border-gray-700 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900'
        aria-label='更新日志'
      >
        <div className='flex items-center gap-3'>
          <svg
            className='h-8 w-8'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth={2}
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
          <span className='text-2xl font-bold whitespace-nowrap'>更新日志</span>
        </div>
        <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>查看网站更新历史</div>
      </button>

      {/* ChangeLogs Modal */}
      {isChangeLogsOpen && (
        <>
          <div
            className='fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm'
            onClick={() => setIsChangeLogsOpen(false)}
            onDoubleClick={(e) => e.stopPropagation()}
            aria-hidden='true'
          />

          <div
            className='fixed inset-5 z-50 flex flex-col overflow-hidden rounded-lg bg-white shadow-xl md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[85vh] md:w-4/5 md:max-w-4xl md:min-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:transform dark:bg-gray-800'
            onDoubleClick={(e) => e.stopPropagation()}
            role='dialog'
            aria-modal='true'
            aria-labelledby='changelogs-title'
          >
            <div className='flex items-center justify-between border-b border-gray-300 p-6 dark:border-gray-700'>
              <h3
                id='changelogs-title'
                className='text-2xl font-bold text-gray-900 dark:text-gray-100'
              >
                更新日志
              </h3>
              <button
                type='button'
                onClick={() => setIsChangeLogsOpen(false)}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                aria-label='关闭更新日志'
              >
                ✕
              </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
              <div className='space-y-3'>
                {changeLogs.map((dailyLog) => {
                  const isExpanded = expandedDates.has(dailyLog.date);
                  return (
                    <div
                      key={dailyLog.date}
                      className='overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'
                    >
                      <button
                        onClick={() => toggleDate(dailyLog.date)}
                        className='flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50'
                        aria-expanded={isExpanded}
                      >
                        <div className='flex items-center gap-3'>
                          <svg
                            className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-400 ${isExpanded ? 'rotate-90' : ''}`}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 5l7 7-7 7'
                            />
                          </svg>
                          <h4 className='text-base font-semibold text-gray-900 dark:text-gray-100'>
                            {new Date(dailyLog.date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h4>
                        </div>
                        <span className='text-sm text-gray-600 dark:text-gray-400'>
                          {dailyLog.changes.length} 项更改
                        </span>
                      </button>

                      {isExpanded && (
                        <div className='border-t border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/30'>
                          <div className='divide-y divide-gray-200 dark:divide-gray-700'>
                            {dailyLog.changes.map((change) => (
                              <div key={change.hash} className='px-4 py-3'>
                                <div className='flex items-start gap-3'>
                                  <span
                                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[change.type]}`}
                                  >
                                    {typeLabels[change.type]}
                                  </span>

                                  <div className='min-w-0 flex-1'>
                                    <div className='flex flex-wrap items-baseline gap-2'>
                                      {change.scope && (
                                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                                          {change.scope}:
                                        </span>
                                      )}
                                      <p className='text-sm text-gray-900 dark:text-gray-100'>
                                        {change.message}
                                      </p>
                                      {change.breaking && (
                                        <span className='inline-flex items-center rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white'>
                                          破坏性
                                        </span>
                                      )}
                                    </div>

                                    {change.author && (
                                      <div className='mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                                        <svg
                                          className='h-3 w-3'
                                          fill='none'
                                          stroke='currentColor'
                                          viewBox='0 0 24 24'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                                          />
                                        </svg>
                                        {contributors.find(({ id }) => change.author === id)
                                          ?.name || change.author}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

ChangeLogs.displayName = 'ChangeLogs';

export default ChangeLogs;
