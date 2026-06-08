import { replaceBuffIds } from '../replaceBuffIds';
import { preprocessText } from './characterText';

type PlainTextPlanPart = {
  type: 'text';
  text: string;
};

type MarkdownHighlightPlanPart = {
  type: 'markdownHighlight';
  text: string;
};

type HoverTooltipPlanPart = {
  type: 'hoverTooltip';
  visibleText: string;
  tooltipContent: string;
  isQuoted: boolean;
  sourceIndex: number;
  matchIndex: number;
};

export type TextWithHoverTooltipToken =
  | PlainTextPlanPart
  | MarkdownHighlightPlanPart
  | HoverTooltipPlanPart;

export type TextWithHoverTooltipTokens = {
  text: string;
  tokens: TextWithHoverTooltipToken[];
};

type MarkdownSplitPart =
  | {
      type: 'text';
      text: string;
      sourceIndex: number;
    }
  | {
      type: 'markdownHighlight';
      text: string;
      sourceIndex: number;
    };

const splitMarkdownHighlights = (text: string): MarkdownSplitPart[] => {
  const parts: MarkdownSplitPart[] = [];
  const highlightPattern = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = highlightPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: text.slice(lastIndex, match.index),
        sourceIndex: parts.length,
      });
    }

    parts.push({
      type: 'markdownHighlight',
      text: match[1] || '',
      sourceIndex: parts.length,
    });

    lastIndex = highlightPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      text: text.slice(lastIndex),
      sourceIndex: parts.length,
    });
  }

  return parts;
};

const splitHoverTooltips = (part: MarkdownSplitPart): TextWithHoverTooltipToken[] => {
  if (part.type === 'markdownHighlight') {
    return [{ type: 'markdownHighlight', text: part.text }];
  }

  const tokens: TextWithHoverTooltipToken[] = [];
  const hoverTooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = hoverTooltipPattern.exec(part.text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: part.text.slice(lastIndex, match.index),
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
    });

    lastIndex = hoverTooltipPattern.lastIndex;
  }

  if (lastIndex < part.text.length) {
    tokens.push({
      type: 'text',
      text: part.text.slice(lastIndex),
    });
  }

  return tokens;
};

export const buildTextWithHoverTooltipTokens = (
  rawText: string,
  currentCharacterId: string | undefined
): TextWithHoverTooltipTokens => {
  const text = preprocessText(replaceBuffIds(rawText), currentCharacterId);
  const tokens = splitMarkdownHighlights(text).flatMap(splitHoverTooltips);

  return { text, tokens };
};
