'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getBuffTypeColors } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Buff, buffTypelist } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';
import { buffsEdit } from '@/data';

import BuffCardDisplay from './BuffCardDisplay';

// 更新选项以匹配新属性
const INFLUENCE_OPTIONS = ['正面', '负面', '特殊'] as const;

type Props = { description?: string };

export default function BuffClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedInfluences, setSelectedInfluences] = useState<('正面' | '负面' | '特殊')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const buffsSnapshot = useSnapshot(buffsEdit);
  const filteredBuffs = Object.values(buffsSnapshot as Record<string, Buff>).filter(
    (buff: Buff) => {
      let influenceMatch = true;
      if (selectedInfluences.length > 0) {
        // "特殊" means buffs with no influence restriction
        const isNone = selectedInfluences.includes('特殊');
        const isBuff = selectedInfluences.includes('正面');
        const isDebuff = selectedInfluences.includes('负面');
        influenceMatch =
          (isNone && buff.type.includes('特殊')) ||
          (isBuff && buff.type.includes('正面')) ||
          (isDebuff && buff.type.includes('负面'));
      }

      return influenceMatch;
    }
  );

  return (
    <div
      className={
        isMobile
          ? 'mx-auto w-full space-y-1 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>状态和效果</PageTitle>
        <PageDescription>{description ?? ''}</PageDescription>
        {/* Filter Controls */}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl md:px-2'>
          {/* 效果筛选 */}
          <FilterRow<'正面' | '负面' | '特殊'>
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
                ? getBuffTypeColors(
                    { 正面: '正面效果', 负面: '负面效果', 特殊: '特殊效果' }[f] as buffTypelist,
                    isDarkMode
                  )
                : undefined
            }
          />
        </div>
      </header>
      <div
        className={`auto-fit-grid grid-container grid w-full gap-2! ${isMobile ? 'mt-2' : 'mt-8'}`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '150px' : '170px'}, 1fr))`,
        }}
      >
        {filteredBuffs.map((buff) => (
          <div
            key={buff.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
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
