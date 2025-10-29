import { SingleItem } from '@/data/types';
import Image from '@/components/Image';
import { getSingleItemHref, getSingleItemImageUrl } from '@/lib/singleItemTools';
import { getTypeLabelColors } from '@/lib/design-tokens';
import { useDarkMode } from '@/context/DarkModeContext';

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
      className={`flex items-center rounded-lg transition-colors hover:-translate-y-1 border-1 border-dotted overflow-hidden`}
      style={getSingleItemButtonColor(singleItem)}
    >
      <a
        href={getSingleItemHref(singleItem)}
        className='flex items-center gap-2 w-full h-full px-2'
        tabIndex={0}
      >
        <Image
          src={getSingleItemImageUrl(singleItem)}
          alt={`${singleItem.name}图标`}
          className='w-10 h-10 object-contain py-0.5'
          width={90}
          height={90}
        />
        <span className='text-sm dark:text-white truncate'>{singleItem.name}</span>
      </a>
    </li>
  );
}
