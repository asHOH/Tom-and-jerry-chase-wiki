'use client';

import { memo } from 'react';
import { RankedCharacter, getRankDisplayName } from '@/lib/characterRankingUtils';
import Image from '@/components/Image';
import { getCardRankColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';
import BaseCard from '@/components/ui/BaseCard';
import Tag from '@/components/ui/Tag';

interface CharacterRankingCardProps {
  rankedCharacter: RankedCharacter;
  // This controls the color only
  rankGroupIndex?: number | undefined;
  priority?: boolean;
}

function CharacterRankingCard({
  rankedCharacter,
  rankGroupIndex,
  priority = false,
}: CharacterRankingCardProps) {
  const { character, rank, formattedValue } = rankedCharacter;
  const [isDarkMode] = useDarkMode();

  // Get rank colors using design tokens - map ranks to card rank system
  // We color by unique rank groups: group 1 -> S, group 2 -> A, group 3 -> B, others -> C
  const getRankColorScheme = (groupIndex: number) => {
    if (groupIndex === 1) return getCardRankColors('S', false, isDarkMode);
    if (groupIndex === 2) return getCardRankColors('A', false, isDarkMode);
    if (groupIndex === 3) return getCardRankColors('B', false, isDarkMode);
    return getCardRankColors('C', false, isDarkMode);
  };

  const effectiveGroupIndex = rankGroupIndex ?? (rank <= 3 ? rank : 4); // Fallback keeps previous behavior
  const rankColors = getRankColorScheme(effectiveGroupIndex);
  const valueColors = rankColors;

  return (
    <BaseCard
      variant='item'
      href={`/characters/${character.id}`}
      role='button'
      aria-label={`查看${character.id}角色详情，排名第${rank}名，数值${formattedValue}`}
    >
      {/* Character Image */}
      <div className='flex justify-center pt-4'>
        <div className='w-20 h-20'>
          <Image
            src={character.imageUrl || `/images/${character.factionId}s/${character.id}.png`}
            alt={`${character.id}角色图标`}
            width={80}
            height={80}
            className='object-cover hover:scale-105 transition-transform duration-200'
            priority={priority}
          />
        </div>
      </div>

      <div className='mt-4 px-3 pt-1 pb-3 text-center'>
        {/* Character Name */}
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-2'>{character.id}</h3>

        {/* Rank and Value Tags */}
        <div
          className='flex justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='角色排名信息'
        >
          <Tag colorStyles={rankColors} size='xs' margin='compact'>
            {getRankDisplayName(rank)}
          </Tag>
          <Tag colorStyles={valueColors} size='xs' margin='compact'>
            {formattedValue}
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}

export default memo(CharacterRankingCard);
