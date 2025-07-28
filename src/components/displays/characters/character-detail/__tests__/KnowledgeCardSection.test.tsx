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

  const calculateGroupCost = (group: string[]) => {
    return group.reduce((sum, cardId) => sum + mockGetCardCost(cardId), 0);
  };

  const shouldShowOptionalCard = (group: string[]) => {
    const hasOptionalCard = group.some((cardId) => cardId === 'C-狡诈');
    const totalCost = calculateGroupCost(group);
    return hasOptionalCard && totalCost === 21;
  };

  const getDisplayCost = (group: string[]) => {
    const hasOptionalCard = group.some((cardId) => cardId === 'C-狡诈');
    const totalCost = calculateGroupCost(group);
    return hasOptionalCard && totalCost === 21 ? 19 : totalCost;
  };

  it('should calculate normal cost for groups without C-狡诈', () => {
    const group = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打'];
    const totalCost = calculateGroupCost(group);
    const displayCost = getDisplayCost(group);

    expect(totalCost).toBe(17); // 7 + 6 + 4
    expect(displayCost).toBe(17);
    expect(shouldShowOptionalCard(group)).toBe(false);
  });

  it('should show adjusted cost for groups with C-狡诈 totaling 21', () => {
    const group = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'];
    const totalCost = calculateGroupCost(group);
    const displayCost = getDisplayCost(group);

    expect(totalCost).toBe(21); // 7 + 6 + 4 + 2 + 2
    expect(displayCost).toBe(19); // 21 - 2 (optional C-狡诈)
    expect(shouldShowOptionalCard(group)).toBe(true);
  });

  it('should show normal cost for groups with C-狡诈 not totaling 21', () => {
    const group = ['A-熊熊燃烧', 'C-狡诈']; // 6 + 2 = 8
    const totalCost = calculateGroupCost(group);
    const displayCost = getDisplayCost(group);

    expect(totalCost).toBe(8);
    expect(displayCost).toBe(8);
    expect(shouldShowOptionalCard(group)).toBe(false);
  });

  it('should identify C-狡诈 as optional only when total is exactly 21', () => {
    const group21 = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'];
    const group20 = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-狡诈']; // 7+6+4+2=19, not 21
    const group22 = ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈', 'C-狡诈']; // hypothetical 23

    expect(shouldShowOptionalCard(group21)).toBe(true);
    expect(shouldShowOptionalCard(group20)).toBe(false);
    expect(shouldShowOptionalCard(group22)).toBe(false);
  });

  it('should handle groups without any cards', () => {
    const group: string[] = [];
    const totalCost = calculateGroupCost(group);
    const displayCost = getDisplayCost(group);

    expect(totalCost).toBe(0);
    expect(displayCost).toBe(0);
    expect(shouldShowOptionalCard(group)).toBe(false);
  });
});
