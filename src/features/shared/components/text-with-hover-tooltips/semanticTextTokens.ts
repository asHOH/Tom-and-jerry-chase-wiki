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

type UnitQuantityToken = {
  type: 'unitQuantity';
  text: string;
  sourceIndex: number;
};

export type SemanticTextToken = InlineClassToken | ExplicitMarkupToken | UnitQuantityToken;

const UNIT_QUANTITY_PATTERN =
  /\d+(?:\.\d+)?\s*(?:单位长(?:度)?|单位距离)(?:\s*[\/／]\s*(?:秒|s))?/g;

const splitUnitQuantities = (text: string, sourceOffset: number): SemanticTextToken[] => {
  const tokens: SemanticTextToken[] = [];
  const pattern = new RegExp(UNIT_QUANTITY_PATTERN.source, 'g');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, match.index),
        sourceIndex: sourceOffset + lastIndex,
      });
    }

    tokens.push({
      type: 'unitQuantity',
      text: match[0],
      sourceIndex: sourceOffset + match.index,
    });

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      text: text.slice(lastIndex),
      sourceIndex: sourceOffset + lastIndex,
    });
  }

  return tokens;
};

const appendTextTokens = (
  tokens: SemanticTextToken[],
  text: string,
  sourceOffset: number,
  enableUnitQuantityTokens: boolean
): void => {
  for (const token of buildInlineClassTokens(text)) {
    if (token.type === 'text' && enableUnitQuantityTokens) {
      tokens.push(...splitUnitQuantities(token.text, sourceOffset + token.sourceIndex));
      continue;
    }

    tokens.push({ ...token, sourceIndex: sourceOffset + token.sourceIndex });
  }
};

export const buildSemanticTextTokens = (
  text: string,
  hasAttackBoost: boolean,
  enableUnitQuantityTokens = true
): SemanticTextToken[] => {
  const tokens: SemanticTextToken[] = [];
  const explicitMarkupPattern = /\{([^}]+?)\}|《([^》]+?)》/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = explicitMarkupPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendTextTokens(
        tokens,
        text.slice(lastIndex, match.index),
        lastIndex,
        enableUnitQuantityTokens
      );
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
    appendTextTokens(tokens, text.slice(lastIndex), lastIndex, enableUnitQuantityTokens);
  }

  return tokens;
};
