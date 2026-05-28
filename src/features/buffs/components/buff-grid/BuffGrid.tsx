'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getBuffTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Buff } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import { buffsEdit } from '@/data';

import BuffCardDisplay from './BuffCardDisplay';

const TYPE_OPTIONS = ['状态', '瞬时效果', '持续效果', '属性'] as const;

type Props = { description?: string };

export default function BuffClient({ description }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<('状态' | '瞬时效果' | '持续效果' | '属性')[]>(
    []
  );
  const [isDarkMode] = useDarkMode();

  const buffsSnapshot = useSnapshot(buffsEdit);
  const allBuffs = Object.values(buffsSnapshot as Record<string, Buff>);
  const filteredAll = allBuffs.filter((buff) => {
    if (selectedTypes.length === 0) return true;
    return selectedTypes.some((t) => buff.type === t);
  });
  const filteredBuffs = filteredAll.filter((buff) => buff.type === '状态');
  const filteredEffects = filteredAll.filter((buff) => buff.type !== '状态');

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
    <CatalogPageShell
      title='状态和效果'
      description={description ?? ''}
      filters={
        <FilterRow<'状态' | '瞬时效果' | '持续效果' | '属性'>
          label='类型:'
          options={TYPE_OPTIONS}
          isActive={(f) => selectedTypes.includes(f)}
          onToggle={(f) =>
            setSelectedTypes((prev) =>
              prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
            )
          }
          getOptionLabel={(f) => f}
          getButtonStyle={(f, active) => (active ? getBuffTypeColors(f, isDarkMode) : undefined)}
        />
      }
    >
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
          {classGroups.length > 0 && (
            <div className='mt-2 space-y-4 md:mt-8'>
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
                    className='auto-fit-grid grid-container grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-1! md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'
                  >
                    {group.buffs.map((buff) => (
                      <div
                        key={buff.name}
                        className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
                      >
                        <BuffCardDisplay buff={buff} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {nonClassBuffs.length > 0 && (
            <div className='auto-fit-grid grid-container mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2! md:mt-8 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
              {nonClassBuffs.map((buff) => (
                <div
                  key={buff.name}
                  className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
                >
                  <BuffCardDisplay buff={buff} />
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
                效果&属性
              </h1>
            </div>
          </div>
          {effectClassGroups.length > 0 && (
            <div className='mt-2 space-y-4 md:mt-8'>
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
                    className='auto-fit-grid grid-container grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-1! md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'
                  >
                    {group.buffs.map((buff) => (
                      <div
                        key={buff.name}
                        className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
                      >
                        <BuffCardDisplay buff={buff} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {nonClassEffects.length > 0 && (
            <div className='auto-fit-grid grid-container mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2! md:mt-8 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
              {nonClassEffects.map((buff) => (
                <div
                  key={buff.name}
                  className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
                >
                  <BuffCardDisplay buff={buff} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </CatalogPageShell>
  );
}
