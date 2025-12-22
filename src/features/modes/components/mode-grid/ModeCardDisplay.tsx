import { designTokens, getModeTypeColors } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Mode } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function ModeCardDisplay({ mode }: { mode: Mode }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  function putTypeTagOn(mode: Mode) {
    return (
      <Tag size='xs' margin='compact' colorStyles={getModeTypeColors(mode.type, isDarkMode)}>
        {mode.type}
      </Tag>
    );
  }

  return (
    <BaseCard variant='item' aria-label={`查看${mode.name}模式详情`}>
      <GameImage
        src={mode.imageUrl}
        alt={`${mode.name}模式图标`}
        size='ITEM_CARD'
        className={`hover:scale-105 ${isMobile ? 'h-32 w-auto' : ''}`}
      />
      <div className={`${isMobile ? '' : 'px-3'} w-full pt-1 pb-3 text-center`}>
        <h3
          className={`${isMobile && mode.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'} font-bold text-gray-800 dark:text-white`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {mode.name}
        </h3>
        <div
          className='modes-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='模式属性'
        >
          {putTypeTagOn(mode)}
        </div>
      </div>
    </BaseCard>
  );
}
