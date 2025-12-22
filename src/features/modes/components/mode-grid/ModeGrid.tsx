'use client';

import { useState } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Mode, ModeTypeList } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';
import { modes } from '@/data';

import ModeCardDisplay from './ModeCardDisplay';

type Props = { description?: string };

const MODE_TYPE_OPTIONS: ModeTypeList[] = ['经典模式', '休闲模式', '特殊模式'];

export default function ModeClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<ModeTypeList[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredModes = Object.values(modes).filter((mode: Mode) => {
    // 类型筛选 - 处理数组类型
    let typeMatch = true;
    if (selectedTypes.length > 0) {
      if (Array.isArray(mode.type)) {
        // 如果mode.type是数组，只要包含任一选中的类型就匹配
        typeMatch = mode.type.some((type) => selectedTypes.includes(type));
      } else {
        // 如果mode.type是单个字符串，直接检查是否包含
        typeMatch = selectedTypes.includes(mode.type);
      }
    }

    return typeMatch;
  });

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>模式</PageTitle>
        {!isMobile && <PageDescription>{description}</PageDescription>}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          {/* 类型筛选 */}
          <FilterRow<ModeTypeList>
            label='类型筛选:'
            options={MODE_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => opt}
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#3b82f6', color: '#fff' } : undefined
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredModes.map((mode) => (
          <div
            key={mode.name}
            className='mode-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/modes/${encodeURIComponent(mode.name)}`} className='block'>
              <ModeCardDisplay mode={mode} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
