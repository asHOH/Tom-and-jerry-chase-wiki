import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/data';
import { getRankColor, getCostColor } from '@/lib/cardUtils';

// Function to parse and render text with highlighted parts
const renderDescriptionWithHighlights = (text: string) => {
  const parts = [];
  let lastIndex = 0;
  const highlightPattern = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = highlightPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }    // Add the underlined text with styling
    parts.push(
      <span key={match.index} className="underline decoration-2 underline-offset-2">
        {match[1]}
      </span>
    );

    lastIndex = highlightPattern.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};

// Extended Card type that includes the faction object (as used in the exported cards)
type CardWithFaction = Card & {
  faction: {
    id: string;
    name: string;
  };
  imageUrl: string; // Required in the component
};

type CardDetailsProps = {
  card: CardWithFaction;
  isDetailedView?: boolean;
};

export default function CardDetails({ card, isDetailedView: propIsDetailedView }: CardDetailsProps) {
  // State to track if showing detailed descriptions
  // Use the prop value if provided, otherwise use local state
  const [localIsDetailedView, setLocalIsDetailedView] = useState<boolean>(false);

  // Use prop value if provided, otherwise use local state
  const isDetailedView = propIsDetailedView !== undefined ? propIsDetailedView : localIsDetailedView;



  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="card h-full">
            <div className="w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4">
              {/* Card image */}
              <div className="flex items-center justify-center h-full">
                <Image
                  src={card.imageUrl}
                  alt={card.id}
                  width={220}
                  height={220}
                  unoptimized
                  style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold py-2">
              {card.id} <span className="text-xl font-normal text-gray-400">({card.faction.name})</span>
            </h1>

            {/* Card attributes section */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <p className="text-sm text-gray-700 py-1">
                  <span className={`px-2 py-1 rounded border ${getRankColor(card.rank, true)}`}>
                    等级: {card.rank}
                  </span>
                </p>
                <p className="text-sm text-gray-700 py-1">
                  <span className={`px-2 py-1 rounded border ${getCostColor(card.cost, true)}`}>
                    费用: {card.cost}
                  </span>
                </p>
              </div>
            </div>
          </div>
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

          <div className="space-y-6">            <div className="card p-6">
              {/* Card description */}
              <div className="mb-6">
                <p className="text-black text-lg py-2">
                  {renderDescriptionWithHighlights(
                    isDetailedView && card.detailedDescription ? card.detailedDescription : card.description
                  )}
                </p>
              </div>              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {card.levels.map((level) => (
                  <div key={`${card.id}-${level.level}`} className="bg-gray-100 p-4 rounded">
                    <p className="px-2 py-1 text-black">
                      <span className="font-bold">Lv. {level.level}:</span>{' '}
                      {renderDescriptionWithHighlights(
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
