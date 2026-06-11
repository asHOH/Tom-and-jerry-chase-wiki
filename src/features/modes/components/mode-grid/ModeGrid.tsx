'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getModeTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Mode, ModeTypeList } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import { VirtualGrid } from '@/components/ui/VirtualGrid';
import { modesEdit } from '@/data';

import ModeCardDisplay from './ModeCardDisplay';

type Props = { description?: string };

const MODE_TYPE_OPTIONS: ModeTypeList[] = ['经典模式', '休闲模式', '特殊模式'];

export default function ModeClient({ description }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<ModeTypeList[]>([]);
  const [isDarkMode] = useDarkMode();

  const modesSnapshot = useSnapshot(modesEdit);
  const filteredModes = Object.values(modesSnapshot as Record<string, Mode>).filter(
    (mode: Mode) => {
      let typeMatch = true;
      if (selectedTypes.length > 0) {
        if (Array.isArray(mode.type)) {
          typeMatch = mode.type.some((type) => selectedTypes.includes(type));
        } else {
          typeMatch = selectedTypes.includes(mode.type);
        }
      }

      return typeMatch;
    }
  );

  const modeCardNodes = useMemo(() => {
    return filteredModes.map((mode) => (
      <div
        key={mode.name}
        className='mode-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
      >
        <ModeCardDisplay mode={mode} />
      </div>
    ));
  }, [filteredModes]);

  return (
    <CatalogPageShell
      title='游戏模式'
      description={description}
      descriptionVisibility='desktop'
      filters={
        <FilterRow<ModeTypeList>
          label='类型筛选:'
          options={MODE_TYPE_OPTIONS}
          isActive={(type) => selectedTypes.includes(type)}
          onToggle={(type) =>
            setSelectedTypes((prev) =>
              prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
            )
          }
          getOptionLabel={(opt) => opt}
          getButtonStyle={(type, active) =>
            active ? getModeTypeColors(type, isDarkMode) : undefined
          }
        />
      }
    >
      <VirtualGrid
        items={modeCardNodes}
        rowClassName='auto-fit-grid grid-container grid'
        minItemWidth={120}
        gapPx={16}
        estimatedRowHeight={210}
      />
    </CatalogPageShell>
  );
}
