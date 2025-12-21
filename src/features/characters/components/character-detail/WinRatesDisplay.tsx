'use client';

import { useMemo, useState } from 'react';

import { CharacterWinRateEntry, getCharacterWinRates } from '@/data/winRates';

interface WinRatesDisplayProps {
  characterName: string;
}

export default function WinRatesDisplay({ characterName }: WinRatesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const winRates = useMemo(() => getCharacterWinRates(characterName), [characterName]);

  const groupedByTimeRange = useMemo(() => {
    const groups: Record<string, CharacterWinRateEntry[]> = {};
    for (const entry of winRates) {
      const arr = groups[entry.timeRange] ?? (groups[entry.timeRange] = []);
      arr.push(entry);
    }
    return groups;
  }, [winRates]);

  if (winRates.length === 0) {
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
        <span>胜率数据</span>
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
        <div className='mt-2 space-y-3 pl-2'>
          {Object.entries(groupedByTimeRange).map(([timeRange, entries]) => (
            <div key={timeRange}>
              <div className='mb-1 font-medium text-gray-500 dark:text-gray-400'>{timeRange}</div>
              <ul className='space-y-1'>
                {entries.map((entry, index) => (
                  <li key={`${entry.rank}-${index}`} className='flex flex-wrap gap-x-2'>
                    <span className='text-gray-500 dark:text-gray-400'>{entry.rank}</span>
                    <span>
                      胜率:{' '}
                      <strong className='text-blue-600 dark:text-blue-400'>{entry.winRate}</strong>
                    </span>
                    <span>
                      选用: <strong>{entry.pickRate}</strong>
                    </span>
                    {entry.banRate && (
                      <span>
                        禁用: <strong>{entry.banRate}</strong>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
