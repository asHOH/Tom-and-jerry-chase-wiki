'use client';

import { useState } from 'react';
import Link from 'next/link';

import { getBuffTypeColors } from '@/lib/design';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { useEditableDomain } from '@/hooks/useEditableGameData';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import { buffs } from '@/data/static';
import type { Buff } from '@/data/types';
import { CatalogGridItem } from '@/components/ui/CatalogGrid';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';

import BuffCardDisplay from './BuffCardDisplay';

const TYPE_OPTIONS = ['状态', '瞬时效果', '持续效果', '属性'] as const;

type BuffSectionProps = {
  title: string;
  buffs: Buff[];
};

function BuffSection({ title, buffs }: BuffSectionProps) {
  const nonClass: Buff[] = [];
  const groups = new Map<string, Buff[]>();
  buffs.forEach((buff) => {
    if (buff.class) {
      const group = groups.get(buff.class);
      if (group) group.push(buff);
      else groups.set(buff.class, [buff]);
    } else {
      nonClass.push(buff);
    }
  });

  return (
    <>
      <div className='relative py-4'>
        <div className='absolute inset-0 flex items-center'>
          <div className='border-border w-full border-t'></div>
        </div>
        <div className='relative flex justify-center'>
          <h2 className='bg-background inline-block px-4 text-2xl font-bold'>{title}</h2>
        </div>
      </div>
      {groups.size > 0 && (
        <div className='mt-2 space-y-4 md:mt-8'>
          {[...groups].map(([name, groupBuffs]) => (
            <div key={name + '-title'} className='border-border relative mt-5 rounded border p-2'>
              <div className='border-border bg-surface-muted text-foreground absolute -top-5 left-2.5 flex h-5 items-center border border-b-0 px-4 py-0.5 pl-2.5 text-xs font-bold [clip-path:polygon(0%_0%,calc(100%-12px)_0%,100%_100%,0%_100%)]'>
                {name}
              </div>
              <div
                key={name}
                className='auto-fit-grid grid-container grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-1! md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'
              >
                {groupBuffs.map((buff) => (
                  <CatalogGridItem key={buff.name} clip>
                    <BuffCardDisplay buff={buff} />
                  </CatalogGridItem>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {nonClass.length > 0 && (
        <div className='auto-fit-grid grid-container mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2! md:mt-8 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
          {nonClass.map((buff) => (
            <CatalogGridItem key={buff.name} clip>
              <BuffCardDisplay buff={buff} />
            </CatalogGridItem>
          ))}
        </div>
      )}
    </>
  );
}

type Props = {
  description?: string;
  data?: PublishedGameDataByType['buffs'];
  publishedRevision?: `v1:${string}`;
};

export default function BuffClient({ description, data = buffs, publishedRevision }: Props) {
  usePublishedRevision(publishedRevision);
  const [selectedTypes, setSelectedTypes] = useState<('状态' | '瞬时效果' | '持续效果' | '属性')[]>(
    []
  );

  const [buffsSnapshot] = useEditableDomain('buffs', data);
  const allBuffs = Object.values(buffsSnapshot as Record<string, Buff>);
  const filteredAll = allBuffs.filter((buff) => {
    if (selectedTypes.length === 0) return true;
    return selectedTypes.some((t) => buff.type === t);
  });
  const filteredBuffs = filteredAll.filter((buff) => buff.type === '状态');
  const filteredEffects = filteredAll.filter((buff) => buff.type !== '状态');

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
          getOptionColors={getBuffTypeColors}
        />
      }
    >
      {/* 提示栏：界面迭代信息 */}
      <div className='border-border bg-surface-sunken mb-4 rounded-md border p-3 text-sm text-gray-700 dark:text-gray-300'>
        <span>该界面部分内容已迭代，具体可查阅 </span>
        <Link
          href='/mechanics/buff/'
          className='font-medium text-blue-600 underline decoration-blue-400 underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
        >
          状态效果机制页
        </Link>
        <span>。</span>
      </div>

      {filteredBuffs.length > 0 && <BuffSection title='状态' buffs={filteredBuffs} />}
      {filteredEffects.length > 0 && <BuffSection title='效果&属性' buffs={filteredEffects} />}
    </CatalogPageShell>
  );
}
