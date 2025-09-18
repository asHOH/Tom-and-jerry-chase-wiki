import { ItemGroup } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import { designTokens } from '@/lib/design-tokens';
import { getItemGroupImageUrl } from './getItemGroupImageUrl';

export default function ItemGroupCardDisplay({ itemGroup }: { itemGroup: ItemGroup }) {
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${itemGroup.name}效果详情`}>
      <GameImage
        src={getItemGroupImageUrl(itemGroup)}
        alt={`${itemGroup.name}效果图标`}
        size='ITEM_CARD'
        className='hover:scale-105'
        useShortHeight={isMobile ? true : false}
      />
      <div className='px-3 pt-1 pb-3 text-center w-full'>
        <h3
          className={`${isMobile && itemGroup.name.length >= 6 ? 'text-md' : 'text-lg'} font-bold text-gray-800 dark:text-white mb-1`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {itemGroup.name}
        </h3>
      </div>
    </BaseCard>
  );
}
