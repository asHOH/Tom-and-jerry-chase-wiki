'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import type { Mode, ModeTypeList } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Link from '@/components/Link';
import { modesEdit } from '@/data';

import ModeCardDisplay from './ModeCardDisplay';

type Props = { description?: string };

const MODE_TYPE_OPTIONS: ModeTypeList[] = ['经典模式', '休闲模式', '特殊模式'];

export default function ModeClient({ description }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<ModeTypeList[]>([]);

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
          getButtonStyle={(_, active) =>
            active ? { backgroundColor: '#3b82f6', color: '#fff' } : undefined
          }
        />
      }
    >
      <div className='auto-fit-grid grid-container grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
        {filteredModes.map((mode) => (
          <div
            key={mode.name}
            className='mode-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/modes/${encodeURIComponent(mode.name)}`} className='block'>
              <ModeCardDisplay mode={mode} />
            </Link>
          </div>
        ))}
      </div>
    </CatalogPageShell>
  );
}
