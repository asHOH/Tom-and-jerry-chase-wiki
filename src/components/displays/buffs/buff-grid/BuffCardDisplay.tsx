import { Buff } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { getItemTypeColors } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';

export default function BuffCardDisplay({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  const typeColors = getItemTypeColors(buff.bufftype, isDarkMode);
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${buff.name}效果详情`}>
      {!buff.unuseImage && (
        <GameImage
          src={buff.imageUrl}
          alt={`${buff.name}效果图标`}
          size='ITEM_CARD'
          className='hover:scale-105'
        />
      )}
      <div className='px-3 pt-1 pb-3 text-center w-full'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-1'>{buff.name}</h3>
        <div
          className='flex flex-wrap justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='状态效果属性'
        >
          <Tag size='xs' margin='compact' colorStyles={typeColors}>
            {isMobile ? buff.bufftype.slice(0, 2) : buff.bufftype}
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
