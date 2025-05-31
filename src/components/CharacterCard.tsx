import { PositioningTag } from '@/data';
import { getPositioningTagColor } from '@/lib/cardUtils';
import { CharacterCardProps } from '@/lib/types';
import GameImage from './ui/GameImage';
import Tag from './ui/Tag';
import BaseCard from './ui/BaseCard';

export default function CharacterCard({ id, name, imageUrl, positioningTags, factionId, onClick }: CharacterCardProps) {
  return (
    <BaseCard variant="character" onClick={() => onClick(id)}>
      <GameImage src={imageUrl} alt={name} size="CHARACTER_CARD" />
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold px-2 py-2 mb-2">{name}</h2>

        {/* Positioning tags for both cat and mouse characters */}
        {positioningTags && positioningTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {positioningTags.map((tag, index) => (
              <Tag
                key={index}
                colorClasses={getPositioningTagColor(tag.tagName, tag.isMinor, false, factionId as 'cat' | 'mouse')}
                size="sm"
              >
                {tag.tagName}
              </Tag>
            ))}
          </div>
        )}
      </div>
    </BaseCard>
  );
}
