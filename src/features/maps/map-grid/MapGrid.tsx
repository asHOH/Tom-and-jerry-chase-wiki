'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getMapLevelColors, getMapSizeColors, getMapTypeColors } from '@/lib/design';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useDarkMode } from '@/context/DarkModeContext';
import { type Map, type MapSize, type mapTypes, type studyLevel } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { mapsEdit } from '@/data';

import MapCardDisplay from './MapCardDisplay';

const MAP_TYPE_OPTIONS: mapTypes[] = ['常规地图', '娱乐地图', '广场地图'];
const MAP_SIZE_OPTIONS: MapSize[] = ['微型', '小型', '中型', '大型'];
const MAP_LEVEL_OPTIONS: (studyLevel | '其它')[] = [
  '见习学业',
  '高级学业',
  '特级学业',
  '大师学业',
  '其它',
];

type Props = { description?: string };

export default function MapClient({ description }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<mapTypes[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<MapSize[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<(studyLevel | '其它')[]>([]);
  const [isDarkMode] = useDarkMode();

  const mapsSnapshot = useSnapshot(mapsEdit);
  const filteredMaps = Object.values(mapsSnapshot as Record<string, Map>).filter((map: Map) => {
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(map.type);
    const sizeMatch = selectedSizes.length === 0 || (map.size && selectedSizes.includes(map.size));
    const levelMatch =
      selectedLevels.length === 0 ||
      (map.studyLevelUnlock && selectedLevels.includes(map.studyLevelUnlock)) ||
      (!map.studyLevelUnlock && selectedLevels.includes('其它'));

    return typeMatch && sizeMatch && levelMatch;
  });

  return (
    <CatalogPageShell
      title='地图'
      description={description ?? ''}
      filters={
        <>
          <FilterRow<mapTypes>
            label='地图类型:'
            options={MAP_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => opt}
            getButtonStyle={(name, active) => {
              return active ? getMapTypeColors(name, isDarkMode) : undefined;
            }}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'map')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />

          <FilterRow<MapSize>
            label='地图规模:'
            options={MAP_SIZE_OPTIONS}
            isActive={(size) => selectedSizes.includes(size)}
            onToggle={(size) =>
              setSelectedSizes((prev) =>
                prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
              )
            }
            getOptionLabel={(size) => size}
            getButtonStyle={(size, active) => {
              return active ? getMapSizeColors(size, isDarkMode) : undefined;
            }}
          />

          <FilterRow<studyLevel | '其它'>
            label='解锁等级:'
            options={MAP_LEVEL_OPTIONS}
            isActive={(level) => selectedLevels.includes(level)}
            onToggle={(level) =>
              setSelectedLevels((prev) =>
                prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
              )
            }
            getOptionLabel={(level) => level}
            getButtonStyle={(level, active) => {
              return active ? getMapLevelColors(level, isDarkMode) : undefined;
            }}
          />
        </>
      }
    >
      <div className='auto-fit-grid grid-container grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
        {filteredMaps.map((map) => (
          <div
            key={map.name}
            className='map-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/maps/${encodeURIComponent(map.name)}`} className='block'>
              <MapCardDisplay map={map} />
            </Link>
          </div>
        ))}
      </div>
    </CatalogPageShell>
  );
}
