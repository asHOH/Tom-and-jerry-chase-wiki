'use client';

import { useDarkMode } from '@/context/DarkModeContext';

import { getCardCostColors, getCardRankColors } from '@/lib/design-tokens';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { useMobile } from '@/hooks/useMediaQuery';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

import BaseCard from '../../../ui/BaseCard';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';

export default function KnowledgeCardAttributesCard({ card }: KnowledgeCardDetailsProps) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  const rankColors = getCardRankColors(card.rank, true, isDarkMode);
  const costColors = getCardCostColors(card.cost, true, isDarkMode);

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className='auto-fit-grid grid-container grid'
            style={{ gridTemplateColumns: '5rem repeat(auto-fit, minmax(1px,1fr))' }}
          >
            <GameImage
              src={card.imageUrl}
              alt={card.id}
              size={'CARD_DETAILS'}
              className='h-24 rounded-tl-lg'
            />
            <div>
              <h1 className='pt-2 text-2xl font-bold dark:text-white'>{card.id} </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (知识卡{card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {card.aliases !== undefined && (
                <h1 className='text-xs text-gray-400 dark:text-gray-500'>
                  别名: {(card.aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div className='pb-1'>
          <GameImage src={card.imageUrl} alt={card.id} size={'CARD_DETAILS'} />
          <div className='px-4 pt-2'>
            <h1 className='text-3xl font-bold dark:text-white'>
              {card.id}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (知识卡{card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {card.aliases !== undefined && (
            <div className='mx-4 text-sm text-gray-400 dark:text-gray-500'>
              别名: {(card.aliases ?? []).filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}

      {/* Card attributes section */}
      <div className='mx-4 grid items-center gap-1 border-t border-gray-300 py-1 dark:border-gray-600'>
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
      </div>

      {/*Navigation */}
      <div className='mx-4 flex flex-wrap items-center gap-3 border-t border-gray-300 pt-2 pb-4 text-sm dark:border-gray-600'>
        <SpecifyTypeNavigationButtons currentId={card.id} specifyType='knowledgeCard' />
      </div>
    </BaseCard>
  );
}
