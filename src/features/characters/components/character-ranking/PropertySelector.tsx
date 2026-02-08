'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { getFactionButtonColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { FactionId } from '@/data/types';
import {
  getPropertiesForFaction,
  PropertyInfo,
  RankableProperty,
} from '@/features/characters/utils/ranking';
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

  // Helper to render label with tooltip
  const propertyLabel = (p: PropertyInfo) => (
    <Tooltip content={p.description} className='cursor-pointer border-none'>
      {p.label}
    </Tooltip>
  );

  // Determine if faction-specific properties are shown (inline checks where needed)

  return (
    <div className='space-y-8 dark:text-slate-200'>
      <header className='mb-8 space-y-4 px-4 text-center'>
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
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
            getButtonClassName={(_, active) =>
              active ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : ''
            }
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
              getButtonClassName={(_, active) =>
                active ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : ''
              }
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
            getButtonClassName={(opt, active) =>
              active && opt === 'all'
                ? 'bg-gray-200 text-gray-700 dark:bg-gray-200 dark:text-gray-700'
                : ''
            }
            getButtonStyle={(opt, active) =>
              active && opt !== 'all' ? getFactionButtonColors(opt, isDarkMode) : undefined
            }
            getButtonDisabled={(opt) =>
              opt !== 'all' && factionSpecificProperties.some((p) => p.key === currentProperty)
                ? factionId !== opt
                : false
            }
          />
        </div>
      </header>
    </div>
  );
}

export default PropertySelector;
