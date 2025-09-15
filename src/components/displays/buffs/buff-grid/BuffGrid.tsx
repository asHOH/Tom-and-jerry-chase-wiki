'use client';

import Link from 'next/link';
import BuffCardDisplay from './BuffCardDisplay';
import { buffs } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterRow from '@/components/ui/FilterRow';
import { useState } from 'react';
import type { Bufftypelist, Buff } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';

const ITEM_TYPE_OPTIONS: Bufftypelist[] = ['增益效果', '负面效果'];

export default function BuffClient() {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Bufftypelist[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => !buff.unuseImage)
    .filter((buff: Buff) => {
      // 类型筛选
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(buff.bufftype);
      return typeMatch;
    });

  const unuseImageFilteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => buff.unuseImage)
    .filter((buff: Buff) => {
      // 类型筛选
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(buff.bufftype);
      return typeMatch;
    });

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>状态效果</PageTitle>
        <PageDescription>角色持有的各类状态效果，包括正面和负面效果</PageDescription>
        {/* Filter Controls */}
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
          {/* 类型筛选 */}
          <FilterRow<Bufftypelist>
            label='类型筛选:'
            options={ITEM_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => (isMobile ? opt.slice(0, 2) : opt)}
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#3b82f6', color: '#fff' } : undefined
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 0.5fr))' }}
      >
        {filteredBuffs.map((buff) => (
          <div
            key={buff.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={`/buffs/${encodeURIComponent(buff.name)}`} className='block'>
              <BuffCardDisplay buff={buff} />
            </Link>
          </div>
        ))}
      </div>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 0.5fr))' }}
      >
        {unuseImageFilteredBuffs.map((buff) => (
          <div
            key={buff.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={`/buffs/${encodeURIComponent(buff.name)}`} className='block'>
              <BuffCardDisplay buff={buff} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
