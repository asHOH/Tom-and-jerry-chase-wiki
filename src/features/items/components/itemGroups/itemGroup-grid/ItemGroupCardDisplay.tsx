import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { ItemGroup } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';

import { getItemGroupImageUrl } from './getItemGroupImageUrl';

export default function ItemGroupCardDisplay({ itemGroup }: { itemGroup: ItemGroup }) {
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${itemGroup.name}效果详情`}>
      <GameImage
        src={getItemGroupImageUrl(itemGroup)}
        alt={`${itemGroup.name}效果图标`}
        size='ITEM_CARD'
        className={cn('hover:scale-105', isMobile && 'h-32 w-auto')}
      />
      <div className='w-full px-3 pt-1 pb-3 text-center'>
        <h3
          className={cn(
            'mb-1 h-6 font-bold whitespace-pre text-gray-800 dark:text-white',
            isMobile && itemGroup.name.length >= 6 ? 'text-md' : 'text-lg'
          )}
        >
          {itemGroup.name}
        </h3>
      </div>
    </BaseCard>
  );
}
