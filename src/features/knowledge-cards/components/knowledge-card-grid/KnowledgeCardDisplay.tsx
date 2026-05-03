import { getCardCostColors, getCardRankColors } from '@/lib/design';
import { KnowledgeCardDisplayProps } from '@/lib/types';
import { useDarkMode } from '@/context/DarkModeContext';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function KnowledgeCardDisplay({
  id,
  name,
  rank,
  cost,
  imageUrl,
  preload = false,
}: KnowledgeCardDisplayProps & { preload?: boolean }) {
  const [isDarkMode] = useDarkMode();
  const rankColors = getCardRankColors(rank, false, isDarkMode);
  const costColors = getCardCostColors(cost, false, isDarkMode);

  return (
    <CatalogCard
      title={name}
      imageSrc={imageUrl}
      imageAlt={`${name}知识卡图标`}
      href={`/cards/${id}`}
      ariaLabel={`查看${name}知识卡详情，${rank}级，${cost}费`}
      imageSize='KNOWLEDGECARD_CARD'
      preload={preload}
      contentClassName='px-3 pt-1 pb-3 text-center'
      titleClassName='mb-1 text-lg'
      tagsAriaLabel='卡片属性'
      tagsClassName='flex items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
      tags={
        <>
          <Tag colorStyles={rankColors} size='xs' margin='compact'>
            {rank}级
          </Tag>
          <Tag colorStyles={costColors} size='xs' margin='compact'>
            {cost}费
          </Tag>
        </>
      }
    />
  );
}
