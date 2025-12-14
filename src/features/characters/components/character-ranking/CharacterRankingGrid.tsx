'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDarkMode } from '@/context/DarkModeContext';
import { characters } from '@/data';
import { FactionId } from '@/data/types';
import {
  getCharactersWithProperty,
  getPropertyInfo,
  RankableProperty,
  rankCharactersByProperty,
} from '@/features/characters/utils/ranking';

import { getCardRankColors } from '@/lib/design-tokens';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

import CharacterRankingCard from './CharacterRankingCard';
import PropertySelector from './PropertySelector';

interface CharacterRankingGridProps {
  initialProperty?: RankableProperty;
  description?: string;
}

export default function CharacterRankingGrid({
  initialProperty,
  description,
}: CharacterRankingGridProps) {
  const [selectedProperty, setSelectedProperty] = useState<RankableProperty | undefined>(
    initialProperty
  );

  const factionId = (useSearchParams().get('faction') ?? undefined) as FactionId | undefined;
  const [isDarkMode] = useDarkMode();

  // Helpers to create softer backgrounds from token colors
  const hexToRgba = (hex: string, alpha: number) => {
    const raw = hex.startsWith('#') ? hex.slice(1) : hex;
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : raw.padStart(6, '0').slice(0, 6);
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const softBackground = (color: string, alpha = 0.15) => {
    const c = (color || '').trim();
    if (c.startsWith('rgba(')) {
      const inner = c
        .slice(5, -1)
        .split(',')
        .map((p) => p.trim());
      return `rgba(${inner[0]}, ${inner[1]}, ${inner[2]}, ${alpha})`;
    }
    if (c.startsWith('rgb(')) {
      const inner = c
        .slice(4, -1)
        .split(',')
        .map((p) => p.trim());
      return `rgba(${inner[0]}, ${inner[1]}, ${inner[2]}, ${alpha})`;
    }
    if (c.startsWith('#')) {
      return hexToRgba(c, alpha);
    }
    // Fallback: return as-is
    return c;
  };

  // Get all characters as array and filter by faction if specified
  const allCharacters = useMemo(() => {
    const characterArray = Object.values(characters);
    return factionId
      ? characterArray.filter((char) => char.factionId === factionId)
      : characterArray;
  }, [factionId]);

  // Get ranked characters for the selected property
  const rankedCharacters = useMemo(() => {
    if (!selectedProperty) return [];
    return rankCharactersByProperty(allCharacters, selectedProperty);
  }, [allCharacters, selectedProperty]);

  // Build a map of characterId -> rank group index based on unique rank buckets
  // Example ranks: 1,1,1,4,4,6,6,6,9 -> groups: 1,1,1 (group 1), 4,4 (group 2), 6,6,6 (group 3), 9+ (group 4)
  const rankGroupIndexById = useMemo(() => {
    const map: Record<string, number> = {};
    if (!rankedCharacters.length) return map;

    // Collect unique ranks in appearance order
    const uniqueRanks: number[] = [];
    let lastRank: number | undefined;
    for (const rc of rankedCharacters) {
      if (lastRank === undefined || rc.rank !== lastRank) {
        uniqueRanks.push(rc.rank);
        lastRank = rc.rank;
      }
    }

    // Assign group index for each character
    for (const rc of rankedCharacters) {
      const idx = uniqueRanks.indexOf(rc.rank);
      // group index is 1-based for first 3 groups; anything beyond is treated as 4 (others)
      const groupIndex = idx >= 0 ? Math.min(idx + 1, 4) : 4;
      map[rc.character.id] = groupIndex;
    }

    return map;
  }, [rankedCharacters]);

  // Get property info for display
  const propertyInfo = selectedProperty ? getPropertyInfo(selectedProperty) : undefined;

  // Get characters that have the property for stats
  const charactersWithProperty = useMemo(() => {
    if (!selectedProperty) return [];
    return getCharactersWithProperty(allCharacters, selectedProperty, factionId);
  }, [allCharacters, selectedProperty, factionId]);

  const handlePropertyChange = (property: RankableProperty) => {
    setSelectedProperty(property);
  };

  if (!selectedProperty) {
    return (
      <div className='space-y-8'>
        <header className='mb-8 space-y-4 px-4 text-center'>
          <PageTitle>角色属性排行榜</PageTitle>
          <PageDescription>
            {description ?? ''}
            {factionId && `，当前为: ${factionId === 'cat' ? '猫阵营' : '鼠阵营'}角色`}
          </PageDescription>
        </header>

        <div className='mx-auto max-w-4xl px-4'>
          <PropertySelector
            currentProperty={selectedProperty}
            factionId={factionId}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    );
  }

  if (rankedCharacters.length === 0) {
    return (
      <div className='space-y-8'>
        <header className='mb-8 space-y-4 px-4 text-center'>
          <PageTitle>角色属性排行榜</PageTitle>
          <PageDescription>没有角色拥有此属性</PageDescription>
        </header>

        <div className='mx-auto max-w-4xl px-4'>
          <PropertySelector
            currentProperty={selectedProperty}
            factionId={factionId}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <header className='mb-8 space-y-4 px-4 text-center'>
        <PageTitle>
          {propertyInfo?.label}排行榜
          {factionId && ` - ${factionId === 'cat' ? '猫阵营' : '鼠阵营'}`}
        </PageTitle>
        <PageDescription>
          {propertyInfo?.description}
          {charactersWithProperty.length > 0 && (
            <span className='mt-2 block text-sm text-gray-600 dark:text-gray-400'>
              共 {charactersWithProperty.length} 个角色拥有此属性
              {propertyInfo?.higherIsBetter === false && ' (数值越低越好)'}
            </span>
          )}
        </PageDescription>
      </header>

      {/* Property Selector */}
      <div className='mx-auto max-w-4xl px-4'>
        <PropertySelector
          currentProperty={selectedProperty}
          factionId={factionId}
          onPropertyChange={handlePropertyChange}
        />
      </div>

      {/* Rankings Grid */}
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
      >
        {rankedCharacters.map((rankedCharacter, index) => (
          <div
            key={rankedCharacter.character.id}
            className='character-card transform transition-transform hover:-translate-y-1'
          >
            <CharacterRankingCard
              rankedCharacter={rankedCharacter}
              {...(rankGroupIndexById[rankedCharacter.character.id]
                ? { rankGroupIndex: rankGroupIndexById[rankedCharacter.character.id] }
                : {})}
              preload={index < 6} // Prioritize loading for top 6 characters
            />
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      {rankedCharacters.length > 0 &&
        rankedCharacters[0] &&
        rankedCharacters[rankedCharacters.length - 1] && (
          <div className='mx-auto max-w-4xl border-t border-gray-200 px-4 pt-8 dark:border-gray-700'>
            <div className='grid grid-cols-1 gap-4 text-center md:grid-cols-3'>
              {/* Highest -> S rank colors with soft background */}
              {(() => {
                const s = getCardRankColors('S', false, isDarkMode);
                return (
                  <div
                    className='rounded-lg p-4'
                    style={{ backgroundColor: softBackground(s.backgroundColor as string, 0.15) }}
                  >
                    <div className='text-2xl font-bold' style={{ color: s.color }}>
                      {rankedCharacters[0]?.formattedValue}
                    </div>
                    <div className='text-sm' style={{ color: s.color }}>
                      最高 ({rankedCharacters[0]?.character.id})
                    </div>
                  </div>
                );
              })()}

              {/* Lowest -> C rank colors with soft background */}
              {(() => {
                const c = getCardRankColors('C', false, isDarkMode);
                return (
                  <div
                    className='rounded-lg p-4'
                    style={{ backgroundColor: softBackground(c.backgroundColor as string, 0.15) }}
                  >
                    <div className='text-2xl font-bold' style={{ color: c.color }}>
                      {rankedCharacters[rankedCharacters.length - 1]?.formattedValue}
                    </div>
                    <div className='text-sm' style={{ color: c.color }}>
                      最低 ({rankedCharacters[rankedCharacters.length - 1]?.character.id})
                    </div>
                  </div>
                );
              })()}

              {/* Average -> B rank colors with soft background */}
              {(() => {
                const b = getCardRankColors('B', false, isDarkMode);
                return (
                  <div
                    className='rounded-lg p-4'
                    style={{ backgroundColor: softBackground(b.backgroundColor as string, 0.15) }}
                  >
                    <div className='text-2xl font-bold' style={{ color: b.color }}>
                      {Math.round(
                        (rankedCharacters.reduce((sum, rc) => sum + rc.value, 0) /
                          rankedCharacters.length) *
                          10
                      ) / 10}
                    </div>
                    <div className='text-sm' style={{ color: b.color }}>
                      平均{propertyInfo?.unit && ` (${propertyInfo.unit})`}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
    </div>
  );
}
