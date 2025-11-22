'use client';

import React, { useState, useMemo } from 'react';
import { characters } from '@/data';
import { getCharacterRelation } from '@/lib/characterRelationUtils';
import CharacterDisplay from '@/components/displays/characters/character-grid/CharacterDisplay';
import Image from '@/components/Image';
import { AssetManager } from '@/lib/assetManager';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';

export default function RecommendedPageClient() {
  const [selectedMice, setSelectedMice] = useState<(string | null)[]>([null, null, null, null]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const allMice = useMemo(() => {
    return Object.values(characters).filter((c) => c.factionId === 'mouse');
  }, []);

  const allCats = useMemo(() => {
    return Object.values(characters).filter((c) => c.factionId === 'cat');
  }, []);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    setIsSelectorOpen(true);
  };

  const handleSelectMouse = (mouseId: string) => {
    if (activeSlotIndex !== null) {
      const newSelected = [...selectedMice];
      newSelected[activeSlotIndex] = mouseId;
      setSelectedMice(newSelected);
      setIsSelectorOpen(false);
      setActiveSlotIndex(null);
    }
  };

  const handleRemoveMouse = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const newSelected = [...selectedMice];
    newSelected[index] = null;
    setSelectedMice(newSelected);
  };

  const recommendedCats = useMemo(() => {
    const activeMice = selectedMice.filter((id): id is string => id !== null);
    if (activeMice.length === 0) return [];

    const scores = allCats.map((cat) => {
      let score = 0;
      const relations = getCharacterRelation(cat.id);

      activeMice.forEach((mouseId) => {
        // Check if Cat counters Mouse
        const counterRelation = relations.counters.find((r) => r.id === mouseId);
        if (counterRelation) {
          score += counterRelation.isMinor ? 2 : 5;
        }

        // Check if Cat is countered by Mouse
        const counteredByRelation = relations.counteredBy.find((r) => r.id === mouseId);
        if (counteredByRelation) {
          score -= counteredByRelation.isMinor ? 2 : 5;
        }

        // Note: We don't need to check Mouse.counters/counteredBy explicitly because
        // getCharacterRelation already merges relations from both sides.
      });

      return { cat, score };
    });

    // Sort by score desc
    return scores.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [selectedMice, allCats]);

  return (
    <div className='min-h-screen'>
      <header className='text-center space-y-4 mb-8 dark:text-slate-200'>
        <PageTitle>阵容推荐</PageTitle>
        <PageDescription>选择对手的老鼠阵容，系统将为您推荐最佳的猫角色。</PageDescription>
      </header>

      {/* Mouse Selector */}
      <div className='flex justify-center gap-4 mb-12 flex-wrap dark:text-slate-200'>
        {selectedMice.map((mouseId, index) => (
          <div
            key={index}
            onClick={() => handleSlotClick(index)}
            className={`
              relative w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer
              transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
              ${mouseId ? 'border-solid border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
            `}
          >
            {mouseId ? (
              <>
                <Image
                  src={AssetManager.getCharacterImageUrl(mouseId, 'mouse')}
                  alt={mouseId}
                  width={80}
                  height={80}
                  className='w-20 h-20 object-contain'
                />
                <button
                  onClick={(e) => handleRemoveMouse(e, index)}
                  className='absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm'
                >
                  <TrashIcon className='w-3 h-3' />
                </button>
                <div className='absolute bottom-1 left-0 right-0 text-center text-xs font-medium text-gray-700 dark:text-gray-300 truncate px-1'>
                  {mouseId}
                </div>
              </>
            ) : (
              <PlusIcon className='w-8 h-8 text-gray-400' />
            )}
          </div>
        ))}
      </div>

      {/* Selector Modal */}
      {isSelectorOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setIsSelectorOpen(false)}
        >
          <div
            className='bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center'>
              <h3 className='text-lg font-semibold'>选择老鼠角色</h3>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                ✕
              </button>
            </div>
            <div className='p-4 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4'>
              {allMice.map((mouse) => {
                const isSelected = selectedMice.includes(mouse.id);
                return (
                  <button
                    key={mouse.id}
                    onClick={() => !isSelected && handleSelectMouse(mouse.id)}
                    disabled={isSelected}
                    className={`
                      flex flex-col items-center gap-2 p-2 rounded-lg transition-colors
                      ${isSelected ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    `}
                  >
                    <Image
                      src={AssetManager.getCharacterImageUrl(mouse.id, 'mouse')}
                      alt={mouse.id}
                      width={48}
                      height={48}
                      className='w-12 h-12 object-contain'
                    />
                    <span className='text-xs text-center'>{mouse.id}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendedCats.length > 0 && (
        <div className='space-y-6 dark:text-slate-200'>
          <h2 className='text-xl font-bold text-center mb-6'>推荐猫咪</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6'>
            {recommendedCats.map(({ cat, score }, index) => (
              <div key={cat.id} className='relative group'>
                <div className='absolute -top-3 -right-3 z-10 bg-yellow-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-md'>
                  {score > 0 ? `+${score}` : score}
                </div>
                <div className='transform transition-transform hover:-translate-y-1'>
                  <CharacterDisplay
                    id={cat.id}
                    name={cat.id}
                    imageUrl={cat.imageUrl}
                    positioningTags={cat.catPositioningTags || []}
                    factionId='cat'
                    priority={index < 3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendedCats.length === 0 && selectedMice.some((m) => m !== null) && (
        <div className='text-center text-gray-500 dark:text-gray-400 py-12'>
          没有找到特别推荐的猫咪，可能是因为数据不足或关系平衡。
        </div>
      )}
    </div>
  );
}
