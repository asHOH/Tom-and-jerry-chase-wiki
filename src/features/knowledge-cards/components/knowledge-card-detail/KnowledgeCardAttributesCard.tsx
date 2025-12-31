'use client';

import { getCardCostColors, getCardRankColors } from '@/lib/design-tokens';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalCard } from '@/context/EditModeContext';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { cardsEdit } from '@/data';

export default function KnowledgeCardAttributesCard({ card }: KnowledgeCardDetailsProps) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode } = useEditMode();
  const { cardId } = useLocalCard();
  const ed = editable('cards');

  const rawCard = cardId ? cardsEdit[cardId] : undefined;

  const rankColors = getCardRankColors(card.rank, true, isDarkMode);
  const costColors = getCardCostColors(card.cost, true, isDarkMode);

  return (
    <AttributesCardLayout
      imageUrl={card.imageUrl}
      alt={card.id}
      title={card.id}
      subtitle={`(知识卡${card.factionId === 'cat' ? '·猫' : card.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={isEditMode ? undefined : card.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(rawCard?.aliases ?? card.aliases ?? []).length > 0 ? (
              (rawCard?.aliases ?? card.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawCard) return;
                      if (!rawCard.aliases) rawCard.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawCard.aliases = rawCard.aliases.filter((_, i) => i !== index);
                      } else {
                        rawCard.aliases[index] = trimmed;
                      }
                    }}
                  />
                  {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                </span>
              ))
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <button
              type='button'
              aria-label='添加别名'
              onClick={() => {
                if (!rawCard) return;
                if (!rawCard.aliases) rawCard.aliases = [];
                if (!rawCard.aliases.includes('新别名')) {
                  rawCard.aliases.push('新别名');
                }
              }}
              className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
            >
              <PlusIcon className='h-3 w-3' aria-hidden='true' />
            </button>
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            <Tag colorStyles={rankColors} size='sm'>
              等级:{' '}
              <ed.span
                path='rank'
                initialValue={card.rank ?? '<无内容>'}
                valueType='number'
                isSingleLine
              />
            </Tag>
            <Tag colorStyles={costColors} size='sm'>
              费用:{' '}
              <ed.span
                path='cost'
                initialValue={card.cost ?? '<无内容>'}
                valueType='number'
                isSingleLine
              />
            </Tag>
          </div>
          {(isEditMode || card.priority) && (
            <span className='text-sm whitespace-pre'>
              {'升级优先级：'}
              <span className='text-fuchsia-600 dark:text-fuchsia-400'>
                <ed.span
                  path='priority'
                  initialValue={card.priority ?? '<无内容>'}
                  valueType='number'
                  isSingleLine
                />
              </span>
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
