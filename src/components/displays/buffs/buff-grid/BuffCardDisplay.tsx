import { Buff } from '@/data/types';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';
import { useDarkMode } from '@/context/DarkModeContext';
import { getBuffClassColors } from '@/lib/design-tokens'; // getBuffTypeColors,
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import { designTokens } from '@/lib/design-tokens';

export default function BuffCardDisplay({ buff }: { buff: Buff }) {
  const [isDarkMode] = useDarkMode();
  //const typeColors = getBuffTypeColors(buff.buffinfluence, isDarkMode);
  const classColors = getBuffClassColors(buff.bufftype, isDarkMode);
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${buff.name}效果详情`}>
      {!buff.unuseImage && (
        <GameImage
          src={buff.imageUrl}
          alt={`${buff.name}效果图标`}
          size='ITEM_CARD'
          className='hover:scale-105'
          style={isMobile ? { height: '8rem' } : {}}
        />
      )}
      <div
        className={`px-3 pt-1 pb-3 text-center w-full ${buff.unuseImage && `border border-dashed border-blue-500`}`}
      >
        <h3
          className={`${isMobile && buff.name.length >= 6 ? 'text-md' : 'text-lg'} font-bold text-gray-800 dark:text-white mb-1`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {buff.name}
        </h3>
        <div
          className='flex flex-wrap justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='状态属性'
        >
          <Tag size='xs' margin='compact' colorStyles={classColors}>
            {/*isMobile ? buff.buffinfluence.slice(0, 2) : buff.buffinfluence*/ buff.bufftype}
          </Tag>
          <Tag size='xs' margin='compact' colorStyles={{ color: '', background: '' }}>
            {/*isMobile ? buff.buffinfluence.slice(0, 2) : buff.buffinfluence*/ buff.buffinfluence}
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
