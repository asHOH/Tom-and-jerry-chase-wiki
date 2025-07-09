'use client';

import { useMemo } from 'react';
import CharacterDisplay from './CharacterDisplay';
import CharacterImport from './CharacterImport';
import { FactionCharactersProps } from '@/lib/types';
import { PositioningTagName } from '@/data';
import { useFilterState } from '@/lib/filterUtils';
import { getPositioningTagColors } from '@/lib/design-tokens';
import { sortPositioningTagNames } from '@/constants/positioningTagSequences';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { getOriginalCharacterIds } from '@/lib/editUtils';
import { characters as allCharacters } from '@/data';

export default function CharacterGrid({ faction }: FactionCharactersProps) {
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
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

  const uniquePositioningTags = useMemo(() => {
    const tags = new Set<PositioningTagName>();
    faction.characters.forEach((character) => {
      character.positioningTags.forEach((tag) => {
        tags.add(tag.tagName);
      });
    });
    return sortPositioningTagNames(Array.from(tags), faction.id as 'cat' | 'mouse');
  }, [faction.characters, faction.id]);

  const filteredCharacters = useMemo(() => {
    let charactersToFilter = faction.characters;

    // In edit mode, exclude original characters from the main list
    if (isEditMode) {
      charactersToFilter = charactersToFilter.filter(
        (char) => !originalCharacterIds.includes(char.id)
      );
    }

    if (selectedPositioningTags.size === 0) {
      return charactersToFilter;
    }

    return charactersToFilter.filter((character) =>
      Array.from(selectedPositioningTags).every((selectedTag) =>
        character.positioningTags.some((charTag) => charTag.tagName === selectedTag)
      )
    );
  }, [faction.characters, selectedPositioningTags, isEditMode, originalCharacterIds]);

  return (
    <div className='space-y-8'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <h1 className='text-4xl font-bold text-blue-600 py-3'>{faction.name}</h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2'>{faction.description}</p>
      </header>

      {/* Filter Section */}
      <div className='flex justify-center items-center gap-4 mt-4'>
        <span className='text-lg font-medium text-gray-700 hidden sm:inline'>定位筛选:</span>
        <span className='text-lg font-medium text-gray-700 sm:hidden'>筛选:</span>
        <div className='flex gap-2'>
          {uniquePositioningTags.map((tag) => {
            const tagColors = getPositioningTagColors(
              tag,
              false,
              false,
              faction.id as 'cat' | 'mouse'
            );
            const isActive = hasPositioningTagFilter(tag as PositioningTagName);

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
                content={getPositioningTagTooltipContent(
                  tag,
                  faction.id as 'cat' | 'mouse',
                  isDetailed
                )}
                delay={800}
                className='border-none cursor-pointer'
              >
                <button
                  type='button'
                  onClick={() => togglePositioningTagFilter(tag as PositioningTagName)}
                  style={buttonStyle}
                  className={!isActive ? 'hover:bg-gray-200' : ''}
                >
                  {tag}
                </button>
              </Tooltip>
            );
          })}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8'>
        {isEditMode && (
          <div className='transform transition-transform hover:-translate-y-1'>
            <CharacterImport />
          </div>
        )}
        {isEditMode &&
          originalCharacters.map((character) => (
            <div
              key={`${character.id}-entry`}
              className='transform transition-transform hover:-translate-y-1'
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
          <div key={character.id} className='transform transition-transform hover:-translate-y-1'>
            <CharacterDisplay
              id={character.id}
              name={character.name}
              imageUrl={character.imageUrl}
              positioningTags={character.positioningTags}
              factionId={faction.id}
              priority={index < 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
