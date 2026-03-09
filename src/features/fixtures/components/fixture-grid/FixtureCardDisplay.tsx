import { getFixtureTypeColors } from '@/lib/design';
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
          {fixture.type === 'NPC'
            ? 'NPC'
            : fixture.type === '可交互'
              ? '交互'
              : fixture.type.slice(0, 2)}
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
            {type === 'NPC' ? 'NPC' : type === '可交互' ? '交互' : type.slice(0, 2)}
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
          className={`${isMobile && fixture.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'} h-6 font-bold whitespace-pre text-gray-800 dark:text-white`}
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
