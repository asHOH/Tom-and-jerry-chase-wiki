'use client';

import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useAppContext } from '@/context/AppContext';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
}: CharacterDisplayProps) {
  const { handleSelectCharacter } = useAppContext();
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
      <GameImage src={imageUrl} alt={`${name}`} size='CHARACTER_CARD' className='hover:scale-105' />
      <div className='px-6 pt-1 pb-6 text-center'>
        <h2 className='text-xl font-bold mb-2'>{name}</h2>
        {positioningTags && positioningTags.length > 0 && (
          <div
            className='flex flex-wrap justify-center gap-1 mt-2'
            role='list'
            aria-label='角色定位标签'
          >
            {positioningTags.map((tag, index) => (
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
