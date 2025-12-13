'use client';

import { useDarkMode } from '@/context/DarkModeContext';

import { getCardCostColors, getCardRankColors } from '@/lib/design-tokens';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import AttributesCardLayout from '@/components/displays/shared/AttributesCardLayout';

export default function KnowledgeCardAttributesCard({ card }: KnowledgeCardDetailsProps) {
  const [isDarkMode] = useDarkMode();

  const rankColors = getCardRankColors(card.rank, true, isDarkMode);
  const costColors = getCardCostColors(card.cost, true, isDarkMode);

  return (
    <AttributesCardLayout
      imageUrl={card.imageUrl}
      alt={card.id}
      title={card.id}
      subtitle={`(知识卡${card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={card.aliases}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            <Tag colorStyles={rankColors} size='sm'>
              等级: {card.rank}
            </Tag>
            <Tag colorStyles={costColors} size='sm'>
              费用: {card.cost}
            </Tag>
          </div>
          {card.priority && (
            <span className='text-sm whitespace-pre'>
              {'升级优先级：'}
              <span className='text-fuchsia-600 dark:text-fuchsia-400'>{card.priority}</span>
            </span>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={card.id} specifyType='knowledgeCard' />
        </NavigationButtonsRow>
      }
    />
  );
}
