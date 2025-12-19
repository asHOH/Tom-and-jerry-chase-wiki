import { designTokens, getFixtureTypeColors } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Fixture } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function FixtureCardDisplay({ fixture }: { fixture: Fixture }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  function putTypeTagOn(fixture: Fixture) {
    if (typeof fixture.type === 'string') {
      return (
        <Tag
          size='xs'
          margin='compact'
          colorStyles={getFixtureTypeColors(fixture.type, isDarkMode)}
        >
          {fixture.type}
        </Tag>
      );
    } else {
      return fixture.type.map((type) => {
        return (
          <Tag
            size='xs'
            margin='compact'
            colorStyles={getFixtureTypeColors(type, isDarkMode)}
            key={type}
          >
            {type}
          </Tag>
        );
      });
    }
  }

  return (
    <BaseCard variant='item' aria-label={`查看${fixture.name}物件详情`}>
      <GameImage
        src={fixture.imageUrl}
        alt={`${fixture.name}物件图标`}
        size='ITEM_CARD'
        className={`hover:scale-105 ${isMobile ? 'h-32 w-auto' : ''}`}
      />
      <div className={`${isMobile ? '' : 'px-3'} w-full pt-1 pb-3 text-center`}>
        <h3
          className={`${isMobile && fixture.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'} font-bold text-gray-800 dark:text-white`}
          style={{ whiteSpace: 'pre', height: designTokens.spacing.lg }}
        >
          {fixture.name}
        </h3>
        <div
          className='fixtures-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='物件属性'
        >
          {putTypeTagOn(fixture)}
        </div>
      </div>
    </BaseCard>
  );
}
