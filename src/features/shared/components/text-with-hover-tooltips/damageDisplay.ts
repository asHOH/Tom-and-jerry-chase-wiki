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

const numericDamagePattern = /^-?\d+(?:\.\d+)?$/;

/**
 * Whether the final explicit marker in a text token renders its own `伤害` suffix.
 * Keep this aligned with the numeric damage branches in renderTextWithTooltips.
 */
export const endsWithCalculatedDamageMarkup = (text: string, hasAttackBoost: boolean): boolean => {
  const markerMatch = /(?:\{([^{}]+)\}|《([^《》]+)》)$/.exec(text);
  let content = markerMatch?.[1] ?? markerMatch?.[2];
  if (!content) return false;

  if (content.endsWith('*')) {
    content = content.slice(0, -1);
  }

  const isWallCrackDamage = content.startsWith('_');
  if (isWallCrackDamage) {
    content = content.slice(1);
  } else if (!hasAttackBoost || content.includes('+')) {
    return false;
  }

  let numericPart = content.split(',')[0]?.trim() ?? '';
  if (numericPart.endsWith('*')) {
    numericPart = numericPart.slice(0, -1);
  }

  return numericDamagePattern.test(numericPart);
};
