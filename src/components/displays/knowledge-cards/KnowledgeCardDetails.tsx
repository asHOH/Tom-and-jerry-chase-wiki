import React, { useState } from 'react';
import { Card } from '@/data';
import { getCardRankColors, getCardCostColors } from '@/lib/design-tokens';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { KnowledgeCardWithFaction, KnowledgeCardDetailsProps } from '@/lib/types';
import GameImage from '../../ui/GameImage';
import Tag from '../../ui/Tag';
import BaseCard from '../../ui/BaseCard';

export default function KnowledgeCardDetails({ card, isDetailedView: propIsDetailedView }: KnowledgeCardDetailsProps) {
  // State to track if showing detailed descriptions
  // Use the prop value if provided, otherwise use local state
  const [localIsDetailedView, setLocalIsDetailedView] = useState<boolean>(false);

  // Use prop value if provided, otherwise use local state
  const isDetailedView = propIsDetailedView !== undefined ? propIsDetailedView : localIsDetailedView;

  const rankColors = getCardRankColors(card.rank, true);
  const costColors = getCardCostColors(card.cost, true);

  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <BaseCard variant="details">
            <GameImage src={card.imageUrl} alt={card.id} size="CARD_DETAILS" />

            <h1 className="text-3xl font-bold py-2">
              {card.id} <span className="text-xl font-normal text-gray-400">({card.faction.name})</span>
            </h1>            {/* Card attributes section */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <p className="text-sm text-gray-700 py-1">
                  <Tag 
                    colorStyles={rankColors}
                    size="xs"
                    variant="compact"
                  >
                    等级: {card.rank}
                  </Tag>
                </p>
                <p className="text-sm text-gray-700 py-1">
                  <Tag 
                    colorStyles={costColors}
                    size="xs"
                    variant="compact"
                  >
                    费用: {card.cost}
                  </Tag>
                </p>
              </div>
            </div>
          </BaseCard>
        </div>

        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold py-2">知识卡效果</h2>
            {/* Only show the button if we're using local state (no prop provided) */}
            {propIsDetailedView === undefined && (
              <button
                onClick={() => setLocalIsDetailedView(!localIsDetailedView)}
                className="px-4 py-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              >
                {isDetailedView ? '简明描述' : '详细描述'}
              </button>
            )}
          </div>

          <div className="space-y-6">            <div className="card p-6">              {/* Card description */}
              <div className="mb-6">
                <p className="text-black text-lg py-2">
                  {renderTextWithHighlights(
                    isDetailedView && card.detailedDescription ? card.detailedDescription : card.description
                  )}
                </p>
              </div>              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {card.levels.map((level) => (
                  <div key={`${card.id}-${level.level}`} className="bg-gray-100 p-4 rounded">
                    <p className="px-2 py-1 text-black">
                      <span className="font-bold">Lv. {level.level}:</span>{' '}
                      {renderTextWithHighlights(
                        isDetailedView && level.detailedDescription ?
                          level.detailedDescription :
                          level.description
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
