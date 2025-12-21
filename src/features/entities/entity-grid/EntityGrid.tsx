'use client';

import { useState } from 'react';

import { getFactionButtonColors, getPositioningTagColors } from '@/lib/design-system';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Entity, Entitytypelist } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { entities } from '@/data';

import getEntityFactionId from '../lib/getEntityFactionId';
import EntityCardDisplay from './EntityCardDisplay';

const ITEM_TYPE_OPTIONS: Entitytypelist[] = [
  '拾取物',
  '投射物',
  '召唤物',
  'NPC',
  '变身类',
  '平台类',
  '指示物',
];

type Props = { description?: string };

export default function EntityClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Entitytypelist[]>([]);
  // Faction: 'cat', 'mouse', 'other'
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse' | 'other')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  //search if selectedTypes includes any entitytype
  function searchTypeIn(entity: Entity): boolean {
    if (typeof entity.entitytype == 'string') {
      return selectedTypes.includes(entity.entitytype);
    } else {
      return entity.entitytype
        .map((type) => {
          return selectedTypes.includes(type);
        })
        .includes(true);
    }
  }

  const allentities = { ...entities['cat'], ...entities['mouse'] }; //connect two parts of entities
  const filteredEntities = Object.values(allentities).filter((entity: Entity) => {
    // 类型筛选
    const typeMatch = selectedTypes.length === 0 || searchTypeIn(entity);
    // 阵营筛选
    let factionMatch = true;
    if (selectedFactions.length > 0) {
      const isCat = selectedFactions.includes('cat');
      const isMouse = selectedFactions.includes('mouse');
      const isOther = selectedFactions.includes('other');
      const entityFaction = getEntityFactionId(entity);

      factionMatch =
        (isCat && entityFaction === 'cat') ||
        (isMouse && entityFaction === 'mouse') ||
        (isOther && entityFaction !== 'cat' && entityFaction !== 'mouse');
    }
    return typeMatch && factionMatch;
  });

  return (
    <div
      className={
        isMobile
          ? 'max-w-1xl mx-auto space-y-1 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>衍生物</PageTitle>
        <PageDescription>{description ?? ''}</PageDescription>
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          {/* 类型筛选 */}
          <FilterRow<Entitytypelist>
            label='类型筛选:'
            options={ITEM_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => opt}
            getButtonStyle={(name, active) => {
              const isActive = active;
              const tagColors = getPositioningTagColors(
                {
                  拾取物: '救援',
                  投射物: '辅助',
                  召唤物: '破局',
                  NPC: '干扰',
                  变身类: '奶酪',
                  平台类: '砸墙',
                  指示物: '后期',
                }[name],
                false,
                false,
                'mouse',
                isDarkMode
              );
              return isActive ? { ...tagColors } : undefined;
            }}
            isDarkMode={isDarkMode}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'entity')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />

          {/* 阵营筛选 */}
          <FilterRow<'cat' | 'mouse' | 'other'>
            label='阵营筛选:'
            options={['cat', 'mouse', 'other']}
            isActive={(f) => selectedFactions.includes(f)}
            onToggle={(f) =>
              setSelectedFactions((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              )
            }
            getOptionLabel={(f) => {
              if (isMobile) {
                return f === 'cat' ? '猫阵营' : f === 'mouse' ? '鼠阵营' : '其它';
              }
              return f === 'cat' ? '猫阵营' : f === 'mouse' ? '鼠阵营' : '其它';
            }}
            getButtonStyle={(f, active) => {
              if (f === 'other') {
                // 为"其它"阵营定义样式
                return active
                  ? {
                      backgroundColor: isDarkMode ? '#6b7280' : '#9ca3af',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937',
                      borderColor: isDarkMode ? '#6b7280' : '#9ca3af',
                    }
                  : undefined;
              }
              return active ? getFactionButtonColors(f, isDarkMode) : undefined;
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
        {filteredEntities.map((entity) => (
          <div
            key={entity.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
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
