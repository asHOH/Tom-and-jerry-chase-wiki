import { getPositioningTagColors } from '@/lib/design-tokens';
import { CharacterDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';

export default function CharacterDisplay({
  id,
  name,
  imageUrl,
  positioningTags,
  factionId,
  onClick,
}: CharacterDisplayProps) {
  return (
    <BaseCard
      variant='character'
      onClick={() => onClick(id)}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
      aria-label={`查看${name}角色详情`}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}角色头像`}
        size='CHARACTER_CARD'
        className='hover:scale-105'
      />
      <div className='px-6 pt-1 pb-6 text-center'>
        <h2 className='text-xl font-bold mb-2'>{name}</h2>
        {positioningTags && positioningTags.length > 0 && (
          <div
            className='flex flex-wrap justify-center gap-1 mt-2'
            role='list'
            aria-label='角色定位标签'
          >
            {positioningTags.map((tag, index) => (
              <Tag
                key={index}
                colorStyles={getPositioningTagColors(
                  tag.tagName,
                  tag.isMinor,
                  false,
                  factionId as 'cat' | 'mouse'
                )}
                size='xs'
                variant='compact'
                role='listitem'
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
