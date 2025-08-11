'use client';

import { useMemo, useState } from 'react';
import { characters } from '@/data';
import {
  RankableProperty,
  rankCharactersByProperty,
  getPropertyInfo,
  getCharactersWithProperty,
} from '@/lib/characterRankingUtils';
import { FactionId } from '@/data/types';
import CharacterRankingCard from './CharacterRankingCard';
import PropertySelector from './PropertySelector';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import { useSearchParams } from 'next/navigation';

interface CharacterRankingGridProps {
  initialProperty?: RankableProperty;
}

export default function CharacterRankingGrid({ initialProperty }: CharacterRankingGridProps) {
  const [selectedProperty, setSelectedProperty] = useState<RankableProperty | undefined>(
    initialProperty
  );

  const factionId = (useSearchParams().get('faction') ?? undefined) as FactionId | undefined;

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
        <header className='text-center space-y-4 mb-8 px-4'>
          <PageTitle>角色属性排行榜</PageTitle>
          <PageDescription>
            选择一个属性来查看所有角色在该属性上的排名。
            {factionId && `当前显示: ${factionId === 'cat' ? '猫阵营' : '老鼠阵营'}角色`}
          </PageDescription>
        </header>

        <div className='max-w-4xl mx-auto px-4'>
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
        <header className='text-center space-y-4 mb-8 px-4'>
          <PageTitle>角色属性排行榜</PageTitle>
          <PageDescription>没有角色拥有所选属性的数据</PageDescription>
        </header>

        <div className='max-w-4xl mx-auto px-4'>
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
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>
          {propertyInfo?.label}排行榜
          {factionId && ` - ${factionId === 'cat' ? '猫阵营' : '老鼠阵营'}`}
        </PageTitle>
        <PageDescription>
          {propertyInfo?.description}
          {charactersWithProperty.length > 0 && (
            <span className='block mt-2 text-sm text-gray-600 dark:text-gray-400'>
              共有 {charactersWithProperty.length} 个角色拥有此属性数据
              {propertyInfo?.higherIsBetter === false && ' (数值越低越好)'}
            </span>
          )}
        </PageDescription>
      </header>

      {/* Property Selector */}
      <div className='max-w-4xl mx-auto px-4'>
        <PropertySelector
          currentProperty={selectedProperty}
          factionId={factionId}
          onPropertyChange={handlePropertyChange}
        />
      </div>

      {/* Rankings Grid */}
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
      >
        {rankedCharacters.map((rankedCharacter, index) => (
          <div
            key={rankedCharacter.character.id}
            className='character-card transform transition-transform hover:-translate-y-1'
          >
            <CharacterRankingCard
              rankedCharacter={rankedCharacter}
              priority={index < 6} // Prioritize loading for top 6 characters
            />
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      {rankedCharacters.length > 0 &&
        rankedCharacters[0] &&
        rankedCharacters[rankedCharacters.length - 1] && (
          <div className='max-w-4xl mx-auto px-4 pt-8 border-t border-gray-200 dark:border-gray-700'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-center'>
              <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg'>
                <div className='text-2xl font-bold text-green-600 dark:text-green-400'>
                  {rankedCharacters[0]?.formattedValue}
                </div>
                <div className='text-sm text-green-700 dark:text-green-300'>
                  最高值 ({rankedCharacters[0]?.character.id})
                </div>
              </div>

              <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg'>
                <div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  {rankedCharacters[rankedCharacters.length - 1]?.formattedValue}
                </div>
                <div className='text-sm text-blue-700 dark:text-blue-300'>
                  最低值 ({rankedCharacters[rankedCharacters.length - 1]?.character.id})
                </div>
              </div>

              <div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg'>
                <div className='text-2xl font-bold text-purple-600 dark:text-purple-400'>
                  {Math.round(
                    (rankedCharacters.reduce((sum, rc) => sum + rc.value, 0) /
                      rankedCharacters.length) *
                      10
                  ) / 10}
                </div>
                <div className='text-sm text-purple-700 dark:text-purple-300'>
                  平均值{propertyInfo?.unit && ` (${propertyInfo.unit})`}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
