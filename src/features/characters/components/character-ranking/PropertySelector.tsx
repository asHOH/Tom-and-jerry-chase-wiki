'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { getFactionButtonColors } from '@/lib/design';
import { FACTION_FULL_NAMES } from '@/constants/factions';
import type { FactionId } from '@/data/types';
import {
  getPropertiesForFaction,
  PropertyInfo,
  RankableProperty,
} from '@/features/characters/utils/ranking';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';

import type { TableColumn } from './tableProperties';

interface PropertySelectorProps {
  currentProperty?: RankableProperty | undefined;
  factionId?: FactionId | undefined;
  view?: 'cards' | 'table';
  tableColumns?: readonly TableColumn[];
  onPropertyChange: (property: RankableProperty) => void;
}

function PropertySelector({
  currentProperty,
  view = 'cards',
  tableColumns = ['rank', 'character', 'rankingValue'],
  onPropertyChange,
}: PropertySelectorProps) {
  const router = useRouter();

  const factionId = (useSearchParams().get('faction') ?? undefined) as FactionId | undefined;

  const availableProperties = getPropertiesForFaction(factionId);

  // Group properties by category
  const commonProperties = availableProperties.filter((prop) => !prop.faction);
  const factionSpecificProperties = availableProperties.filter((prop) => prop.faction);

  const rankingUrl = (property: RankableProperty | undefined, faction: FactionId | undefined) => {
    const params = new URLSearchParams();
    if (faction) params.set('faction', faction);
    if (view === 'table') params.set('view', 'table');
    params.set('layout', 'custom');
    tableColumns.forEach((key) => params.append('column', key));
    const query = params.toString();
    return `${property ? `/ranks/${property}` : '/ranks'}${query ? `?${query}` : ''}`;
  };

  const handlePropertySelect = (property: RankableProperty) => {
    onPropertyChange(property);
    // Update URL without causing page reload
    const url = rankingUrl(property, factionId);
    router.push(url, { scroll: false });
  };

  // Helper to render label with tooltip
  const propertyLabel = (p: PropertyInfo) => (
    <Tooltip content={p.description} className='cursor-pointer border-none'>
      {p.label}
    </Tooltip>
  );

  // Determine if faction-specific properties are shown (inline checks where needed)

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='mb-8 space-y-4 px-4 text-center'>
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          {/* 通用属性 */}
          <FilterRow<RankableProperty>
            label='通用属性:'
            options={commonProperties.map((p) => p.key)}
            isActive={(opt) => currentProperty === opt}
            activeTone='blue'
            onToggle={(opt) => handlePropertySelect(opt)}
            getOptionLabel={(opt) => {
              const p = commonProperties.find((x) => x.key === opt)!;
              return propertyLabel(p);
            }}
          />

          {/* 阵营专属属性 */}
          {factionSpecificProperties.length > 0 && (
            <FilterRow<RankableProperty>
              label={
                factionId === 'cat' || factionId === 'mouse'
                  ? `${FACTION_FULL_NAMES[factionId]}专属:`
                  : '阵营专属:'
              }
              options={factionSpecificProperties.map((p) => p.key)}
              isActive={(opt) => currentProperty === opt}
              activeTone='blue'
              onToggle={(opt) => handlePropertySelect(opt)}
              getOptionLabel={(opt) => {
                const p = factionSpecificProperties.find((x) => x.key === opt)!;
                return propertyLabel(p);
              }}
            />
          )}

          {/* 阵营筛选 */}
          <FilterRow<'all' | FactionId>
            label='阵营筛选:'
            options={['all', 'cat', 'mouse']}
            isActive={(opt) => (opt === 'all' ? !factionId : factionId === opt)}
            onToggle={(opt) => {
              router.push(rankingUrl(currentProperty, opt === 'all' ? undefined : opt));
            }}
            getOptionLabel={(opt) => (opt === 'all' ? '全部角色' : `仅${FACTION_FULL_NAMES[opt]}`)}
            getButtonClassName={(opt, active) =>
              active && opt === 'all'
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-200 dark:text-gray-700'
                : ''
            }
            getOptionColors={(opt) => (opt !== 'all' ? getFactionButtonColors(opt) : undefined)}
            getButtonDisabled={(opt) =>
              opt !== 'all' && factionSpecificProperties.some((p) => p.key === currentProperty)
                ? factionId !== opt
                : false
            }
          />
        </div>
      </header>
    </div>
  );
}

export default PropertySelector;
