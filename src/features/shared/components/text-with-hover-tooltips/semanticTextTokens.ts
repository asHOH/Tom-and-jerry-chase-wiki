import { isCalculatedDamageContentText } from './damageDisplay';
import { parseExplicitMarkup, type ParsedExplicitMarkup } from './explicitMarkup';
import { buildInlineClassTokens, type InlineClassToken } from './inlineMarkup';

type ExplicitMarkupToken = {
  type: 'explicitMarkup';
  rawContent: string;
  parsed: ParsedExplicitMarkup;
  sourceIndex: number;
  sourceEnd: number;
};

export type SemanticTextToken = InlineClassToken | ExplicitMarkupToken;

const appendTextTokens = (
  tokens: SemanticTextToken[],
  text: string,
  sourceOffset: number
): void => {
  for (const token of buildInlineClassTokens(text)) {
    tokens.push({ ...token, sourceIndex: sourceOffset + token.sourceIndex });
  }
};

export const buildSemanticTextTokens = (
  text: string,
  hasAttackBoost: boolean
): SemanticTextToken[] => {
  const tokens: SemanticTextToken[] = [];
  const explicitMarkupPattern = /\{([^}]+?)\}|《([^》]+?)》/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = explicitMarkupPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendTextTokens(tokens, text.slice(lastIndex, match.index), lastIndex);
    }

    const rawContent = match[1] ?? match[2] ?? '';
    const parsed = parseExplicitMarkup(rawContent);
    let sourceEnd = explicitMarkupPattern.lastIndex;
    if (isCalculatedDamageContentText(parsed.contentText, hasAttackBoost)) {
      const suffixMatch = /^(伤害|点伤害)/.exec(text.slice(sourceEnd));
      if (suffixMatch) {
        sourceEnd += suffixMatch[0].length;
        explicitMarkupPattern.lastIndex = sourceEnd;
      }
    }

    tokens.push({
      type: 'explicitMarkup',
      rawContent,
      parsed,
      sourceIndex: match.index,
      sourceEnd,
    });
    lastIndex = sourceEnd;
  }

  if (lastIndex < text.length) {
    appendTextTokens(tokens, text.slice(lastIndex), lastIndex);
  }

  return tokens;
};
