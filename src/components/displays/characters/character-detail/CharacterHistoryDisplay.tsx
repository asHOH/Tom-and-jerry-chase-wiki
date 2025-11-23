import { useMemo, useState } from 'react';
import { ChangeType } from '@/data/types';

import { getHistory } from '@/lib/historyUtils';

export default function CharacterHistoryDisplay({
  name,
  aliases,
}: {
  name: string;
  aliases: readonly string[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const history = useMemo(() => getHistory([name, ...aliases]), [name, aliases]);

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

  function getCount(type: ChangeType) {
    return sortedHistory.reduce((count, history) => (history.type == type ? count + 1 : count), 0);
  }

  return (
    <div className='mt-2 text-xs text-gray-400 dark:text-gray-500'>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex items-center gap-1 transition-colors hover:text-gray-600 dark:hover:text-gray-300'
        aria-expanded={isExpanded}
      >
        <span>角色历史记录</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {isExpanded && (
        <ul className='mt-2 space-y-1 pl-2'>
          <li>
            <ul className='flex gap-1'>
              {Object.values(ChangeType).map((value) => (
                <li key={value}>
                  <strong>{value}: </strong>
                  {getCount(value)}
                </li>
              ))}
            </ul>
          </li>
          {sortedHistory.map((entry, index) => (
            <li
              key={`${entry.year}-${entry.date}-${entry.type}`}
              className={index === 0 ? 'text-blue-600 dark:text-blue-400' : ''}
            >
              <strong>
                {entry.year}.{entry.date} ({entry.season})
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
