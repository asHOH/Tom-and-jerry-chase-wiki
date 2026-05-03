'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/design';
import { useWikiHistory } from '@/hooks/useWikiHistory';
import { SingleItem, WikiChangeType } from '@/data/types';

function formatHistoryChangeText(type: WikiChangeType, description: string) {
  const trimmedDescription = description.trim();

  if (!trimmedDescription) {
    return type;
  }

  if (trimmedDescription.startsWith(type)) {
    return trimmedDescription;
  }

  return `${type} ${trimmedDescription}`;
}

export default function SingleItemWikiHistoryDisplay({ singleItem }: { singleItem: SingleItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const history = useWikiHistory([singleItem]);
  const currentYear = new Date().getFullYear();

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;

      const parseDate = (dateStr: string) => {
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

  const historySummary = useMemo(() => {
    return Object.values(WikiChangeType)
      .map((type) => ({
        type,
        count: sortedHistory.reduce(
          (count, historyEntry) => (historyEntry.type === type ? count + 1 : count),
          0
        ),
      }))
      .filter(({ count }) => count > 0);
  }, [sortedHistory]);

  if (sortedHistory.length === 0) {
    return null;
  }

  return (
    <div className='mt-2 text-xs text-gray-400 dark:text-gray-500'>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex items-center gap-1 transition-colors hover:text-gray-600 dark:hover:text-gray-300'
        aria-expanded={isExpanded}
      >
        <span>Wiki历史记录</span>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
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
              {historySummary.map(({ type, count }) => (
                <li key={type}>
                  <strong>{type}: </strong>
                  {count}
                </li>
              ))}
            </ul>
          </li>
          {sortedHistory.map((entry, index) => (
            <li
              key={`${entry.year}-${entry.date}-${entry.type}`}
              className={cn(
                'grid grid-cols-[3.25rem_auto_1fr] items-baseline gap-x-1',
                index === 0 && 'text-blue-600 dark:text-blue-400'
              )}
            >
              <span className='contents'>
                <strong className='text-right'>
                  {entry.year === currentYear ? entry.date : `${entry.year}.${entry.date}`}
                </strong>
                <span> - </span>
                <span>{formatHistoryChangeText(entry.type, entry.description)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
