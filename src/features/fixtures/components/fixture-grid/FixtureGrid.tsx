'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFixtureSourceColors, getFixtureTypeColors } from '@/lib/design';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Fixture, FixtureSourceList, FixtureTypeList } from '@/data/types';
import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';
import { fixturesEdit } from '@/data';

import FixtureCardDisplay from './FixtureCardDisplay';

type Props = { description?: string };

const FIXTURE_TYPE_OPTIONS: FixtureTypeList[] = [
  '平台类',
  '地面类',
  '墙壁类',
  '组件类',
  '流程类',
  'NPC',
  '可交互',
];

const FIXTURE_SOURCE_OPTIONS: FixtureSourceList[] = ['通用组件', '地图组件', '模式组件'];

export default function FixtureClient({ description }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<FixtureTypeList[]>([]);
  const [selectedSources, setSelectedSources] = useState<FixtureSourceList[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const fixturesSnapshot = useSnapshot(fixturesEdit);
  const filteredFixtures = Object.values(fixturesSnapshot as Record<string, Fixture>).filter(
    (fixture: Fixture) => {
      let typeMatch = true;
      if (selectedTypes.length > 0) {
        if (Array.isArray(fixture.type)) {
          typeMatch = fixture.type.some((type) => selectedTypes.includes(type));
        } else {
          typeMatch = selectedTypes.includes(fixture.type);
        }
      }

      const sourceMatch =
        selectedSources.length === 0 ||
        (fixture.source && selectedSources.includes(fixture.source));

      return typeMatch && sourceMatch;
    }
  );

  const fixtureCardNodes = useMemo(() => {
    return filteredFixtures.map((fixture) => (
      <CatalogGridItem key={fixture.name} clip>
        <FixtureCardDisplay fixture={fixture} />
      </CatalogGridItem>
    ));
  }, [filteredFixtures]);

  return (
    <CatalogPageShell
      title='地图组件'
      description={description}
      filters={
        <>
          <FilterRow<FixtureTypeList>
            label='类型筛选:'
            options={FIXTURE_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => (isMobile ? opt.slice(0, 3) : opt)}
            getButtonStyle={(type, active) =>
              active ? getFixtureTypeColors(type, isDarkMode) : undefined
            }
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
            getButtonStyle={(source, active) =>
              active ? getFixtureSourceColors(source, isDarkMode) : undefined
            }
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
        </>
      }
    >
      <CatalogGrid
        items={fixtureCardNodes}
        minItemWidth={150}
        mobileMinItemWidth={110}
        estimatedRowHeight={240}
        mobileEstimatedRowHeight={180}
      />
    </CatalogPageShell>
  );
}
