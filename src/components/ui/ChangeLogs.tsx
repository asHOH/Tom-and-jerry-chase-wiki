import { changeLogs, type ChangeType } from '@/data/generated/changeLogs';
import { contributors } from '@/data/contributors';

// Type color mapping
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

// Type labels in Chinese
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

export default function ChangeLogs() {
  'use memo';

  if (!changeLogs || changeLogs.length === 0) {
    return (
      <div className='rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800'>
        <p className='text-gray-500 dark:text-gray-400'>暂无更新日志</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {changeLogs.map((dailyLog) => (
        <div
          key={dailyLog.date}
          className='rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'
        >
          {/* Date Header */}
          <div className='border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {new Date(dailyLog.date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </h3>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              共 {dailyLog.changes.length} 项更改
            </p>
          </div>

          {/* Changes List */}
          <div className='divide-y divide-gray-100 dark:divide-gray-700'>
            {dailyLog.changes.map((change) => (
              <div
                key={change.hash}
                className='px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/30'
              >
                <div className='flex items-start gap-3'>
                  {/* Type Badge */}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[change.type]}`}
                  >
                    {typeLabels[change.type]}
                  </span>

                  {/* Content */}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-baseline gap-2'>
                      {/* Scope */}
                      {change.scope && (
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          {change.scope}:
                        </span>
                      )}

                      {/* Message */}
                      <p className='text-sm text-gray-900 dark:text-gray-100'>{change.message}</p>

                      {/* Breaking Change Badge */}
                      {change.breaking && (
                        <span className='inline-flex items-center rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white'>
                          破坏性
                        </span>
                      )}
                    </div>

                    {/* Hash and Author */}
                    <div className='mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400'>
                      {change.author && (
                        <span className='flex items-center gap-1'>
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
                          {contributors.find(({ id }) => change.author === id)?.name ||
                            change.author}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
