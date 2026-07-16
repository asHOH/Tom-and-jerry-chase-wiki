import type { InteractiveMapConfig, MapPointCategory } from '@/data/types';

import {
  ALWAYS_VISIBLE_CATEGORIES,
  DEFAULT_VISIBLE_CATEGORIES,
  MAP_CATEGORY_LABELS,
} from './mapUtils';

type FilterPanelProps = {
  config: InteractiveMapConfig;
  visibleCategories: Set<MapPointCategory>;
  hiddenSubtypes: Set<string>;
  subtypes: string[];
  onToggleCategory: (category: MapPointCategory) => void;
  onToggleSubtype: (subtype: string) => void;
};

export default function FilterPanel({
  config,
  visibleCategories,
  hiddenSubtypes,
  subtypes,
  onToggleCategory,
  onToggleSubtype,
}: FilterPanelProps) {
  return (
    <details className='absolute right-3 bottom-3 z-500 max-h-[55%] w-48 overflow-auto rounded-lg bg-slate-900/95 text-sm text-white shadow-xl'>
      <summary className='cursor-pointer px-3 py-2 font-medium'>点位筛选</summary>
      <div className='space-y-2 border-t border-white/10 p-3'>
        {(Object.keys(MAP_CATEGORY_LABELS) as MapPointCategory[]).map((category) => {
          const isAlwaysVisible = ALWAYS_VISIBLE_CATEGORIES.has(category);
          const isDefaultVisible = DEFAULT_VISIBLE_CATEGORIES.has(category);
          const hasSupportedPoint = config.points.some((point) => point.category === category);
          return (
            <label key={category} className='flex items-center gap-2'>
              <input
                type='checkbox'
                checked={isAlwaysVisible || visibleCategories.has(category)}
                disabled={
                  isAlwaysVisible ||
                  (!hasSupportedPoint && !isDefaultVisible && category !== 'teleport')
                }
                onChange={() => onToggleCategory(category)}
              />
              <span>{MAP_CATEGORY_LABELS[category]}</span>
              {isAlwaysVisible && <span className='text-xs text-white/55'>常驻</span>}
            </label>
          );
        })}
        {subtypes.length > 0 && (
          <div className='border-t border-white/10 pt-2'>
            <p className='mb-1 text-xs text-white/60'>子类型</p>
            {subtypes.map((subtype) => (
              <label key={subtype} className='flex items-center gap-2 py-0.5'>
                <input
                  type='checkbox'
                  checked={!hiddenSubtypes.has(subtype)}
                  onChange={() => onToggleSubtype(subtype)}
                />
                {subtype}
              </label>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
