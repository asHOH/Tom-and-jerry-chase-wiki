'use client';

import { useState } from 'react';

import { getFactionButtonColors } from '@/lib/design-system';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Item, Itemsourcelist, Itemtypelist } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { items } from '@/data';

import ItemCardDisplay from './ItemCardDisplay';

type Props = { description?: string };

const ITEM_TYPE_OPTIONS: Itemtypelist[] = [
  '投掷类',
  '手持类',
  '物件类',
  '食物类',
  '流程类',
  '特殊类',
];
const ITEM_SOURCE_OPTIONS: Itemsourcelist[] = ['常规道具', '地图道具'];

export default function ItemClient({ description }: Props) {
  // Multi-select state for filters
  const [selectedTypes, setSelectedTypes] = useState<Itemtypelist[]>([]);
  const [selectedSources, setSelectedSources] = useState<Itemsourcelist[]>([]);
  // Faction: 'cat', 'mouse', 'none' (none = 不受阵营限制)
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse' | 'none')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const filteredItems = Object.values(items).filter((item: Item) => {
    // 类型筛选
    const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(item.itemtype);
    // 来源筛选
    const sourceMatch = selectedSources.length === 0 || selectedSources.includes(item.itemsource);
    // 阵营筛选
    let factionMatch = true;
    if (selectedFactions.length > 0) {
      // "none" means items with no faction restriction (item.factionId is null/undefined/"none")
      const isNone = selectedFactions.includes('none');
      const isCat = selectedFactions.includes('cat');
      const isMouse = selectedFactions.includes('mouse');
      factionMatch =
        (isNone && item.factionId == null) ||
        (isCat && item.factionId === 'cat') ||
        (isMouse && item.factionId === 'mouse');
    }
    return typeMatch && sourceMatch && factionMatch;
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
        <PageTitle>道具</PageTitle>
        {!isMobile && <PageDescription>{description}</PageDescription>}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          {/* 类型筛选 */}
          <FilterRow<Itemtypelist>
            label='类型筛选:'
            options={ITEM_TYPE_OPTIONS}
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
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'item')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />

          {/* 来源筛选 */}
          <FilterRow<Itemsourcelist>
            label='来源筛选:'
            options={ITEM_SOURCE_OPTIONS}
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
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'item')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
          />

          {/* 阵营筛选 */}
          <FilterRow<'cat' | 'mouse' | 'none'>
            label='阵营筛选:'
            options={['cat', 'mouse', 'none']}
            isActive={(f) => selectedFactions.includes(f)}
            onToggle={(f) =>
              setSelectedFactions((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              )
            }
            getOptionLabel={(f) =>
              isMobile
                ? f === 'cat'
                  ? '猫专用'
                  : f === 'mouse'
                    ? '鼠专用'
                    : '通用'
                : f === 'cat'
                  ? '猫阵营专用'
                  : f === 'mouse'
                    ? '鼠阵营专用'
                    : '通用'
            }
            getButtonStyle={(f, active) =>
              active
                ? f === 'none'
                  ? { backgroundColor: '#e6d5f7', color: '#8b5cf6' }
                  : getFactionButtonColors(f as 'cat' | 'mouse', isDarkMode)
                : undefined
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredItems.map((item) => (
          <div
            key={item.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/items/${encodeURIComponent(item.name)}`} className='block'>
              <ItemCardDisplay item={item} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
