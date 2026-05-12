import { getModeTypeColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Mode } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function ModeCardDisplay({ mode }: { mode: Mode }) {
  const [isDarkMode] = useDarkMode();

  function putTypeTagOn(mode: Mode) {
    return (
      <Tag size='xs' margin='compact' colorStyles={getModeTypeColors(mode.type, isDarkMode)}>
        {mode.type}
      </Tag>
    );
  }

  return (
    <CatalogCard
      title={mode.name}
      imageSrc={mode.imageUrl}
      imageAlt=''
      href={`/modes/${encodeURIComponent(mode.name)}`}
      ariaLabel={`查看${mode.name}模式详情`}
      tagsAriaLabel='模式属性'
      tagsClassName='modes-center flex flex-wrap justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
      tags={putTypeTagOn(mode)}
    />
  );
}
