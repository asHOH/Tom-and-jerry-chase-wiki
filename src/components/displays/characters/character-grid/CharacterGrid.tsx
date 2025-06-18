import { useMemo } from 'react';
import CharacterDisplay from './CharacterDisplay';
import { FactionCharactersProps } from '@/lib/types';
import { PositioningTagName } from '@/data';
import { useFilterState } from '@/lib/filterUtils';
import { getPositioningTagColors } from '@/lib/design-tokens';

export default function CharacterGrid({ faction, onSelectCharacter }: FactionCharactersProps) {
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
    return Array.from(tags).sort();
  }, [faction.characters]);

  const filteredCharacters = useMemo(() => {
    if (selectedPositioningTags.size === 0) {
      return faction.characters;
    }

    return faction.characters.filter((character) =>
      Array.from(selectedPositioningTags).every((selectedTag) =>
        character.positioningTags.some((charTag) => charTag.tagName === selectedTag)
      )
    );
  }, [faction.characters, selectedPositioningTags]);

  return (
    <div className='space-y-8'>
      <header className='text-center space-y-6 mb-10 px-4'>
        <h1 className='text-4xl font-bold text-blue-600 py-3'>{faction.name}</h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2'>{faction.description}</p>
      </header>

      {/* Filter Section */}
      <div className='flex justify-center items-center gap-4 mt-4'>
        <span className='text-lg font-medium text-gray-700'>定位筛选:</span>
        <div className='flex gap-2'>
          {uniquePositioningTags.map((tag) => {
            const tagColors = getPositioningTagColors(
              tag,
              false,
              false,
              faction.id as 'cat' | 'mouse'
            );
            const isActive = hasPositioningTagFilter(tag);

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
              <button
                key={tag}
                onClick={() => togglePositioningTagFilter(tag)}
                style={buttonStyle}
                className={!isActive ? 'hover:bg-gray-200' : ''}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-8'>
        {filteredCharacters.map((character) => (
          <div key={character.id} className='transform transition-transform hover:-translate-y-1'>
            <CharacterDisplay
              id={character.id}
              name={character.name}
              imageUrl={character.imageUrl}
              positioningTags={character.positioningTags}
              factionId={faction.id}
              onClick={onSelectCharacter}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
