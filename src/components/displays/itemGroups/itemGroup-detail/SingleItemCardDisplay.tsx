import GameImage from '@/components/ui/GameImage';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import { designTokens } from '@/lib/design-tokens';
import { SingleItem } from '@/data/types';
import { getSingleItemImageUrl } from '@/lib/singleItemTools';

export default function SingleItemCardDisplay({ singleItem }: { singleItem: SingleItem }) {
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${singleItem.name}详情`}>
      <GameImage
        src={getSingleItemImageUrl(singleItem)}
        alt={`${singleItem.name}道具图标`}
        size='ITEM_CARD'
        className='hover:scale-105'
        style={isMobile ? { height: '8rem' } : {}}
      />
      <div className='px-3 pt-1 pb-3 text-center w-full'>
        <h3
          className={`${isMobile && singleItem.name.length >= 6 ? 'text-md' : 'text-lg'} font-bold text-gray-800 dark:text-white mb-1`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {singleItem.name}
        </h3>
      </div>
    </BaseCard>
  );
}
