/**
 * Utility functions for knowledge card calculations and display logic
 */

// Constants for optional card rules
const OPTIONAL_CARD_ID = 'C-狡诈';
const MAX_COST = 21;

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
