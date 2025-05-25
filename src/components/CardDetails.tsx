import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/data';

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

  // Get rank color based on rank
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'S': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'A': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'B': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'C': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  // Get cost color based on cost
  const getCostColor = (cost: number) => {
    if (cost >= 6) return 'text-red-600 bg-red-100 border-red-300';
    if (cost >= 4) return 'text-orange-600 bg-orange-100 border-orange-300';
    if (cost >= 3) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-green-600 bg-green-100 border-green-300';
  };

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
                  alt={card.name}
                  width={220}
                  height={220}
                  unoptimized
                  style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>

            <h1 className="text-3xl font-bold py-2">
              {card.name} <span className="text-xl font-normal text-gray-400">({card.faction.name})</span>
            </h1>

            {/* Card attributes section */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <p className="text-sm text-gray-700 py-1">
                  <span className={`px-2 py-1 rounded border ${getRankColor(card.rank)}`}>
                    等级: {card.rank}
                  </span>
                </p>
                <p className="text-sm text-gray-700 py-1">
                  <span className={`px-2 py-1 rounded border ${getCostColor(card.cost)}`}>
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

          <div className="space-y-6">
            <div className="card p-6">
              {/* Card description */}
              <div className="mb-6">
                <p className="text-blue-600 text-lg py-2">
                  {isDetailedView && card.detailedDescription ? card.detailedDescription : card.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {card.levels.map((level) => (
                  <div key={`${card.id}-${level.level}`} className="bg-gray-100 p-4 rounded">
                    <p className="px-2 py-1">
                      <span className="font-bold">Lv. {level.level}:</span>{' '}
                      {isDetailedView && level.detailedDescription ?
                        level.detailedDescription :
                        level.description
                      }
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
