import { getFixtureTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Fixture } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function FixtureCardDisplay({ fixture }: { fixture: Fixture }) {
  const [isDarkMode] = useDarkMode();

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
    <CatalogCard
      title={fixture.name}
      imageSrc={fixture.imageUrl}
      imageAlt={`${fixture.name}物件图标`}
      ariaLabel={`查看${fixture.name}物件详情`}
      tagsAriaLabel='物件属性'
      tagsClassName='fixtures-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
      tags={putTypeTagOn(fixture)}
    />
  );
}
