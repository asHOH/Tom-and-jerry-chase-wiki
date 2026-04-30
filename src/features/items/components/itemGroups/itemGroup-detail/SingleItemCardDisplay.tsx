import { cn } from '@/lib/design';
import { getSingleItemImageUrl } from '@/lib/singleItemTools';
import { useMobile } from '@/hooks/useMediaQuery';
import { SingleItem } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';

export default function SingleItemCardDisplay({ singleItem }: { singleItem: SingleItem }) {
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${singleItem.name}详情`}>
      <GameImage
        src={getSingleItemImageUrl(singleItem)}
        alt={`${singleItem.name}道具图标`}
        size='ITEM_CARD'
        className={cn('hover:scale-105', isMobile && 'h-32 w-auto')}
      />
      <div className='w-full px-3 pt-1 pb-3 text-center'>
        <h3
          className={cn(
            'mb-1 h-6 font-bold whitespace-pre text-gray-800 dark:text-white',
            isMobile && singleItem.name.length >= 6 ? 'text-md' : 'text-lg'
          )}
        >
          {singleItem.name}
        </h3>
      </div>
    </BaseCard>
  );
}
