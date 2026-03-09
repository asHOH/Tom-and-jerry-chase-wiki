'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFactionButtonColors, getPositioningTagColors } from '@/lib/design';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Entity, Entitytypelist } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { entitiesEdit } from '@/data';

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
  const [selectedTypes, setSelectedTypes] = useState<Entitytypelist[]>([]);
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse' | 'other')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  function searchTypeIn(entity: Entity): boolean {
    if (typeof entity.entitytype == 'string') {
      return selectedTypes.includes(entity.entitytype);
    }

    return entity.entitytype
      .map((type) => {
        return selectedTypes.includes(type);
      })
      .includes(true);
  }

  const entitiesSnapshot = useSnapshot(entitiesEdit);
  const filteredEntities = Object.values(entitiesSnapshot as Record<string, Entity>).filter(
    (entity: Entity) => {
      const typeMatch = selectedTypes.length === 0 || searchTypeIn(entity);
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
    }
  );

  return (
    <CatalogPageShell
      title='衍生物'
      description={description ?? ''}
      filters={
        <>
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
              return active ? tagColors : undefined;
            }}
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
                return undefined;
              }
              return active ? getFactionButtonColors(f, isDarkMode) : undefined;
            }}
            getButtonClassName={(f, active) =>
              active && f === 'other'
                ? 'bg-gray-400 text-gray-800 border border-gray-400 dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500'
                : ''
            }
          />
        </>
      }
    >
      <div className='auto-fit-grid grid-container grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-4'>
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
    </CatalogPageShell>
  );
}
