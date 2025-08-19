import { Entity } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { getEntityTypeColors /* , getCardCostColors */ } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';

export default function EntityCardDisplay({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const typeColors = getEntityTypeColors(entity.entitytype, isDarkMode);
  const isMobile = useMobile();
  // const damageColors = getCardCostColors(entity.damage ?? 0, false, isDarkMode);
  // const wallDamageColors = getCardCostColors(entity.walldamage ?? 0, false, isDarkMode);

  return (
    <BaseCard variant='item' aria-label={`查看${entity.name}衍生物详情`}>
      <GameImage
        src={entity.imageUrl}
        alt={`${entity.name}衍生物图标`}
        size='ITEM_CARD'
        className='hover:scale-105'
      />
      <div className='px-3 pt-1 pb-3 text-center w-full'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-1'>{entity.name}</h3>
        <div
          className='flex flex-wrap justify-center entitys-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='衍生物属性'
        >
          <Tag size='xs' variant='compact' colorStyles={typeColors}>
            {isMobile ? entity.entitytype.slice(0, 2) : entity.entitytype}
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
