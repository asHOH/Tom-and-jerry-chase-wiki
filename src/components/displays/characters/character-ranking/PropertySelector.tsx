'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  PropertyInfo,
  getPropertiesForFaction,
  RankableProperty,
} from '@/lib/characterRankingUtils';
import { FactionId } from '@/data/types';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import FilterLabel from '@/components/ui/FilterLabel';

interface PropertySelectorProps {
  currentProperty?: RankableProperty | undefined;
  factionId?: FactionId | undefined;
  onPropertyChange: (property: RankableProperty) => void;
}

// Faction button color utility
function getFactionButtonColors(
  faction: FactionId,
  isDarkMode: boolean
): { backgroundColor: string; color: string } {
  if (faction === 'cat') {
    return isDarkMode
      ? { backgroundColor: '#fbbf24', color: '#000000' } // dark: bright yellow-400 bg, black text
      : { backgroundColor: '#fef9c3', color: '#b45309' }; // light: yellow-100 bg, yellow-800 text
  } else {
    return isDarkMode
      ? { backgroundColor: '#38bdf8', color: '#000000' } // dark: bright sky-400 bg, black text
      : { backgroundColor: '#e0f2fe', color: '#0369a1' }; // light: sky-100 bg, sky-800 text
  }
}

function PropertySelector({ currentProperty, onPropertyChange }: PropertySelectorProps) {
  const router = useRouter();
  const [isDarkMode] = useDarkMode();

  const factionId = (useSearchParams().get('faction') ?? undefined) as FactionId | undefined;

  const availableProperties = getPropertiesForFaction(factionId);

  // Group properties by category
  const commonProperties = availableProperties.filter((prop) => !prop.faction);
  const factionSpecificProperties = availableProperties.filter((prop) => prop.faction);

  const handlePropertySelect = (property: RankableProperty) => {
    onPropertyChange(property);
    // Update URL without causing page reload
    const url = factionId ? `/ranks/${property}?faction=${factionId}` : `/ranks/${property}`;
    router.push(url, { scroll: false });
  };

  // Get property colors - use primary blue for active, following KnowledgeCardGrid style
  const getPropertyColors = (isActive: boolean) => {
    if (isActive) {
      return {
        color: isDarkMode ? '#ffffff' : '#ffffff',
        backgroundColor: isDarkMode ? '#2563eb' : '#2563eb', // blue-600
      };
    }
    return {}; // Return empty object for inactive buttons to use className styling
  };

  // Update button styles to match KnowledgeCardGrid
  const PropertyButton = ({ property }: { property: PropertyInfo }) => {
    const isActive = currentProperty === property.key;
    const colors = getPropertyColors(isActive);

    return (
      /* <Tooltip content={property.description} delay={500}> */
      <button
        type='button'
        onClick={() => handlePropertySelect(property.key)}
        className={clsx(
          'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
          !isActive &&
            'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
        )}
        style={isActive ? { backgroundColor: colors.backgroundColor, color: colors.color } : {}}
      >
        {property.label}
        {property.unit && <span className='ml-1 text-xs opacity-70'>({property.unit})</span>}
      </button>
      /* </Tooltip> */
    );
  };

  // Determine if faction-specific properties are shown
  const isFactionSpecificShown = factionSpecificProperties.some(
    (prop) => prop.key == currentProperty
  );

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        {/* Common Properties */}
        <div className='filter-section flex justify-center items-center gap-4 mt-8'>
          <FilterLabel displayMode='inline'>通用属性:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex flex-wrap gap-2 justify-center'>
            {commonProperties.map((property) => (
              <PropertyButton key={property.key} property={property} />
            ))}
          </div>
        </div>

        {/* Faction-Specific Properties */}
        {factionSpecificProperties.length > 0 && (
          <div className='filter-section flex justify-center items-center gap-4 mt-8'>
            <FilterLabel displayMode='inline'>
              {factionId === 'cat'
                ? '猫阵营专属:'
                : factionId === 'mouse'
                  ? '老鼠阵营专属:'
                  : '阵营专属:'}
            </FilterLabel>
            <FilterLabel displayMode='block'>筛选:</FilterLabel>
            <div className='flex flex-wrap gap-2 justify-center'>
              {factionSpecificProperties.map((property) => (
                <PropertyButton key={property.key} property={property} />
              ))}
            </div>
          </div>
        )}

        {/* Faction Filter Buttons */}
        <div className='filter-section flex justify-center items-center gap-4 mt-8'>
          <FilterLabel displayMode='inline'>阵营筛选:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => {
                const url = currentProperty ? `/ranks/${currentProperty}` : '/ranks';
                router.push(url);
              }}
              className={clsx(
                'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
              )}
            >
              全部角色
            </button>
            {(['cat', 'mouse'] as const).map((factionName) => {
              const factionColor = getFactionButtonColors(factionName, isDarkMode);
              const isActive = factionId === factionName;
              // Disable the other faction button when faction-specific properties are shown
              const isDisabled = isFactionSpecificShown && factionId !== factionName;
              return (
                <button
                  type='button'
                  key={factionName}
                  onClick={() => {
                    if (isDisabled) return;
                    const url = currentProperty
                      ? `/ranks/${currentProperty}?faction=${factionName}`
                      : `/ranks?faction=${factionName}`;
                    router.push(url);
                  }}
                  disabled={isDisabled}
                  className={clsx(
                    'filter-button px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                    !isActive &&
                      'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: factionColor.backgroundColor,
                          color: factionColor.color,
                        }
                      : {}
                  }
                >
                  {factionName === 'cat' ? '仅猫阵营' : '仅老鼠阵营'}
                </button>
              );
            })}
          </div>
        </div>
      </header>
    </div>
  );
}

export default PropertySelector;
