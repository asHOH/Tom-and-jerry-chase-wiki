/**
 * Utility functions for knowledge card calculations and display logic
 */

import type { CardGroup } from '@/data/types';

// Constants for optional card rules
const OPTIONAL_CARD_ID = 'C-狡诈';
const MAX_COST = 21;

// Types for tree structure display
export type TreeNode = {
  type: 'card' | 'and-group' | 'or-group';
  cardId?: string; // For type 'card'
  children?: TreeNode[]; // For type 'and-group' or 'or-group'
};

/**
 * Flatten CardGroup into all possible card combinations
 * Example: ['A', [true, 'B', 'C']] → [['A', 'B'], ['A', 'C']]
 */
export function flattenCardGroup(cards: readonly CardGroup[]): string[][] {
  if (cards.length === 0) return [[]];

  const [first, ...rest] = cards;
  const restCombinations = flattenCardGroup(rest);

  if (typeof first === 'string') {
    // Simple card - add it to all rest combinations
    return restCombinations.map((combo) => [first, ...combo]);
  }

  // It's a nested group [boolean, ...CardGroup[]]
  if (!Array.isArray(first) || first.length === 0) {
    return restCombinations;
  }

  const [isOr, ...groupCards] = first as readonly [boolean, ...CardGroup[]];
  let groupCombinations: string[][];

  if (isOr) {
    // OR relationship: treat each item in groupCards as a separate option.
    groupCombinations = groupCards.flatMap((card) => flattenCardGroup([card]));
  } else {
    // AND relationship: items in groupCards are all taken together.
    groupCombinations = flattenCardGroup(groupCards);
  }

  // Combine the group's combinations with the combinations of the rest of the cards.
  const result: string[][] = [];
  for (const groupCombo of groupCombinations) {
    for (const restCombo of restCombinations) {
      result.push([...groupCombo, ...restCombo]);
    }
  }
  return result;
}

/**
 * Calculate the maximum cost among all possible combinations in a CardGroup
 */
export function calculateMaxCostForTree(
  cards: readonly CardGroup[],
  getCardCost: (cardId: string) => number
): number {
  const allCombinations = flattenCardGroup(cards);
  let maxCost = 0;

  for (const combo of allCombinations) {
    const cost = combo.reduce((sum, cardId) => sum + getCardCost(cardId), 0);
    maxCost = Math.max(maxCost, cost);
  }

  return maxCost;
}

/**
 * Convert CardGroup array to tree structure for display
 */
export function buildTreeStructure(cards: readonly CardGroup[]): TreeNode[] {
  const result: TreeNode[] = [];

  for (const card of cards) {
    if (typeof card === 'string') {
      // Simple card
      result.push({ type: 'card', cardId: card });
    } else {
      // Nested group [boolean, ...CardGroup[]]
      const [isOr, ...groupCards] = card;
      const children = buildTreeStructure(groupCards);
      result.push({
        type: isOr ? 'or-group' : 'and-group',
        children,
      });
    }
  }

  return result;
}

export interface KnowledgeCardCostInfo {
  totalCost: number;
  displayCost: number;
  hasOptionalCard: boolean;
  isOptionalActive: boolean;
}

/**
 * Calculate knowledge card costs and determine if any cards should be displayed as optional
 */
export function calculateKnowledgeCardCosts(
  cards: readonly string[],
  getCardCost: (cardId: string) => number
): KnowledgeCardCostInfo {
  const hasOptionalCard = cards.some((cardId) => cardId === OPTIONAL_CARD_ID);
  const totalCost = cards.reduce((sum, cardId) => sum + getCardCost(cardId), 0);
  const isOptionalActive = hasOptionalCard && totalCost === MAX_COST;
  const displayCost = isOptionalActive ? 19 : totalCost;

  return {
    totalCost,
    displayCost,
    hasOptionalCard,
    isOptionalActive,
  };
}

/**
 * Check if a specific card should be displayed as optional
 */
export function isCardOptional(
  cardId: string,
  hasOptionalCard: boolean,
  totalCost: number
): boolean {
  return cardId === OPTIONAL_CARD_ID && hasOptionalCard && totalCost === MAX_COST;
}

/**
 * Generate tooltip content for knowledge card cost display
 */
export function getKnowledgeCardTooltipContent(
  displayCost: number,
  hasOptionalCard: boolean,
  actualCost: number
): string {
  if (displayCost >= 22) {
    return `知识量：${displayCost}点 (超出游戏限制)`;
  } else if (displayCost === 21) {
    return `知识量：${displayCost}点 (需开启+1知识量上限)`;
  } else if (hasOptionalCard && actualCost === MAX_COST) {
    return `知识量：${displayCost}点 (带狡诈需开启+1知识量上限)`;
  } else {
    return `知识量：${displayCost}点`;
  }
}

/**
 * Get knowledge card cost styling based on total cost and optional card status
 */
export function getKnowledgeCardCostStyles(
  displayCost: number,
  hasOptionalCard: boolean,
  actualCost: number
): { containerClass: string; tooltipContent: string } {
  const tooltipContent = getKnowledgeCardTooltipContent(displayCost, hasOptionalCard, actualCost);

  if (displayCost >= 22) {
    return {
      containerClass:
        'border-red-500 bg-red-100 text-red-700 dark:bg-red-900/50 dark:border-red-500/80 dark:text-red-400',
      tooltipContent,
    };
  } else if (displayCost === 21) {
    return {
      containerClass:
        'border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:border-amber-500/80 dark:text-amber-400',
      tooltipContent,
    };
  } else {
    return {
      containerClass:
        'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:border-blue-400/80 dark:text-blue-300',
      tooltipContent,
    };
  }
}
