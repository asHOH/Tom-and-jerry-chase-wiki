export const calculateDamageValues = ({
  parsedNumber,
  boost,
  isBaseOnly,
  round,
}: {
  parsedNumber: number;
  boost: number;
  isBaseOnly: boolean;
  round: boolean;
}): { baseValue: number; totalValue: number } => {
  const normalize = (value: number) => (round ? Math.round(value * 100) / 100 : value);

  if (isBaseOnly) {
    return {
      baseValue: parsedNumber,
      totalValue: normalize(parsedNumber + boost),
    };
  }

  return {
    totalValue: parsedNumber,
    baseValue: normalize(parsedNumber - boost),
  };
};

export const orderDamageSuffixes = (displaySuffixes: string[]): string[] => {
  const suffixItems: string[] = [];
  const groups = [
    ['可破盾', '不破盾', '无视护盾'],
    ['可致伤', '不可致伤'],
    ['可攻击泡泡', '不可攻击泡泡'],
    ['无视伤害保护'],
  ];

  for (const group of groups) {
    const matches = displaySuffixes.filter((suffix) => group.includes(suffix));
    if (matches.length > 0) suffixItems.push(...matches);
  }

  return suffixItems;
};
