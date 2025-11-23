'use client';

import { useDarkMode } from '@/context/DarkModeContext';

import {
  componentTokens,
  designTokens,
  getCardCostColors,
  getCardRankColors,
} from '@/lib/design-tokens';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { useMobile } from '@/hooks/useMediaQuery';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

import BaseCard from '../../../ui/BaseCard';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';

export default function KnowledgeCardAttributesCard({ card }: KnowledgeCardDetailsProps) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();
  const spacing = designTokens.spacing;

  const rankColors = getCardRankColors(card.rank, true, isDarkMode);
  const costColors = getCardCostColors(card.cost, true, isDarkMode);

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className={`auto-fit-grid grid-container grid`}
            style={{
              gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
            }}
          >
            <GameImage
              src={card.imageUrl}
              alt={card.id}
              size={'CARD_DETAILS'}
              style={{
                height: isMobile ? '6rem' : undefined,
                borderRadius: componentTokens.image.container.borderRadius.replace(/ .*? /, ' 0 '),
              }}
            />
            <div>
              <h1
                className='text-2xl font-bold dark:text-white'
                style={{
                  paddingTop: spacing.xs,
                }}
              >
                {card.id}{' '}
              </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (知识卡{card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {card.aliases !== undefined && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {(card.aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div
          style={{
            paddingBottom: spacing.xxxxxs,
          }}
        >
          <GameImage src={card.imageUrl} alt={card.id} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.xs,
            }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>
              {card.id}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (知识卡{card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {card.aliases !== undefined && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {(card.aliases ?? []).filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}

      {/* Card attributes section */}
      <div
        className='grid items-center gap-1 border-t border-gray-300 dark:border-gray-600'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xxxxxs,
          paddingBottom: spacing.xxxxxs,
        }}
      >
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className={`text-sm whitespace-pre`}>类型：</span>
          <Tag colorStyles={rankColors} size='sm'>
            等级: {card.rank}
          </Tag>
          <Tag colorStyles={costColors} size='sm'>
            费用: {card.cost}
          </Tag>
        </div>
        {card.priority && (
          <span className={`text-sm whitespace-pre`}>
            {'升级优先级：'}
            <span className='text-fuchsia-600 dark:text-fuchsia-400'>{card.priority}</span>
          </span>
        )}
      </div>

      {/*Navigation */}
      <div
        className='flex flex-wrap items-center border-t border-gray-300 text-sm dark:border-gray-600'
        style={{
          gap: spacing.sm,
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.md,
        }}
      >
        <SpecifyTypeNavigationButtons currentId={card.id} specifyType='knowledgeCard' />
      </div>
    </BaseCard>
  );
}
