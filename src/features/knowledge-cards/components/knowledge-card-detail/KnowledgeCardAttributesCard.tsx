'use client';

import { getCardCostColors, getCardRankColors } from '@/lib/design';
import { KnowledgeCardDetailsProps } from '@/lib/types';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalCard } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

const CARD_RANKS = ['C', 'B', 'A', 'S'] as const;
const CARD_PRIORITIES = ['3级质变', '提升明显', '提升较小', '几乎无提升', '本身无用'] as const;

const replaceCardGroupReference = (
  value: unknown,
  previousKey: string,
  nextKey: string
): unknown => {
  if (typeof value === 'string') return value === previousKey ? nextKey : value;
  if (Array.isArray(value)) {
    return value.map((entry) => replaceCardGroupReference(entry, previousKey, nextKey));
  }
  return value;
};

const replaceCharacterCardReferences = (
  characters: Record<string, unknown>,
  previousKey: string,
  nextKey: string
) => {
  Object.values(characters).forEach((characterValue) => {
    const character = characterValue as { knowledgeCardGroups?: unknown[] };
    character.knowledgeCardGroups?.forEach((groupValue) => {
      const group = groupValue as Record<string, unknown>;
      if (Array.isArray(group.cards)) {
        group.cards = replaceCardGroupReference(group.cards, previousKey, nextKey);
        return;
      }

      if (Array.isArray(group.groups)) {
        group.groups.forEach((nestedGroupValue) => {
          const nestedGroup = nestedGroupValue as Record<string, unknown>;
          if (Array.isArray(nestedGroup.cards)) {
            nestedGroup.cards = replaceCardGroupReference(nestedGroup.cards, previousKey, nextKey);
          }
        });
      }
    });
  });
};

export default function KnowledgeCardAttributesCard({ card }: KnowledgeCardDetailsProps) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode } = useEditMode();
  const { cardId } = useLocalCard();
  const ed = editable('cards');

  const editRuntime = useDraftDataRuntime();
  const rawCard = cardId ? editRuntime?.stores.cards[cardId] : undefined;

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
            <AddAliasButton
              onAdd={() => {
                if (!rawCard) return;
                if (!rawCard.aliases) rawCard.aliases = [];
                if (!rawCard.aliases.includes('新别名')) {
                  rawCard.aliases.push('新别名');
                }
              }}
            />
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            <Tag colorStyles={rankColors} size='sm'>
              等级:{' '}
              {isEditMode ? (
                <select
                  aria-label='知识卡等级'
                  value={card.rank}
                  onChange={(event) => {
                    if (!rawCard || !editRuntime) return;
                    const nextRank = event.target.value as (typeof CARD_RANKS)[number];
                    const previousKey = `${rawCard.rank}-${rawCard.id}`;
                    const nextKey = `${nextRank}-${rawCard.id}`;
                    rawCard.rank = nextRank;
                    if (rawCard.factionId === 'cat' || rawCard.factionId === 'mouse') {
                      rawCard.imageUrl = `/images/${rawCard.factionId}Cards/${nextKey}.png`;
                    }
                    replaceCharacterCardReferences(
                      editRuntime.stores.characters as unknown as Record<string, unknown>,
                      previousKey,
                      nextKey
                    );
                  }}
                  className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
                >
                  {CARD_RANKS.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              ) : (
                card.rank
              )}
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
                {isEditMode ? (
                  <select
                    aria-label='知识卡升级优先级'
                    value={card.priority ?? ''}
                    onChange={(event) => {
                      if (!rawCard) return;
                      const priority = event.target.value;
                      if (priority === '') delete rawCard.priority;
                      else rawCard.priority = priority as (typeof CARD_PRIORITIES)[number];
                    }}
                    className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
                  >
                    <option value=''>未设置</option>
                    {CARD_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                ) : (
                  card.priority
                )}
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
      wikiHistory={
        <SingleItemWikiHistoryDisplay singleItem={{ name: card.id, type: 'knowledgeCard' }} />
      }
    />
  );
}
