'use client';

import { useState } from 'react';

import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Fixture, FixtureSourceList, FixtureTypeList } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { fixtures } from '@/data';

import FixtureCardDisplay from './FixtureCardDisplay';

type Props = { description?: string };

const FIXTURE_TYPE_OPTIONS: FixtureTypeList[] = [
  '平台类',
  '地面类',
  '墙壁类',
  '物件类',
  'NPC',
  '可交互',
];

const FIXTURE_SOURCE_OPTIONS: FixtureSourceList[] = ['通用组件', '地图特色组件'];

export default function FixtureClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<FixtureTypeList[]>([]);
  const [selectedSources, setSelectedSources] = useState<FixtureSourceList[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredFixtures = Object.values(fixtures).filter((fixture: Fixture) => {
    // 类型筛选 - 处理数组类型
    let typeMatch = true;
    if (selectedTypes.length > 0) {
      if (Array.isArray(fixture.type)) {
        // 如果fixture.type是数组，只要包含任一选中的类型就匹配
        typeMatch = fixture.type.some((type) => selectedTypes.includes(type));
      } else {
        // 如果fixture.type是单个字符串，直接检查是否包含
        typeMatch = selectedTypes.includes(fixture.type);
      }
    }

    // 来源筛选
    const sourceMatch =
      selectedSources.length === 0 || (fixture.source && selectedSources.includes(fixture.source));

    return typeMatch && sourceMatch;
  });

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>地图组件</PageTitle>
        <PageDescription>{description}</PageDescription>
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          {/* 类型筛选 */}
          <FilterRow<FixtureTypeList>
            label='类型筛选:'
            options={FIXTURE_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => (isMobile ? opt.slice(0, 2) : opt)}
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#3b82f6', color: '#fff' } : undefined
            }
            isDarkMode={isDarkMode}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'fixture')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />

          {/* 来源筛选 */}
          <FilterRow<FixtureSourceList>
            label='来源筛选:'
            options={FIXTURE_SOURCE_OPTIONS}
            isActive={(source) => selectedSources.includes(source)}
            onToggle={(source) =>
              setSelectedSources((prev) =>
                prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
              )
            }
            getOptionLabel={(opt) => (isMobile ? opt.slice(0, 2) : opt)}
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#10b981', color: '#fff' } : undefined
            }
            isDarkMode={isDarkMode}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'fixture')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredFixtures.map((fixture) => (
          <div
            key={fixture.name}
            className='fixture-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/fixtures/${encodeURIComponent(fixture.name)}`} className='block'>
              <FixtureCardDisplay fixture={fixture} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
