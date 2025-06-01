import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import GameImage from '../../ui/GameImage';
import Tag from '../../ui/Tag';
import BaseCard from '../../ui/BaseCard';

export default function CharacterDisplay({ id, name, imageUrl, positioningTags, factionId, onClick }: CharacterDisplayProps) {
  return (
    <BaseCard variant="character" onClick={() => onClick(id)}>
      <GameImage src={imageUrl} alt={name} size="CHARACTER_CARD" />
      <div className="px-6 pt-1 pb-6 text-center">
        <h2 className="text-xl font-bold mb-2">{name}</h2>
        {positioningTags && positioningTags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {positioningTags.map((tag, index) => (
              <Tag
                key={index}
                colorStyles={getPositioningTagColors(tag.tagName, tag.isMinor, false, factionId as 'cat' | 'mouse')}
                size="xs"
                variant="compact"
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
