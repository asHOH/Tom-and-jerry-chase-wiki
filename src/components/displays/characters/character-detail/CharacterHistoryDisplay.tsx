import { getHistory } from '@/lib/historyUtils';
import { useMemo, useState } from 'react';
import { ChangeType } from '@/data/types';

export default function CharacterHistoryDisplay({ name }: { name: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const history = useMemo(() => getHistory(name), [name]);

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      // Sort by year descending
      if (a.year !== b.year) return b.year - a.year;

      // Parse dates and compare (handle "7.24" format and range formats like "12.25-次年1.1")
      const parseDate = (dateStr: string) => {
        // Take only the first date if it's a range
        const firstDate = dateStr.split('-')[0] || dateStr;
        const parts = firstDate.split('.').map(Number);
        return { month: parts[0] || 0, day: parts[1] || 0 };
      };

      const aDate = parseDate(a.date);
      const bDate = parseDate(b.date);

      if (aDate.month !== bDate.month) return bDate.month - aDate.month;
      return bDate.day - aDate.day;
    });
  }, [history]);

  const getTypeText = (type: 'new' | ChangeType): string => {
    if (type === 'new') return '上线';
    // ChangeType enum values are already in Chinese
    return type;
  };

  // Don't render if there's no history
  if (sortedHistory.length === 0) {
    return null;
  }

  return (
    <div className='text-xs text-gray-400 dark:text-gray-500 mt-2'>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
        aria-expanded={isExpanded}
      >
        <span>角色历史记录</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {isExpanded && (
        <ul className='mt-2 space-y-1 pl-2'>
          {sortedHistory.map((entry, index) => (
            <li
              key={`${entry.year}-${entry.date}-${entry.type}`}
              className={index === 0 ? 'text-blue-600 dark:text-blue-400' : ''}
            >
              <strong>
                {entry.year}.{entry.date}
              </strong>
              {' - '}
              {getTypeText(entry.type)}
              {entry.description ? `: ${entry.description}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
