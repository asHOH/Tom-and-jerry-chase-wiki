'use client';

import { useState } from 'react';

import { getMapLevelColors, getMapSizeColors, getMapTypeColors } from '@/lib/design-tokens';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Map, mapTypes } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { maps } from '@/data';

import MapCardDisplay from './MapCardDisplay';

const MAP_TYPE_OPTIONS: mapTypes[] = ['常规地图', '娱乐地图', '广场地图'];

type Props = { description?: string };

export default function MapClient({ description }: Props) {
  // 多选筛选状态
  const [selectedTypes, setSelectedTypes] = useState<mapTypes[]>([]);
  // 地图大小筛选 - 改为小、中、大的顺序
  const [selectedSizes, setSelectedSizes] = useState<('小' | '中' | '大')[]>([]);
  // 解锁等级筛选 - 增加"其它"选项
  const [selectedLevels, setSelectedLevels] = useState<
    ('见习学业' | '高级学业' | '特级学业' | '大师学业' | '其它')[]
  >([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredMaps = Object.values(maps).filter((map: Map) => {
    // 类型筛选
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(map.type);

    // 大小筛选
    const sizeMatch = selectedSizes.length === 0 || (map.size && selectedSizes.includes(map.size));

    // 等级筛选 - 增加对"其它"选项的处理
    const levelMatch =
      selectedLevels.length === 0 ||
      (map.studyLevelUnlock && selectedLevels.includes(map.studyLevelUnlock)) ||
      (!map.studyLevelUnlock && selectedLevels.includes('其它'));

    return typeMatch && sizeMatch && levelMatch;
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
        <PageTitle>地图</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* 筛选器包装器 */}
        <div className='mx-auto w-full max-w-2xl space-y-4 md:px-2'>
          {/* 类型筛选 */}
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
              {
                return active ? getMapTypeColors(name, isDarkMode) : undefined;
              }
            }}
            isDarkMode={isDarkMode}
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

          {/* 大小筛选 - 改为小、中、大的顺序 */}
          <FilterRow<'小' | '中' | '大'>
            label='地图大小:'
            options={['小', '中', '大']}
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
            isDarkMode={isDarkMode}
          />

          {/* 解锁等级筛选 - 增加"其它"选项 */}
          <FilterRow<'见习学业' | '高级学业' | '特级学业' | '大师学业' | '其它'>
            label='解锁等级:'
            options={['见习学业', '高级学业', '特级学业', '大师学业', '其它']}
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
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className={`auto-fit-grid grid-container grid ${isMobile ? '' : 'gap-6'} mt-8`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '240px' : '300px'}, 1fr))`,
        }}
      >
        {filteredMaps.map((map) => (
          <div
            key={map.name}
            className='map-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1 hover:shadow-xl'
          >
            <Link href={`/maps/${encodeURIComponent(map.name)}`} className='block'>
              <MapCardDisplay map={map} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
