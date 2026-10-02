import isEqual from 'lodash-es/isEqual';

import type { DeepReadonly } from '@/types/deep-readonly';
import type { CardGroup, KnowledgeCardGroup, KnowledgeCardGroupSet } from '@/data/types';

export const KNOWLEDGE_CARD_GROUP_COST_MESSAGE = '修改后的知识卡组每种组合的总知识量必须为18-21。';

/** Sum AND branches and compare OR branches without expanding every combination. */
export function getKnowledgeCardGroupCostRange(
  cards: readonly CardGroup[],
  getCardCost: (cardId: string) => number
): { min: number; max: number } {
  return cards.reduce(
    (total, card) => {
      let range;
      if (typeof card === 'string') {
        const cost = getCardCost(card);
        range = { min: cost, max: cost };
      } else {
        const [isOr, ...children] = card;
        range = isOr
          ? children.reduce(
              (options, child) => {
                const cost = getKnowledgeCardGroupCostRange([child], getCardCost);
                return {
                  min: Math.min(options.min, cost.min),
                  max: Math.max(options.max, cost.max),
                };
              },
              { min: Infinity, max: -Infinity }
            )
          : getKnowledgeCardGroupCostRange(children, getCardCost);
      }
      return { min: total.min + range.min, max: total.max + range.max };
    },
    { min: 0, max: 0 }
  );
}

export function isKnowledgeCardGroupCostValid(range: { min: number; max: number }): boolean {
  return (
    Number.isFinite(range.min) && Number.isFinite(range.max) && range.min >= 18 && range.max <= 21
  );
}

type GroupEntry = DeepReadonly<KnowledgeCardGroup | KnowledgeCardGroupSet>;
type CharacterGroups = Readonly<
  Record<string, { readonly knowledgeCardGroups?: readonly GroupEntry[] }>
>;

function leafGroups(groups: readonly GroupEntry[]) {
  return groups.flatMap((group, index) =>
    'groups' in group
      ? group.groups.map((inner, innerIndex) => ({
          group: inner,
          path: `knowledgeCardGroups.${index}.groups.${innerIndex}`,
        }))
      : [{ group, path: `knowledgeCardGroups.${index}` }]
  );
}

/** Existing unchanged groups remain valid even when insertions or removals move their indices. */
export function findInvalidModifiedKnowledgeCardGroup(
  before: CharacterGroups,
  after: CharacterGroups,
  actionPaths: readonly string[],
  getCardCost: (cardId: string) => number
): string | undefined {
  const roots = new Set(
    actionPaths
      .filter((path) => {
        const field = path.split('.')[1];
        return field === undefined || field === 'knowledgeCardGroups';
      })
      .map((path) => path.split('.')[0]!)
  );
  for (const root of roots) {
    const unchanged = leafGroups(before[root]?.knowledgeCardGroups ?? []).map(({ group }) => group);
    for (const { group, path } of leafGroups(after[root]?.knowledgeCardGroups ?? [])) {
      const match = unchanged.findIndex((previous) => isEqual(previous, group));
      if (match !== -1) {
        unchanged.splice(match, 1);
        continue;
      }
      if (
        !isKnowledgeCardGroupCostValid(
          getKnowledgeCardGroupCostRange(group.cards as readonly CardGroup[], getCardCost)
        )
      ) {
        return `${root}.${path}.cards`;
      }
    }
  }
  return undefined;
}
