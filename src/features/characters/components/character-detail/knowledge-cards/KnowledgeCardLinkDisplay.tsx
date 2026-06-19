import { cn, getCardRankColors } from '@/lib/design';
import Tag from '@/components/ui/Tag';
import GotoLink from '@/components/GotoLink';
import Image from '@/components/Image';

import PriorityWarningBadge from './PriorityWarningBadge';

export type KnowledgeCardLinkVariant = 'tag' | 'image';

type KnowledgeCardLinkDisplayProps = {
  cardId: string;
  variant: KnowledgeCardLinkVariant;
  imageBasePath: string;
  isOptional: boolean;
  isEditMode: boolean;
  isDarkMode: boolean;
  characterId: string;
  getCardRank: (cardId: string) => string;
  handleSelectCard: (cardName: string, characterId: string) => void;
  priorityWarning: string | null;
};

export default function KnowledgeCardLinkDisplay({
  cardId,
  variant,
  imageBasePath,
  isOptional,
  isEditMode,
  isDarkMode,
  characterId,
  getCardRank,
  handleSelectCard,
  priorityWarning,
}: KnowledgeCardLinkDisplayProps) {
  const cardName = cardId.split('-')[1]!;
  const cardRank = getCardRank(cardId);
  const rankColors = getCardRankColors(cardRank, false, isDarkMode);

  const handleClick = () => {
    if (isEditMode) return;
    handleSelectCard(cardName, characterId);
  };

  if (variant === 'tag') {
    return (
      <span className={cn('relative inline-flex', priorityWarning && 'pr-2')}>
        <GotoLink name={cardName} categoryHint='知识卡' className='no-underline' asPreviewOnly>
          <span onClick={handleClick} className='cursor-pointer'>
            <Tag
              colorStyles={rankColors}
              size='sm'
              margin='compact'
              className={cn(
                'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                isOptional && 'opacity-50'
              )}
            >
              {cardName}
            </Tag>
          </span>
        </GotoLink>
        {priorityWarning && <PriorityWarningBadge content={priorityWarning} />}
      </span>
    );
  }

  return (
    <div className='relative inline-flex'>
      <GotoLink
        name={cardName}
        categoryHint='知识卡'
        className='no-underline'
        asPreviewOnly
        hideImagePreview
      >
        <div
          className={cn(
            'relative h-20 w-20 cursor-pointer transition-transform duration-200 hover:scale-105 sm:h-24 sm:w-24',
            isOptional && 'opacity-50'
          )}
          onClick={handleClick}
        >
          <Image
            src={`${imageBasePath}${cardId}.png`}
            alt={cardId}
            fill
            className='object-contain'
          />
        </div>
      </GotoLink>
      {priorityWarning && <PriorityWarningBadge content={priorityWarning} placement='image' />}
    </div>
  );
}
