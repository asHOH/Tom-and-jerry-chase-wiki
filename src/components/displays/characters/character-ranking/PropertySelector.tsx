'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  PropertyInfo,
  getPropertiesForFaction,
  RankableProperty,
} from '@/lib/characterRankingUtils';
import { FactionId } from '@/data/types';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';

interface PropertySelectorProps {
  currentProperty?: RankableProperty | undefined;
  factionId?: FactionId | undefined;
  onPropertyChange: (property: RankableProperty) => void;
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

  // Helper to render label with tooltip
  const propertyLabel = (p: PropertyInfo) => (
    <Tooltip content={p.description} className='border-none cursor-pointer'>
      {p.label}
    </Tooltip>
  );

  // Determine if faction-specific properties are shown (inline checks where needed)

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
          {/* 通用属性 */}
          <FilterRow<RankableProperty>
            label='通用属性:'
            options={commonProperties.map((p) => p.key)}
            isActive={(opt) => currentProperty === opt}
            onToggle={(opt) => handlePropertySelect(opt)}
            getOptionLabel={(opt) => {
              const p = commonProperties.find((x) => x.key === opt)!;
              return propertyLabel(p);
            }}
            getButtonStyle={(_, active) => (active ? getPropertyColors(true) : undefined)}
            isDarkMode={isDarkMode}
          />

          {/* 阵营专属属性 */}
          {factionSpecificProperties.length > 0 && (
            <FilterRow<RankableProperty>
              label={
                factionId === 'cat'
                  ? '猫阵营专属:'
                  : factionId === 'mouse'
                    ? '鼠阵营专属:'
                    : '阵营专属:'
              }
              options={factionSpecificProperties.map((p) => p.key)}
              isActive={(opt) => currentProperty === opt}
              onToggle={(opt) => handlePropertySelect(opt)}
              getOptionLabel={(opt) => {
                const p = factionSpecificProperties.find((x) => x.key === opt)!;
                return propertyLabel(p);
              }}
              getButtonStyle={(_, active) => (active ? getPropertyColors(true) : undefined)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* 阵营筛选 */}
          <FilterRow<'all' | 'cat' | 'mouse'>
            label='阵营筛选:'
            options={['all', 'cat', 'mouse']}
            isActive={(opt) => (opt === 'all' ? !factionId : factionId === opt)}
            onToggle={(opt) => {
              if (opt === 'all') {
                const url = currentProperty ? `/ranks/${currentProperty}` : '/ranks';
                router.push(url);
              } else {
                const url = currentProperty
                  ? `/ranks/${currentProperty}?faction=${opt}`
                  : `/ranks?faction=${opt}`;
                router.push(url);
              }
            }}
            getOptionLabel={(opt) =>
              opt === 'all' ? '全部角色' : opt === 'cat' ? '仅猫阵营' : '仅鼠阵营'
            }
            getButtonStyle={(opt, active) =>
              active
                ? opt === 'all'
                  ? { backgroundColor: '#e5e7eb', color: '#374151' } // gray look for "all"
                  : getFactionButtonColors(opt, isDarkMode)
                : undefined
            }
            getButtonDisabled={(opt) =>
              opt !== 'all' && factionSpecificProperties.some((p) => p.key === currentProperty)
                ? factionId !== opt
                : false
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
    </div>
  );
}

export default PropertySelector;
