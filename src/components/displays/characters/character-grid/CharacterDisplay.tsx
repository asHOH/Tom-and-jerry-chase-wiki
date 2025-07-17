'use client';

import { useMemo } from 'react';
import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useAppContext } from '@/context/AppContext';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { useDarkMode } from '@/context/DarkModeContext';
import { getWeaponSkillImageUrl } from '@/lib/weaponUtils';
import Image from 'next/image';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
  priority = false,
  isEntryCard = false, // Add the new prop
}: CharacterDisplayProps & { priority?: boolean; isEntryCard?: boolean }) {
  const { handleSelectCharacter } = useAppContext();
  const [isDarkMode] = useDarkMode();

  // Sort positioning tags according to sequence (main tags first, then by sequence)
  const sortedPositioningTags = useMemo(() => {
    if (!positioningTags || positioningTags.length === 0) return [];
    return sortPositioningTags(positioningTags, factionId as 'cat' | 'mouse');
  }, [positioningTags, factionId]);

  const entryCardClass = isEntryCard
    ? 'opacity-60 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
    : '';

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
      className={entryCardClass}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}`}
        size='CHARACTER_CARD'
        className='hover:scale-105'
        priority={priority}
      />
      <div className='px-6 pt-1 pb-6 text-center'>
        <h2 className='text-xl font-bold mb-2 dark:text-white'>{name}</h2>

        {sortedPositioningTags && sortedPositioningTags.length > 0 && (
          <div
            className='flex flex-wrap justify-center gap-1 mt-2'
            role='list'
            aria-label='角色定位标签'
          >
            {sortedPositioningTags.map((tag, index) => {
              const weaponImageUrl = tag.weapon
                ? getWeaponSkillImageUrl(id, tag.weapon, factionId as 'cat' | 'mouse')
                : null;

              return (
                <div key={index} role='listitem' className='relative'>
                  <Tag
                    colorStyles={getPositioningTagColors(
                      tag.tagName,
                      tag.isMinor,
                      false,
                      factionId as 'cat' | 'mouse',
                      isDarkMode
                    )}
                    size='xs'
                    variant='compact'
                  >
                    {tag.tagName}
                  </Tag>
                  {weaponImageUrl && (
                    <div className='absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center'>
                      <Image
                        src={weaponImageUrl}
                        alt={`武器${tag.weapon}`}
                        width={12}
                        height={12}
                        className='rounded-sm'
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
