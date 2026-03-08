'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import type { Fixture, FixtureSourceList, FixtureTypeList } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
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
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#3b82f6', color: '#fff' } : undefined
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
            getButtonStyle={(_, active) =>
              active ? { backgroundColor: '#10b981', color: '#fff' } : undefined
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
      <div
        className='auto-fit-grid grid-container grid gap-4'
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
    </CatalogPageShell>
  );
}
