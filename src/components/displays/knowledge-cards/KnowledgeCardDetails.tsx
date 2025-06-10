import React from 'react';
import { getCardRankColors, getCardCostColors, designTokens } from '@/lib/design-tokens';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import GameImage from '../../ui/GameImage';
import Tag from '../../ui/Tag';
import BaseCard from '../../ui/BaseCard';

export default function KnowledgeCardDetails({ card, isDetailedView: propIsDetailedView }: KnowledgeCardDetailsProps) {
  const isDetailedView = propIsDetailedView || false;

  const rankColors = getCardRankColors(card.rank, true);
  const costColors = getCardCostColors(card.cost, true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.xl }}>
      <div className="flex flex-col md:flex-row" style={{ gap: designTokens.spacing.xl }}>
        <div className="md:w-1/3">
          <BaseCard variant="details">
            <GameImage src={card.imageUrl} alt={card.id} size="CARD_DETAILS" />
            <div style={{ padding: designTokens.spacing.md }}>
              <h1 className="text-3xl font-bold" style={{ paddingBottom: designTokens.spacing.sm }}>
                {card.id} <span className="text-xl font-normal text-gray-400">({card.faction.id === 'cat' ? '猫方知识卡' : '鼠方知识卡'})</span>
              </h1>

              {/* Card attributes section */}
              <div style={{ marginTop: designTokens.spacing.lg, display: 'flex', flexDirection: 'column', gap: designTokens.spacing.sm }}>
                <div className="grid grid-cols-2" style={{ gap: designTokens.spacing.sm }}>
                  <p className="text-base text-gray-700" style={{ paddingTop: designTokens.spacing.xxs, paddingBottom: designTokens.spacing.xxs }}>
                    <Tag 
                      colorStyles={rankColors}
                      size="md"
                      variant="compact"
                    >
                      等级: {card.rank}
                    </Tag>
                  </p>
                  <p className="text-base text-gray-700" style={{ paddingTop: designTokens.spacing.xxs, paddingBottom: designTokens.spacing.xxs }}>
                    <Tag 
                      colorStyles={costColors}
                      size="md"
                      variant="compact"
                    >
                      费用: {card.cost}
                    </Tag>
                  </p>
                </div>
              </div>
            </div>
          </BaseCard>
        </div>        <div className="md:w-2/3">
          <div className="flex justify-between items-center" style={{ marginBottom: designTokens.spacing.lg, paddingLeft: designTokens.spacing.sm, paddingRight: designTokens.spacing.sm }}>
            <h2 className="text-2xl font-bold" style={{ paddingTop: designTokens.spacing.sm, paddingBottom: designTokens.spacing.sm }}>知识卡效果</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: designTokens.spacing.lg }}>
            <div className="card" style={{ padding: designTokens.spacing.lg }}>
              {/* Card description */}
              <div style={{ marginBottom: designTokens.spacing.lg }}>
                <p className="text-black text-lg" style={{ paddingTop: designTokens.spacing.sm, paddingBottom: designTokens.spacing.sm }}>
                  {renderTextWithHighlights(
                    isDetailedView && card.detailedDescription ? card.detailedDescription : card.description
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: designTokens.spacing.md }}>
                {card.levels.map((level) => (
                  <div key={`${card.id}-${level.level}`} className="bg-gray-100 rounded" style={{ padding: designTokens.spacing.md }}>
                    <p className="text-black" style={{ paddingLeft: designTokens.spacing.sm, paddingRight: designTokens.spacing.sm, paddingTop: designTokens.spacing.xxs, paddingBottom: designTokens.spacing.xxs }}>
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
