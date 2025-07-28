import {
  calculateKnowledgeCardCosts,
  isCardOptional,
  getKnowledgeCardTooltipContent,
} from '@/lib/knowledgeCardSectionUtils';

describe('KnowledgeCardSection - C-狡诈 Optional Card Logic', () => {
  // Test the core logic for handling C-狡诈 as optional card

  const mockGetCardCost = (cardId: string) => {
    const costs: Record<string, number> = {
      'S-乘胜追击': 7,
      'A-熊熊燃烧': 6,
      'A-穷追猛打': 4,
      'C-猫是液体': 2,
      'C-狡诈': 2,
    };
    return costs[cardId] || 0;
  };

  it('should calculate normal cost for groups without C-狡诈', () => {
    const group = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打'];
    const costInfo = calculateKnowledgeCardCosts(group, mockGetCardCost);

    expect(costInfo.totalCost).toBe(17); // 7 + 6 + 4
    expect(costInfo.displayCost).toBe(17);
    expect(costInfo.hasOptionalCard).toBe(false);
    expect(costInfo.isOptionalActive).toBe(false);
  });

  it('should show adjusted cost for groups with C-狡诈 totaling 21', () => {
    const group = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'];
    const costInfo = calculateKnowledgeCardCosts(group, mockGetCardCost);

    expect(costInfo.totalCost).toBe(21); // 7 + 6 + 4 + 2 + 2
    expect(costInfo.displayCost).toBe(19); // 21 - 2 (optional C-狡诈)
    expect(costInfo.hasOptionalCard).toBe(true);
    expect(costInfo.isOptionalActive).toBe(true);
  });

  it('should show normal cost for groups with C-狡诈 not totaling 21', () => {
    const group = ['A-熊熊燃烧', 'C-狡诈']; // 6 + 2 = 8
    const costInfo = calculateKnowledgeCardCosts(group, mockGetCardCost);

    expect(costInfo.totalCost).toBe(8);
    expect(costInfo.displayCost).toBe(8);
    expect(costInfo.hasOptionalCard).toBe(true);
    expect(costInfo.isOptionalActive).toBe(false);
  });

  it('should identify C-狡诈 as optional only when total is exactly 21', () => {
    expect(isCardOptional('C-狡诈', true, 21)).toBe(true);
    expect(isCardOptional('C-狡诈', true, 19)).toBe(false);
    expect(isCardOptional('C-狡诈', false, 21)).toBe(false);
    expect(isCardOptional('A-熊熊燃烧', true, 21)).toBe(false);
  });

  it('should handle groups without any cards', () => {
    const group: string[] = [];
    const costInfo = calculateKnowledgeCardCosts(group, mockGetCardCost);

    expect(costInfo.totalCost).toBe(0);
    expect(costInfo.displayCost).toBe(0);
    expect(costInfo.hasOptionalCard).toBe(false);
    expect(costInfo.isOptionalActive).toBe(false);
  });

  it('should generate correct tooltip content', () => {
    expect(getKnowledgeCardTooltipContent(19, true, 21)).toBe(
      '知识量：19点 (带狡诈需开启+1知识量上限)'
    );
    expect(getKnowledgeCardTooltipContent(21, false, 21)).toBe('知识量：21点 (需开启+1知识量上限)');
    expect(getKnowledgeCardTooltipContent(22, false, 22)).toBe('知识量：22点 (超出游戏限制)');
    expect(getKnowledgeCardTooltipContent(15, false, 15)).toBe('知识量：15点');
  });
});
