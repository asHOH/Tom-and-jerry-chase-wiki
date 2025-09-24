import { Entity } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { getEntityTypeColors /* , getCardCostColors */ } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import { designTokens } from '@/lib/design-tokens';

export default function EntityCardDisplay({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  //const typeColors = getEntityTypeColors(entity.entitytype, isDarkMode)
  const isMobile = useMobile();

  function putTypeTagOn(entity: Entity) {
    if (typeof entity.entitytype === 'string') {
      return (
        <Tag
          size='xs'
          margin='compact'
          colorStyles={getEntityTypeColors(entity.entitytype, isDarkMode)}
        >
          {entity.entitytype}
        </Tag>
      );
    } else {
      return entity.entitytype.map((type) => {
        return (
          <Tag
            size='xs'
            margin='compact'
            colorStyles={getEntityTypeColors(type, isDarkMode)}
            key={type}
          >
            {type}
          </Tag>
        );
      });
    }
  }

  return (
    <BaseCard variant='item' aria-label={`查看${entity.name}衍生物详情`}>
      <GameImage
        src={entity.imageUrl}
        alt={`${entity.name}衍生物图标`}
        size='ITEM_CARD'
        className='hover:scale-105'
        style={isMobile ? { height: '8rem' } : {}}
      />
      <div className={`${isMobile ? '' : 'px-3'} pt-1 pb-3 text-center w-full`}>
        <h3
          className={`${isMobile && entity.name.length >= 6 ? 'text-md' : 'text-lg mb-1'} font-bold text-gray-800 dark:text-white`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {entity.name}
        </h3>
        <div
          className='flex flex-wrap justify-center entitys-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='衍生物属性'
        >
          {putTypeTagOn(entity)}
        </div>
      </div>
    </BaseCard>
  );
}
