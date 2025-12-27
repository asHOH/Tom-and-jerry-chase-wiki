'use client';

import { useMemo, useState } from 'react';

import { AssetManager } from '@/lib/assetManager';
import CharacterDisplay from '@/features/characters/components/character-grid/CharacterDisplay';
import { getCharacterRelation } from '@/features/characters/utils/relations';
import { CharacterSlotsSelector } from '@/components/ui/CharacterSelector';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { characters } from '@/data';

export default function RecommendedPageClient() {
  const [selectedMice, setSelectedMice] = useState<(string | null)[]>([null, null, null, null]);

  const allMice = useMemo(() => {
    return Object.values(characters).filter((c) => c.factionId === 'mouse');
  }, []);

  const allCats = useMemo(() => {
    return Object.values(characters).filter((c) => c.factionId === 'cat');
  }, []);

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
      <header className='mb-8 space-y-4 text-center dark:text-slate-200'>
        <PageTitle>阵容推荐</PageTitle>
        <PageDescription>选择对手的老鼠阵容，系统将为您推荐最佳的猫角色。</PageDescription>
      </header>

      {/* Mouse Selector */}
      <CharacterSlotsSelector
        title='选择老鼠角色'
        characters={allMice}
        selectedIds={selectedMice}
        onSelectedIdsChange={(next) => setSelectedMice(next)}
        getCharacterImageUrl={(characterId) => AssetManager.getCharacterImageUrl(characterId, 'mouse')}
      />

      {/* Recommendations */}
      {recommendedCats.length > 0 && (
        <div className='space-y-6 dark:text-slate-200'>
          <h2 className='mb-6 text-center text-xl font-bold'>推荐猫咪</h2>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
            {recommendedCats.map(({ cat, score }, index) => (
              <div key={cat.id} className='group relative'>
                <div className='absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-sm font-bold text-white shadow-md'>
                  {score > 0 ? `+${score}` : score}
                </div>
                <div className='transform transition-transform hover:-translate-y-1'>
                  <CharacterDisplay
                    id={cat.id}
                    name={cat.id}
                    imageUrl={cat.imageUrl}
                    positioningTags={cat.catPositioningTags || []}
                    factionId='cat'
                    preload={index < 3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recommendedCats.length === 0 && selectedMice.some((m) => m !== null) && (
        <div className='py-12 text-center text-gray-500 dark:text-gray-400'>
          没有找到特别推荐的猫咪，可能是因为数据不足或关系平衡。
        </div>
      )}
    </div>
  );
}
