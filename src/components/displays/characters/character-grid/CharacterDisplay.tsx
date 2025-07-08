'use client';

import { useMemo } from 'react';
import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useAppContext } from '@/context/AppContext';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { getCharacterCurrentName, isOriginalCharacter } from '@/lib/editUtils';
import { useEditMode } from '@/context/EditModeContext';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
  priority = false,
}: CharacterDisplayProps & { priority?: boolean }) {
  const { handleSelectCharacter } = useAppContext();
  const { isEditMode } = useEditMode();

  // Sort positioning tags according to sequence (main tags first, then by sequence)
  const sortedPositioningTags = useMemo(() => {
    if (!positioningTags || positioningTags.length === 0) return [];
    return sortPositioningTags(positioningTags, factionId as 'cat' | 'mouse');
  }, [positioningTags, factionId]);

  // Check if this character has been renamed (only show in edit mode)
  const currentName = useMemo(() => {
    if (!isEditMode) return undefined;
    if (isOriginalCharacter(id)) {
      return getCharacterCurrentName(id);
    }
    return undefined;
  }, [id, isEditMode]);

  return (
    <BaseCard
      variant='character'
      onClick={() => handleSelectCharacter(id)}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectCharacter(id);
        }
      }}
      aria-label={`查看${name}角色详情`}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}`}
        size='CHARACTER_CARD'
        className='hover:scale-105'
        priority={priority}
      />
      <div className='px-6 pt-1 pb-6 text-center'>
        <h2 className='text-xl font-bold mb-2'>{name}</h2>
        {currentName && (
          <div className='mb-2'>
            <span className='text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200'>
              → {currentName}
            </span>
          </div>
        )}
        {sortedPositioningTags && sortedPositioningTags.length > 0 && (
          <div
            className='flex flex-wrap justify-center gap-1 mt-2'
            role='list'
            aria-label='角色定位标签'
          >
            {sortedPositioningTags.map((tag, index) => (
              <div key={index} role='listitem'>
                <Tag
                  colorStyles={getPositioningTagColors(
                    tag.tagName,
                    tag.isMinor,
                    false,
                    factionId as 'cat' | 'mouse'
                  )}
                  size='xs'
                  variant='compact'
                >
                  {tag.tagName}
                </Tag>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
