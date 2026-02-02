'use client';

import { useMemo, useState } from 'react';
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
      if (buff.type.includes('效果')) return false;
      return (
        selectedInfluences.length === 0 || selectedInfluences.some((str) => buff.type.includes(str))
      );
    }
  );
  const filteredEffects = Object.values(buffsSnapshot as Record<string, Buff>).filter(
    (buff: Buff) => {
      if (buff.type.includes('状态')) return false;
      return (
        selectedInfluences.length === 0 || selectedInfluences.some((str) => buff.type.includes(str))
      );
    }
  );

  const { nonClassBuffs, classGroups } = useMemo(() => {
    const nonClass: Buff[] = [];
    const groups = new Map<string, Buff[]>();
    const classOrder: string[] = [];

    filteredBuffs.forEach((buff) => {
      if (buff.class) {
        if (!groups.has(buff.class)) {
          groups.set(buff.class, []);
          classOrder.push(buff.class);
        }
        groups.get(buff.class)!.push(buff);
      } else {
        nonClass.push(buff);
      }
    });

    const orderedGroups = classOrder.map((name) => ({
      name,
      buffs: groups.get(name)!,
    }));

    return { nonClassBuffs: nonClass, classGroups: orderedGroups };
  }, [filteredBuffs]);
  const { nonClassEffects, effectClassGroups } = useMemo(() => {
    const nonClass: Buff[] = [];
    const groups = new Map<string, Buff[]>();
    const classOrder: string[] = [];

    filteredEffects.forEach((buff) => {
      if (buff.class) {
        if (!groups.has(buff.class)) {
          groups.set(buff.class, []);
          classOrder.push(buff.class);
        }
        groups.get(buff.class)!.push(buff);
      } else {
        nonClass.push(buff);
      }
    });

    const orderedGroups = classOrder.map((name) => ({
      name,
      buffs: groups.get(name)!,
    }));

    return { nonClassEffects: nonClass, effectClassGroups: orderedGroups };
  }, [filteredEffects]);

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
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl md:px-2'>
          {/* 影响类型 */}
          <FilterRow<'正面' | '负面' | '特殊'>
            label='影响类型:'
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

      {filteredBuffs.length > 0 && (
        <>
          <div className='relative py-4'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
            </div>
            <div className='relative flex justify-center'>
              <h1 className='inline-block bg-gray-100 px-4 text-2xl font-bold dark:bg-gray-900'>
                状态
              </h1>
            </div>
          </div>
          {nonClassBuffs.length > 0 && (
            <div
              className={`auto-fit-grid grid-container grid w-full gap-2! ${isMobile ? 'mt-2' : 'mt-8'}`}
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '150px' : '170px'}, 1fr))`,
              }}
            >
              {nonClassBuffs.map((buff) => (
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
          )}
          {classGroups.length > 0 && (
            <div className={`${isMobile ? 'mt-2' : 'mt-8'} space-y-4`}>
              {classGroups.map((group) => (
                <div
                  key={group.name + '-title'}
                  className='relative mt-5 rounded border border-gray-300 p-2'
                >
                  <div className='absolute -top-5 left-2.5 flex h-5 items-center border border-b-0 border-gray-300 bg-gray-200 px-4 py-0.5 pl-2.5 text-xs font-bold text-gray-800 [clip-path:polygon(0%_0%,calc(100%-12px)_0%,100%_100%,0%_100%)] dark:bg-gray-200'>
                    {group.name}
                  </div>
                  <div
                    key={group.name}
                    className={`auto-fit-grid grid-container grid w-full gap-1!`}
                    style={{
                      gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '150px' : '170px'}, 1fr))`,
                    }}
                  >
                    {group.buffs.map((buff) => (
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
              ))}
            </div>
          )}
        </>
      )}
      {filteredEffects.length > 0 && (
        <>
          <div className='relative py-4'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
            </div>
            <div className='relative flex justify-center'>
              <h1 className='inline-block bg-gray-100 px-4 text-2xl font-bold dark:bg-gray-900'>
                效果
              </h1>
            </div>
          </div>
          {nonClassEffects.length > 0 && (
            <div
              className={`auto-fit-grid grid-container grid w-full gap-2! ${isMobile ? 'mt-2' : 'mt-8'}`}
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '150px' : '170px'}, 1fr))`,
              }}
            >
              {nonClassEffects.map((buff) => (
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
          )}
          {effectClassGroups.length > 0 && (
            <div className={`${isMobile ? 'mt-2' : 'mt-8'} space-y-4`}>
              {effectClassGroups.map((group) => (
                <div
                  key={group.name + '-title'}
                  className='relative mt-5 rounded border border-gray-300 p-2'
                >
                  <div className='absolute -top-5 left-2.5 flex h-5 items-center border border-b-0 border-gray-300 bg-gray-200 px-4 py-0.5 pl-2.5 text-xs font-bold text-gray-800 [clip-path:polygon(0%_0%,calc(100%-12px)_0%,100%_100%,0%_100%)] dark:bg-gray-200'>
                    {group.name}
                  </div>
                  <div
                    key={group.name}
                    className={`auto-fit-grid grid-container grid w-full gap-1!`}
                    style={{
                      gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '150px' : '170px'}, 1fr))`,
                    }}
                  >
                    {group.buffs.map((buff) => (
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
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
