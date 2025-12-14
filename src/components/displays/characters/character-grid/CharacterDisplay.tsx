'use client';

import { useMemo } from 'react';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import clsx from 'clsx';

import { GameDataManager } from '@/lib/dataManager';
import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import { getWeaponSkillImageUrl } from '@/lib/weaponUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import Image from '@/components/Image';

import BaseCard from '../../../ui/BaseCard';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
  preload = false,
  isEntryCard = false, // Add the new prop
}: CharacterDisplayProps & { preload?: boolean; isEntryCard?: boolean }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

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
          'border-2 border-dashed border-slate-300 bg-slate-50 opacity-60 dark:border-slate-600 dark:bg-slate-800/50'
      )}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}`}
        size='CHARACTER_CARD'
        className={`hover:scale-105 ${isMobile ? 'h-40' : ''}`}
        preload={preload}
      />
      <div className={`${isMobile ? 'pb-3' : 'px-3 pb-5'} pt-1 text-center`}>
        <h2
          className={`${isMobile ? 'text-lg' : 'mb-2 text-xl'} font-bold whitespace-pre dark:text-white`}
        >
          {name}
        </h2>

        {sortedPositioningTags && sortedPositioningTags.length > 0 && (
          <div
            className={`flex flex-wrap justify-center gap-1 ${isMobile ? '' : 'mt-2'}`}
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
                    size={isMobile ? 'xxs' : 'xs'}
                    margin='compact'
                  >
                    {tag.tagName}
                  </Tag>
                  {weaponImageUrl && (
                    <div className='absolute -top-2 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-gray-300 bg-white/40 dark:border-gray-600 dark:bg-gray-800/40'>
                      <Image
                        src={weaponImageUrl}
                        alt={`武器${tag.weapon}`}
                        width={14}
                        height={14}
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
