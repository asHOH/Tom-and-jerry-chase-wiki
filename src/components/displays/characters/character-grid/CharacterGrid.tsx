'use client';

import { useMemo } from 'react';
import CharacterDisplay from './CharacterDisplay';
import CharacterImport from './CharacterImport';
import { FactionCharactersProps } from '@/lib/types';
import { FactionId, PositioningTagName } from '@/data';
import { useFilterState } from '@/lib/filterUtils';
import { sortPositioningTagNames } from '@/constants/positioningTagSequences';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { getOriginalCharacterIds } from '@/lib/editUtils';
import { characters as allCharacters } from '@/data';
import CharacterCreate from './CharacterCreate';
import { getPositioningTagColors, getAvatarFilterColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterLabel from '@/components/ui/FilterLabel';

export default function CharacterGrid({ faction }: FactionCharactersProps) {
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const [isDarkMode] = useDarkMode();
  const originalCharacterIds = getOriginalCharacterIds();

  const originalCharacters = useMemo(() => {
    return originalCharacterIds
      .map((id) => allCharacters[id])
      .filter((char): char is NonNullable<typeof char> => Boolean(char))
      .filter((char) => char.factionId === faction.id);
  }, [originalCharacterIds, faction.id]);

  const {
    selectedFilters: selectedPositioningTags,
    toggleFilter: togglePositioningTagFilter,
    hasFilter: hasPositioningTagFilter,
  } = useFilterState<PositioningTagName>();

  // Avatar filter (mouse faction only): 杰瑞 / 泰菲 / 其他
  type AvatarOption = '杰瑞' | '泰菲' | '其他';
  const {
    selectedFilters: selectedAvatar,
    toggleFilter: toggleAvatar,
    hasFilter: hasAvatar,
  } = useFilterState<AvatarOption>();

  const uniquePositioningTags = useMemo(() => {
    const tags = new Set<PositioningTagName>();
    Object.values(allCharacters).forEach((character) => {
      if (character.factionId === faction.id) {
        const tagsToAdd =
          (character.factionId === 'cat'
            ? character.catPositioningTags
            : character.mousePositioningTags) || [];
        tagsToAdd.forEach((tag) => {
          tags.add(tag.tagName);
        });
      }
    });
    return sortPositioningTagNames(Array.from(tags), faction.id as FactionId);
  }, [faction.id]);

  const filteredCharacters = useMemo(() => {
    let charactersToFilter = Object.values(allCharacters).filter(
      (char) => char.factionId === faction.id
    );

    // In edit mode, exclude original characters from the main list
    if (isEditMode) {
      charactersToFilter = charactersToFilter.filter(
        (char) => !originalCharacterIds.includes(char.id)
      );
    }

    // Apply avatar filter for mouse faction
    if (faction.id === 'mouse' && selectedAvatar.size > 0) {
      charactersToFilter = charactersToFilter.filter((c) => {
        const name = c.id; // ids are Chinese display names in this project
        const hasJerry = name.includes('杰瑞');
        const hasTuffy = name.includes('泰菲');

        // Determine classification
        const cls: AvatarOption = hasJerry ? '杰瑞' : hasTuffy ? '泰菲' : '其他';
        // If multiple selected, any match passes
        return selectedAvatar.has(cls);
      });
    }

    if (selectedPositioningTags.size === 0) {
      return charactersToFilter;
    }

    // Filter by selected tags
    const filtered = charactersToFilter.filter((character) =>
      Array.from(selectedPositioningTags).every((selectedTag) => {
        const tags =
          (character.factionId === 'cat'
            ? character.catPositioningTags
            : character.mousePositioningTags) || [];
        return tags.some((charTag) => charTag.tagName === selectedTag);
      })
    );

    // Sort: not isMinor first, isMinor second (for the selected tags)
    return filtered.sort((a, b) => {
      const getIsMinor = (char: (typeof allCharacters)[keyof typeof allCharacters]) => {
        const tags =
          (char.factionId === 'cat' ? char.catPositioningTags : char.mousePositioningTags) || [];
        // If any tag matching the selected filter is not minor, treat as not minor
        return Array.from(selectedPositioningTags).every((selectedTag) => {
          const tag = tags.find(
            (t: { tagName: string; isMinor?: boolean }) => t.tagName === selectedTag
          );
          return tag ? tag.isMinor : true;
        });
      };
      const aIsMinor = getIsMinor(a);
      const bIsMinor = getIsMinor(b);
      return Number(aIsMinor) - Number(bIsMinor);
    });
  }, [faction.id, selectedPositioningTags, isEditMode, originalCharacterIds, selectedAvatar]);

  return (
    <div className='space-y-8'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>{faction.name}</PageTitle>
        <PageDescription>{faction.description}</PageDescription>
      </header>

      {/* Filter Section */}
      <div className='filter-section flex justify-center items-center gap-4 mt-4'>
        <FilterLabel displayMode='inline'>定位筛选:</FilterLabel>
        <FilterLabel displayMode='block'>筛选:</FilterLabel>
        <div className='flex gap-2'>
          {uniquePositioningTags.map((tag) => {
            const isActive = hasPositioningTagFilter(tag as PositioningTagName);
            const tagColors = getPositioningTagColors(
              tag as PositioningTagName,
              false,
              false,
              faction.id as FactionId,
              isDarkMode
            );

            // Tailwind classes for button styling and dark mode support
            const buttonStyle = isActive
              ? {
                  ...tagColors,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                }
              : isDarkMode
                ? {
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    backgroundColor: '#23272f',
                    color: '#6b7280',
                    ':hover': {
                      backgroundColor: '#2d323b',
                    },
                  }
                : {
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    ':hover': {
                      backgroundColor: '#e5e7eb',
                    },
                  };

            return (
              <Tooltip
                key={tag}
                content={getPositioningTagTooltipContent(tag, faction.id as FactionId, isDetailed)}
                delay={800}
                className='border-none cursor-pointer'
              >
                <button
                  type='button'
                  onClick={() => togglePositioningTagFilter(tag as PositioningTagName)}
                  style={buttonStyle}
                  className={clsx('filter-button', !isActive && 'hover:bg-gray-200')}
                >
                  {tag}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Avatar Filter (mouse only) */}
      {faction.id === 'mouse' && (
        <div className='filter-section flex justify-center items-center gap-4 mt-2'>
          <FilterLabel displayMode='inline'>形象筛选:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex gap-2'>
            {(['杰瑞', '泰菲', '其他'] as AvatarOption[]).map((opt) => {
              const isActive = hasAvatar(opt);
              const colors = getAvatarFilterColors(opt, isDarkMode);
              const baseStyle = {
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                fontSize: '14px',
                backgroundColor: isActive
                  ? colors.backgroundColor
                  : isDarkMode
                    ? '#23272f'
                    : '#f3f4f6',
                color: isActive ? colors.color : isDarkMode ? '#6b7280' : '#9ca3af',
              } as const;
              return (
                <button
                  key={opt}
                  type='button'
                  onClick={() => toggleAvatar(opt)}
                  style={baseStyle}
                  className={clsx('filter-button', !isActive && 'hover:bg-gray-200')}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className='auto-fit-grid grid-container grid gap-8 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}
      >
        {isEditMode && (
          <div className='character-card transform transition-transform hover:-translate-y-1'>
            <CharacterImport />
          </div>
        )}
        {isEditMode && (
          <div className='character-card transform transition-transform hover:-translate-y-1'>
            <CharacterCreate />
          </div>
        )}
        {isEditMode &&
          originalCharacters.map((character) => (
            <div
              key={`${character.id}-entry`}
              className='character-card transform transition-transform hover:-translate-y-1'
            >
              <CharacterDisplay
                id={character.id}
                name={character.id}
                imageUrl={character.imageUrl}
                positioningTags={
                  character.catPositioningTags || character.mousePositioningTags || []
                }
                factionId={faction.id}
                isEntryCard // This will be used for styling
              />
            </div>
          ))}
        {filteredCharacters.map((character, index) => (
          <div
            key={character.id}
            className='character-card transform transition-transform hover:-translate-y-1'
          >
            <CharacterDisplay
              id={character.id}
              name={character.id} // Use id as name for consistency
              imageUrl={character.imageUrl}
              positioningTags={
                (character.factionId === 'cat'
                  ? character.catPositioningTags
                  : character.mousePositioningTags) || []
              }
              factionId={faction.id}
              priority={index < 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
