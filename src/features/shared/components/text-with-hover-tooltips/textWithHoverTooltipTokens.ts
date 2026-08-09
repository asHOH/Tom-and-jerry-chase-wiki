import { replaceBuffIds } from '../replaceBuffIds';
import { preprocessText } from './characterText';
import { endsWithCalculatedDamageMarkup } from './damageDisplay';

type PlainTextPlanPart = {
  type: 'text';
  text: string;
  isHighlighted: boolean;
};

type HoverTooltipPlanPart = {
  type: 'hoverTooltip';
  visibleText: string;
  tooltipContent: string;
  isQuoted: boolean;
  sourceIndex: number;
  matchIndex: number;
  isHighlighted: boolean;
};

export type TextWithHoverTooltipToken = PlainTextPlanPart | HoverTooltipPlanPart;

export type TextWithHoverTooltipTokens = {
  text: string;
  tokens: TextWithHoverTooltipToken[];
};

type MarkdownSplitPart = {
  text: string;
  sourceIndex: number;
  isHighlighted: boolean;
};

const splitMarkdownHighlights = (text: string): MarkdownSplitPart[] => {
  const parts: MarkdownSplitPart[] = [];
  const highlightPattern = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = highlightPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        sourceIndex: parts.length,
        isHighlighted: false,
      });
    }

    parts.push({
      text: match[1] || '',
      sourceIndex: parts.length,
      isHighlighted: true,
    });

    lastIndex = highlightPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      sourceIndex: parts.length,
      isHighlighted: false,
    });
  }

  return parts;
};

const splitHoverTooltips = (part: MarkdownSplitPart): TextWithHoverTooltipToken[] => {
  const tokens: TextWithHoverTooltipToken[] = [];
  const hoverTooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = hoverTooltipPattern.exec(part.text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: part.text.slice(lastIndex, match.index),
        isHighlighted: part.isHighlighted,
      });
    }

    const prevChar = match.index > 0 ? part.text[match.index - 1] : '';
    const nextChar =
      hoverTooltipPattern.lastIndex < part.text.length
        ? part.text[hoverTooltipPattern.lastIndex]
        : '';

    tokens.push({
      type: 'hoverTooltip',
      visibleText: match[1] || '',
      tooltipContent: match[2] || '',
      isQuoted: prevChar === '“' && nextChar === '”',
      sourceIndex: part.sourceIndex,
      matchIndex: match.index,
      isHighlighted: part.isHighlighted,
    });

    lastIndex = hoverTooltipPattern.lastIndex;
  }

  if (lastIndex < part.text.length) {
    tokens.push({
      type: 'text',
      text: part.text.slice(lastIndex),
      isHighlighted: part.isHighlighted,
    });
  }

  return tokens;
};

export const claimHighlightedDamageSuffixes = (
  tokens: TextWithHoverTooltipToken[],
  hasAttackBoost: boolean
): TextWithHoverTooltipToken[] => {
  const claimedTokens = tokens.map((token) => ({ ...token }));

  for (let index = 0; index < claimedTokens.length - 1; index++) {
    const token = claimedTokens[index];
    const nextToken = claimedTokens[index + 1];
    if (
      token?.type !== 'text' ||
      !token.isHighlighted ||
      nextToken?.type !== 'text' ||
      nextToken.isHighlighted ||
      !endsWithCalculatedDamageMarkup(token.text, hasAttackBoost)
    ) {
      continue;
    }

    const suffixMatch = /^(伤害|点伤害)/.exec(nextToken.text);
    if (!suffixMatch) continue;

    token.text += suffixMatch[0];
    nextToken.text = nextToken.text.slice(suffixMatch[0].length);
  }

  return claimedTokens;
};

export const buildTextWithHoverTooltipTokens = (
  rawText: string,
  currentCharacterId: string | undefined
): TextWithHoverTooltipTokens => {
  const text = preprocessText(replaceBuffIds(rawText), currentCharacterId);
  const tokens = splitMarkdownHighlights(text).flatMap(splitHoverTooltips);

  return { text, tokens };
};
