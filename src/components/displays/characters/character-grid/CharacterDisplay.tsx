'use client';

import { useMemo } from 'react';
import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import type { FactionId } from '@/data/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { useDarkMode } from '@/context/DarkModeContext';
import { getWeaponSkillImageUrl } from '@/lib/weaponUtils';
import Image from '@/components/Image';
import clsx from 'clsx';
import { GameDataManager } from '@/lib/dataManager';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
  priority = false,
  isEntryCard = false, // Add the new prop
}: CharacterDisplayProps & { priority?: boolean; isEntryCard?: boolean }) {
  const [isDarkMode] = useDarkMode();

  // Sort positioning tags according to sequence (main tags first, then by sequence)
  const sortedPositioningTags = useMemo(() => {
    if (!positioningTags || positioningTags.length === 0) return [];
    return sortPositioningTags(positioningTags, factionId as FactionId);
  }, [positioningTags, factionId]);

  const computedId = id in GameDataManager.getCharacters() ? id : `user/${id}`;

  return (
    <BaseCard
      variant='character'
      href={`/characters/${computedId}`}
      role='button'
      aria-label={`查看${name}角色详情`}
      className={clsx(
        isEntryCard &&
          'opacity-60 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
      )}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}`}
        size='CHARACTER_CARD'
        className='hover:scale-105'
        priority={priority}
      />
      <div className='px-4 pt-1 pb-5 text-center'>
        <h2 className='text-xl font-bold mb-2 dark:text-white'>{name}</h2>

        {sortedPositioningTags && sortedPositioningTags.length > 0 && (
          <div
            className='flex flex-wrap justify-center gap-1 mt-2'
            role='list'
            aria-label='角色定位标签'
          >
            {sortedPositioningTags.map((tag, index) => {
              const weaponImageUrl = tag.weapon
                ? getWeaponSkillImageUrl(id, tag.weapon, factionId as FactionId)
                : null;

              return (
                <div key={index} role='listitem' className='relative'>
                  <Tag
                    colorStyles={getPositioningTagColors(
                      tag.tagName,
                      tag.isMinor,
                      false,
                      factionId as FactionId,
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
