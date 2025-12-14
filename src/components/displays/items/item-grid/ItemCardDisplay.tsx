import { useDarkMode } from '@/context/DarkModeContext';
import { Item } from '@/data/types';

import {
  designTokens,
  getItemSourceColors /* , getCardCostColors */,
  getItemTypeColors,
} from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function ItemCardDisplay({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const typeColors = getItemTypeColors(item.itemtype, isDarkMode);
  const sourceColors = getItemSourceColors(item.itemsource, isDarkMode);
  const isMobile = useMobile();
  // const damageColors = getCardCostColors(item.damage ?? 0, false, isDarkMode);
  // const wallDamageColors = getCardCostColors(item.walldamage ?? 0, false, isDarkMode);

  return (
    <BaseCard variant='item' aria-label={`查看${item.name}道具详情`}>
      <GameImage
        src={item.imageUrl}
        alt={`${item.name}道具图标`}
        size='ITEM_CARD'
        className={`hover:scale-105 ${isMobile ? 'h-32' : ''}`}
      />
      <div className='w-full px-3 pt-1 pb-3 text-center'>
        <h3
          className={`${isMobile && item.name.length >= 6 ? 'text-md' : 'text-lg'} mb-1 font-bold text-gray-800 dark:text-white`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {item.name}
        </h3>
        <div
          className='flex flex-wrap items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='道具属性'
        >
          <Tag size='xs' margin='compact' colorStyles={typeColors}>
            {item.itemtype.slice(0, 2)}
          </Tag>
          <Tag size='xs' margin='compact' colorStyles={sourceColors}>
            {item.itemsource.slice(0, 2)}
          </Tag>
          {/* {typeof item.damage === 'number' && (
            <Tag size='xs' variant='compact' colorStyles={damageColors}>
              伤害: {item.damage}
            </Tag>
          )}
          {typeof item.walldamage === 'number' && (
            <Tag size='xs' variant='compact' colorStyles={wallDamageColors}>
              墙伤害: {item.walldamage}
            </Tag>
          )} */}
        </div>
      </div>
    </BaseCard>
  );
}
