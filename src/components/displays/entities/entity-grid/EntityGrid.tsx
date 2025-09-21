'use client';

import Link from 'next/link';
import EntityCardDisplay from './EntityCardDisplay';
import { entities } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import { useState } from 'react';
import type { Entitytypelist, Entity } from '@/data/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';
import FilterRow from '@/components/ui/FilterRow';
import { getPositioningTagColors } from '@/lib/design-system';

const ITEM_TYPE_OPTIONS: Entitytypelist[] = [
  '道具类',
  '投射物类',
  '召唤物类',
  '平台类',
  'NPC类',
  '其它',
];

type Props = { description?: string };

export default function EntityClient({ description }: Props) {
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
        <PageTitle>衍生物</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
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
            getOptionLabel={(opt) => (isMobile ? opt.slice(0, 3) : opt)}
            getButtonStyle={(name, active) => {
              const isActive = active;
              const tagColors = getPositioningTagColors(
                {
                  道具类: '救援',
                  投射物类: '辅助',
                  召唤物类: '破局',
                  平台类: '砸墙',
                  NPC类: '干扰',
                  其它: '奶酪',
                }[name],
                false,
                false,
                'mouse',
                isDarkMode
              );
              return isActive ? { ...tagColors } : undefined;
            }}
            isDarkMode={isDarkMode}
          />

          {/* 阵营筛选 */}
          <FilterRow<'cat' | 'mouse'>
            label='阵营筛选:'
            options={['cat', 'mouse']}
            isActive={(f) => selectedFactions.includes(f)}
            onToggle={(f) =>
              setSelectedFactions((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              )
            }
            getOptionLabel={(f) =>
              isMobile ? (f === 'cat' ? '猫阵营' : '鼠阵营') : f === 'cat' ? '猫阵营' : '鼠阵营'
            }
            getButtonStyle={(f, active) =>
              active ? getFactionButtonColors(f, isDarkMode) : undefined
            }
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
