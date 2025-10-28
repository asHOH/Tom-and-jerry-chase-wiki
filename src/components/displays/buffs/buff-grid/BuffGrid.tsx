'use client';

import Link from 'next/link';
import BuffCardDisplay from './BuffCardDisplay';
import { buffs } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterRow from '@/components/ui/FilterRow';
import { useState } from 'react';
import type { Buff } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { getPositioningTagColors } from '@/lib/design-system';

// 更新选项以匹配新属性
const GLOBAL_OPTIONS = ['全局', '个人'] as const;
const INFLUENCE_OPTIONS = ['正面', '负面', '其它'] as const;

type Props = { description?: string };

export default function BuffClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedGlobal, setSelectedGlobal] = useState<('全局' | '个人')[]>([]);
  const [selectedInfluences, setSelectedInfluences] = useState<('正面' | '负面' | '其它')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => !buff.unuseImage)
    .filter((buff: Buff) => {
      const globalMatch =
        selectedGlobal.length === 0 ||
        (selectedGlobal.includes('全局') && buff.global) ||
        (selectedGlobal.includes('个人') && !buff.global);

      let influenceMatch = true;
      if (selectedInfluences.length > 0) {
        // "其它" means buffs with no influence restriction
        const isNone = selectedInfluences.includes('其它');
        const isBuff = selectedInfluences.includes('正面');
        const isDebuff = selectedInfluences.includes('负面');
        influenceMatch =
          (isNone && buff.isbuff == undefined) ||
          (isBuff && buff.isbuff === true) ||
          (isDebuff && buff.isbuff === false);
      }

      return globalMatch && influenceMatch;
    });

  const unuseImageFilteredBuffs = Object.values(buffs)
    .filter((buff: Buff) => buff.unuseImage)
    .filter((buff: Buff) => {
      const globalMatch =
        selectedGlobal.length === 0 ||
        (selectedGlobal.includes('全局') && buff.global) ||
        (selectedGlobal.includes('个人') && !buff.global);

      let influenceMatch = true;
      if (selectedInfluences.length > 0) {
        // "其它" means buffs with no influence restriction
        const isNone = selectedInfluences.includes('其它');
        const isBuff = selectedInfluences.includes('正面');
        const isDebuff = selectedInfluences.includes('负面');
        influenceMatch =
          (isNone && buff.isbuff == undefined) ||
          (isBuff && buff.isbuff === true) ||
          (isDebuff && buff.isbuff === false);
      }

      return globalMatch && influenceMatch;
    });

  return (
    <div
      className={
        isMobile
          ? 'max-w-1xl mx-auto space-y-1 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>状态和效果</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filter Controls */}
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
          {/* 效果筛选 */}
          <FilterRow<'正面' | '负面' | '其它'>
            label='效果筛选:'
            options={INFLUENCE_OPTIONS}
            isActive={(f) => selectedInfluences.includes(f)}
            onToggle={(f) =>
              setSelectedInfluences((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              )
            }
            getOptionLabel={(f) => f}
            getButtonStyle={(f, active) =>
              active
                ? f === '其它'
                  ? { backgroundColor: '#e6d5f7', color: '#8b5cf6' }
                  : getPositioningTagColors(
                      { 正面: '救援', 负面: '干扰' }[f],
                      false,
                      false,
                      'mouse',
                      isDarkMode
                    )
                : undefined
            }
            isDarkMode={isDarkMode}
          />
          {/* 全局筛选 */}
          <FilterRow<'全局' | '个人'>
            label='全局筛选:'
            options={GLOBAL_OPTIONS}
            isActive={(type) => selectedGlobal.includes(type)}
            onToggle={(type) =>
              setSelectedGlobal((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            //Use PositioningTagColors to avoid creating new colorStyles
            getButtonStyle={(name, active) => {
              const isActive = active;
              const tagColors = getPositioningTagColors(
                { 全局: '干扰', 个人: '辅助' }[name],
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
        className={`auto-fit-grid grid-container grid ${isMobile ? '' : 'gap-4'} mt-8`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '120px' : '150px'}, 1fr))`,
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
        className='auto-fit-grid grid-container grid gap-4 mt-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '240px' : '300px'}, 1fr))`,
        }}
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
