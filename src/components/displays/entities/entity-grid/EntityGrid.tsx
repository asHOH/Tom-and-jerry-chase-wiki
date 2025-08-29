'use client';

import Link from 'next/link';
import EntityCardDisplay from './EntityCardDisplay';
import { entities } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterLabel from '@/components/ui/FilterLabel';
import { useState } from 'react';
import type { Entitytypelist, Entity } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';

const ITEM_TYPE_OPTIONS: Entitytypelist[] = [
  '道具类',
  '投射物类',
  '召唤物类',
  '平台类',
  'NPC类',
  '其它',
];

export default function EntityClient() {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Entitytypelist[]>([]);
  // Faction: 'cat', 'mouse'
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const allentities = { ...entities['cat'], ...entities['mouse'] }; //connect two parts of entities
  const filteredEntities = Object.values(allentities).filter((entity: Entity) => {
    // 类型筛选
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(entity.entitytype);
    // 阵营筛选
    let factionMatch = true;
    if (selectedFactions.length > 0) {
      const isCat = selectedFactions.includes('cat');
      const isMouse = selectedFactions.includes('mouse');
      factionMatch =
        (isCat && entity.factionId === 'cat') || (isMouse && entity.factionId === 'mouse');
    }
    return typeMatch && factionMatch;
  });

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>衍生物</PageTitle>
        <PageDescription>
          由角色技能衍生出的独立物体，拥有各自独特的属性和作用（该界面更新中）
        </PageDescription>
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
          {/* 阵营筛选 */}
          <div className='filter-section flex justify-center items-center gap-4 flex-wrap'>
            <FilterLabel displayMode='inline'>阵营筛选:</FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex gap-2'>
              {(
                [
                  {
                    key: 'cat' as const,
                    mobileLabel: '猫阵营',
                    label: '猫阵营',
                  },
                  {
                    key: 'mouse' as const,
                    mobileLabel: '鼠阵营',
                    label: '鼠阵营',
                  },
                ] as const
              ).map((faction) => {
                const isActive = selectedFactions.includes(faction.key);
                const factionColors = getFactionButtonColors(faction.key, isDarkMode);
                return (
                  <button
                    type='button'
                    key={faction.key}
                    className={
                      'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none ' +
                      (!isActive
                        ? 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                        : '')
                    }
                    style={
                      isActive && factionColors
                        ? {
                            backgroundColor: factionColors.backgroundColor,
                            color: factionColors.color,
                          }
                        : isActive
                          ? { backgroundColor: '#e6d5f7', color: '#8b5cf6' }
                          : {}
                    }
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
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
      >
        {filteredEntities.map((entity) => (
          <div
            key={entity.name}
            className='character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
          >
            <Link href={`/entities/${encodeURIComponent(entity.name)}`} className='block'>
              <EntityCardDisplay entity={entity} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
