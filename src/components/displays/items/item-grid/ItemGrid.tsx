'use client';

import Link from 'next/link';
import ItemCardDisplay from './ItemCardDisplay';
import { items } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterLabel from '@/components/ui/FilterLabel';
import { useState } from 'react';
import type { Itemtypelist, Itemsourcelist, Item } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';

const ITEM_TYPE_OPTIONS: Itemtypelist[] = [
  '投掷类',
  '手持类',
  '物件类',
  '食物类',
  '流程类',
  '其它',
];
const ITEM_SOURCE_OPTIONS: Itemsourcelist[] = ['常规道具', '地图道具', '技能道具'];

export default function ItemClient() {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Itemtypelist[]>([]);
  const [selectedSources, setSelectedSources] = useState<Itemsourcelist[]>([]);
  // Faction: 'cat', 'mouse', 'none' (none = 不受阵营限制)
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse' | 'none')[]>([]);
  const isMobile = useMobile();

  const filteredItems = Object.values(items).filter((item: Item) => {
    // 类型筛选
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.itemtype);
    // 来源筛选
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(item.itemsource);
    // 阵营筛选
    let factionMatch = true;
    if (selectedFactions.length > 0) {
      // "none" means items with no faction restriction (item.factionId is null/undefined/"none")
      const isNone = selectedFactions.includes('none');
      const isCat = selectedFactions.includes('cat');
      const isMouse = selectedFactions.includes('mouse');
      factionMatch =
        (isNone && item.factionId == null) ||
        (isCat && item.factionId === 'cat') ||
        (isMouse && item.factionId === 'mouse');
    }
    return typeMatch && sourceMatch && factionMatch;
  });

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>道具</PageTitle>
        <PageDescription>拾取并投掷可对敌方造成伤害等效果——猫鼠相互对抗的关键机制</PageDescription>
        {/* Filter Controls */}
        <div className='flex flex-col gap-4 mt-8'>
          {/* 类型筛选 */}
          <div className='filter-section flex justify-center items-center gap-4 flex-wrap'>
            <FilterLabel displayMode='inline'>类型筛选:</FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex gap-2'>
              {ITEM_TYPE_OPTIONS.map((type) => {
                const isActive = selectedTypes.includes(type);
                return (
                  <button
                    type='button'
                    key={type}
                    className={`filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedTypes((prev) =>
                        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
                      );
                    }}
                  >
                    {isMobile ? type.slice(0, 2) : type}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 来源筛选 */}
          <div className='filter-section flex justify-center items-center gap-4 flex-wrap'>
            <FilterLabel displayMode='inline'>来源筛选:</FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex gap-2'>
              {ITEM_SOURCE_OPTIONS.map((source) => {
                const isActive = selectedSources.includes(source);
                return (
                  <button
                    type='button'
                    key={source}
                    className={`filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedSources((prev) =>
                        prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
                      );
                    }}
                  >
                    {isMobile ? source.slice(0, 2) : source}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 阵营筛选 */}
          <div className='filter-section flex justify-center items-center gap-4 flex-wrap'>
            <FilterLabel displayMode='inline'>阵营筛选:</FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex gap-2'>
              {[
                {
                  key: 'cat' as const,
                  mobileLabel: '猫阵营',
                  label: '猫阵营专用',
                  color: 'bg-yellow-400 text-black dark:bg-yellow-400 dark:text-black',
                },
                {
                  key: 'mouse' as const,
                  mobileLabel: '鼠阵营',
                  label: '鼠阵营专用',
                  color: 'bg-sky-400 text-black dark:bg-sky-400 dark:text-black',
                },
                {
                  key: 'none' as const,
                  mobileLabel: '通用',
                  label: '通用',
                  color: 'bg-purple-500 text-white dark:bg-purple-500 dark:text-white',
                },
              ].map((faction) => {
                const isActive = selectedFactions.includes(faction.key);
                return (
                  <button
                    type='button'
                    key={faction.key}
                    className={`filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none ${
                      isActive
                        ? faction.color
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedFactions((prev) =>
                        prev.includes(faction.key)
                          ? prev.filter((f) => f !== faction.key)
                          : [...prev, faction.key]
                      );
                    }}
                  >
                    {isMobile ? faction.mobileLabel : faction.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
        {filteredItems.map((item) => (
          <Link key={item.name} href={`/items/${encodeURIComponent(item.name)}`} className='flex'>
            <ItemCardDisplay item={item} />
          </Link>
        ))}
      </div>
    </div>
  );
}
