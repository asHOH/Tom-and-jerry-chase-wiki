'use client';

import { getPositioningTagColors } from '@/lib/design';
import type { FactionId } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

import type { MatchedCharacter } from '../utils/matchCalculator';

type CharacterResult = {
  id: string;
  imageUrl: string;
  description?: string;
  EnglishName?: string;
  gender?: 'male' | 'female';
  catPositioningTags?: readonly { tagName: string; isMinor: boolean }[];
  mousePositioningTags?: readonly { tagName: string; isMinor: boolean }[];
  skills?: readonly { name: string; type: string }[];
};

type ResultCardProps = {
  match: MatchedCharacter;
  character: CharacterResult;
  faction: FactionId;
  isDarkMode: boolean;
  similarMatches: MatchedCharacter[];
  allCharacters: Record<string, CharacterResult>;
};

/**
 * Displays the quiz result: matched character portrait, name,
 * description, top skills, and positioning tag badges.
 */
export default function ResultCard({
  match,
  character,
  faction,
  isDarkMode,
  similarMatches,
  allCharacters,
}: ResultCardProps) {
  const tags = faction === 'cat' ? character.catPositioningTags : character.mousePositioningTags;
  const topSkills = character.skills?.slice(0, 3) ?? [];

  return (
    <div className='mx-auto max-w-lg space-y-6'>
      {/* Character reveal */}
      <div className='flex flex-col items-center gap-4'>
        <div className='relative'>
          <GameImage src={character.imageUrl} alt={character.id} size='CHARACTER_CARD' />
        </div>
        <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>{character.id}</h2>
        {character.EnglishName && (
          <p className='text-sm text-gray-500 dark:text-gray-400'>{character.EnglishName}</p>
        )}
        {character.gender && (
          <span className='text-sm text-gray-500 dark:text-gray-400'>
            {character.gender === 'male' ? '♂' : '♀'}
          </span>
        )}
      </div>

      {/* Match score */}
      <div className='text-center'>
        <div className='inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'>
          匹配度: {Math.round(match.score * 100)}%
        </div>
      </div>

      {/* Description */}
      {character.description && (
        <p className='text-center text-gray-700 dark:text-gray-300'>{character.description}</p>
      )}

      {/* Positioning tags */}
      {tags && tags.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
            定位标签
          </h3>
          <div className='flex flex-wrap justify-center gap-2'>
            {tags.map((tag) => {
              const colors = getPositioningTagColors(
                tag.tagName,
                tag.isMinor,
                false,
                faction,
                isDarkMode
              );
              return (
                <Tag key={tag.tagName} colorStyles={colors} size='sm'>
                  {tag.tagName}
                  {tag.isMinor ? ' (副)' : ''}
                </Tag>
              );
            })}
          </div>
        </div>
      )}

      {/* Top skills */}
      {topSkills.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
            代表技能
          </h3>
          <ul className='space-y-1 text-center'>
            {topSkills.map((skill) => (
              <li key={skill.name} className='text-gray-700 dark:text-gray-300'>
                {skill.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Similar matches */}
      {similarMatches.length > 0 && (
        <div className='space-y-2'>
          <h3 className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
            近似角色
          </h3>
          <div className='flex flex-wrap justify-center gap-2'>
            {similarMatches.map((m) => {
              const char = allCharacters[m.characterId];
              return (
                <span
                  key={m.characterId}
                  className='rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                >
                  {char?.id ?? m.characterId} ({Math.round(m.score * 100)}%)
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
