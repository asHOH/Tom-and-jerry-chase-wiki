'use client';

import Link from 'next/link';
import BuffCardDisplay from './BuffCardDisplay';
import { buffs } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterRow from '@/components/ui/FilterRow';
import { useState } from 'react';
import type { Bufftypelist, Buff, Buffclasslist } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { getPositioningTagColors } from '@/lib/design-system';

const ITEM_TYPE_OPTIONS: Bufftypelist[] = ['正面效果', '负面效果', '其它效果'];
const ITEM_CLASS_OPTIONS: Buffclasslist[] = ['基础类', '全局类', '特殊类'];

type Props = { description?: string };

export default function BuffClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Bufftypelist[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Buffclasslist[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => !buff.unuseImage)
    .filter((buff: Buff) => {
      // 类型筛选
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(buff.bufftype);
      const classMatch = selectedClasses.length === 0 || selectedClasses.includes(buff.buffclass);
      return typeMatch && classMatch;
    });

  const unuseImageFilteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => buff.unuseImage)
    .filter((buff: Buff) => {
      // 类型筛选
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(buff.bufftype);
      const classMatch = selectedClasses.length === 0 || selectedClasses.includes(buff.buffclass);
      return typeMatch && classMatch;
    });

  return (
    <div
      className={
        isMobile
          ? 'max-w-3xl mx-auto p-2 space-y-2 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>状态</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filter Controls */}
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
          {/* 范围筛选 */}
          <FilterRow<Buffclasslist>
            label='范围筛选:'
            options={ITEM_CLASS_OPTIONS}
            isActive={(type) => selectedClasses.includes(type)}
            onToggle={(type) =>
              setSelectedClasses((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            //*getOptionLabel={(opt) => (isMobile ? opt.slice(0, 2) : opt)}*/
            //Use PositioningTagColors to avoid creating new colorStyles
            getButtonStyle={(name, active) => {
              const isActive = active;
              const tagColors = getPositioningTagColors(
                { 基础类: '辅助', 全局类: '奶酪', 特殊类: '破局' }[name],
                false,
                false,
                'mouse',
                isDarkMode
              );
              return isActive ? { ...tagColors } : undefined;
            }}
            isDarkMode={isDarkMode}
          />
        </div>
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
            //*getOptionLabel={(opt) => (isMobile ? opt.slice(0, 2) : opt)}*/
            //Use PositioningTagColors to avoid creating new colorStyles
            getButtonStyle={(name, active) => {
              const isActive = active;
              const tagColors = getPositioningTagColors(
                { 正面效果: '救援', 负面效果: '干扰', 其它效果: '砸墙' }[name],
                false,
                false,
                'mouse',
                isDarkMode
              );
              return isActive ? { ...tagColors } : undefined;
            }}
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
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
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
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
