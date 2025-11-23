import { useDarkMode } from '@/context/DarkModeContext';
import { SingleItem } from '@/data/types';

import { getTypeLabelColors } from '@/lib/design-tokens';
import { getSingleItemHref, getSingleItemImageUrl } from '@/lib/singleItemTools';
import Image from '@/components/Image';

interface SingleItemButtonProps {
  singleItem: SingleItem;
}

export default function SingleItemButton({ singleItem }: SingleItemButtonProps) {
  const [isDarkMode] = useDarkMode();

  function getSingleItemButtonColor(singleItem: SingleItem) {
    const getOriginalKey = (key: string): string => {
      const keyMap: Record<string, string> = {
        character: 'character',
        skill: 'character-skill',
        knowledgeCard: 'card',
        specialSkill: 'special-skill-cat',
        item: 'item',
        entity: 'entity',
        buff: 'buff',
      };
      return keyMap[key] || key;
    };
    const typeColorStyles = getTypeLabelColors(getOriginalKey(singleItem.type), isDarkMode);
    return { ...typeColorStyles, borderColor: typeColorStyles.color };
  }

  return (
    <li
      key={singleItem.name}
      className={`flex items-center overflow-hidden rounded-lg border-1 border-dotted transition-colors hover:-translate-y-1`}
      style={getSingleItemButtonColor(singleItem)}
    >
      <a
        href={getSingleItemHref(singleItem)}
        className='flex h-full w-full items-center gap-2 px-2'
        tabIndex={0}
      >
        <Image
          src={getSingleItemImageUrl(singleItem)}
          alt={`${singleItem.name}图标`}
          className='h-10 w-10 object-contain py-0.5'
          width={90}
          height={90}
        />
        <span className='truncate text-sm dark:text-white'>{singleItem.name}</span>
      </a>
    </li>
  );
}
