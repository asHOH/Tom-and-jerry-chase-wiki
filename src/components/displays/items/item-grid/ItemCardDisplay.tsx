import { Item } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import {
  getItemTypeColors,
  getItemSourceColors /* , getCardCostColors */,
} from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';

export default function ItemCardDisplay({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const typeColors = getItemTypeColors(item.itemtype, isDarkMode);
  const sourceColors = getItemSourceColors(item.itemsource, isDarkMode);
  const isMobile = useMobile();
  // const damageColors = getCardCostColors(item.damage ?? 0, false, isDarkMode);
  // const wallDamageColors = getCardCostColors(item.walldamage ?? 0, false, isDarkMode);

  return (
    <div
      className='bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-700 flex flex-col items-center'
      tabIndex={0}
      role='button'
      aria-label={`查看${item.name}道具详情`}
    >
      <GameImage
        src={item.imageUrl}
        alt={`${item.name}道具图标`}
        size='KNOWLEDGECARD_CARD'
        className='hover:scale-105'
      />
      <div className='px-3 pt-1 pb-3 text-center w-full'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-1'>{item.name}</h3>
        <div
          className='flex flex-wrap justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='道具属性'
        >
          <Tag size='xs' variant='compact' colorStyles={typeColors}>
            {isMobile ? item.itemtype.slice(0, 2) : item.itemtype}
          </Tag>
          <Tag size='xs' variant='compact' colorStyles={sourceColors}>
            {isMobile ? item.itemsource.slice(0, 2) : item.itemsource}
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
    </div>
  );
}
