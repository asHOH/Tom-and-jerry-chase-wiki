'use client';

import { useMemo } from 'react';
import { sortPositioningTagNames } from '@/constants/positioningTagSequences';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { characters as allCharacters, FactionId, PositioningTagName } from '@/data';

import { getAvatarFilterColors, getPositioningTagColors } from '@/lib/design-tokens';
import { getOriginalCharacterIds } from '@/lib/editUtils';
import { useFilterState } from '@/lib/filterUtils';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { FactionCharactersProps } from '@/lib/types';
import { useMobile } from '@/hooks/useMediaQuery';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Tooltip from '@/components/ui/Tooltip';

import CharacterCreate from './CharacterCreate';
import CharacterDisplay from './CharacterDisplay';
import CharacterImport from './CharacterImport';

export default function CharacterGrid({ faction }: FactionCharactersProps) {
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const [isDarkMode] = useDarkMode();
  const originalCharacterIds = getOriginalCharacterIds();
  const isMobile = useMobile();

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

  // Avatar filter
  type AvatarOption = '杰瑞' | '泰菲' | '汤姆' | '其他';
  const {
    selectedFilters: selectedAvatar,
    toggleFilter: toggleAvatar,
    hasFilter: hasAvatar,
  } = useFilterState<AvatarOption>();

  // Avatar options derived by faction to deduplicate UI rendering
  const avatarOptions = useMemo((): AvatarOption[] => {
    return faction.id === 'mouse' ? ['杰瑞', '泰菲', '其他'] : ['汤姆', '其他'];
  }, [faction.id]);

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

    // Apply avatar filter
    if (selectedAvatar.size > 0) {
      charactersToFilter = charactersToFilter.filter((c) => {
        const name = c.id; // ids are Chinese display names in this project
        let cls: AvatarOption = '其他';
        if (faction.id === 'mouse') {
          const hasJerry = name.includes('杰瑞');
          const hasTuffy = name.includes('泰菲');
          cls = hasJerry ? '杰瑞' : hasTuffy ? '泰菲' : '其他';
        } else if (faction.id === 'cat') {
          const hasTom = name.includes('汤姆');
          cls = hasTom ? '汤姆' : '其他';
        }
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
    <div
      className={
        isMobile
          ? 'max-w-1xl mx-auto space-y-1 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>{faction.name}</PageTitle>
        {!isMobile && <PageDescription>{faction.description}</PageDescription>}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          <FilterRow
            label='定位筛选:'
            options={uniquePositioningTags as readonly PositioningTagName[]}
            isActive={(tag) => hasPositioningTagFilter(tag as PositioningTagName)}
            onToggle={(tag) => togglePositioningTagFilter(tag as PositioningTagName)}
            isDarkMode={isDarkMode}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getPositioningTagTooltipContent(
                  tag as PositioningTagName,
                  faction.id as FactionId,
                  isDetailed
                )}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
            getButtonStyle={(tag) => {
              const isActive = hasPositioningTagFilter(tag as PositioningTagName);
              const tagColors = getPositioningTagColors(
                tag as PositioningTagName,
                false,
                false,
                faction.id as FactionId,
                isDarkMode
              );
              return isActive ? { ...tagColors } : undefined;
            }}
            className='mt-4'
          />

          <FilterRow
            label='形象筛选:'
            options={avatarOptions}
            isActive={(opt) => hasAvatar(opt)}
            onToggle={(opt) => toggleAvatar(opt)}
            isDarkMode={isDarkMode}
            getButtonStyle={(opt) => {
              const isActive = hasAvatar(opt);
              const colors = getAvatarFilterColors(opt, isDarkMode);
              return isActive
                ? { backgroundColor: colors.backgroundColor, color: colors.color }
                : undefined;
            }}
            className='mt-0'
          />
        </div>
      </header>

      <div
        className={`auto-fit-grid grid-container grid ${isMobile ? '' : 'gap-8'} mt-8`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '120px' : '200px'}, 1fr))`,
        }}
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
              preload={index < 4}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
