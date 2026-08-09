import {
  buildInlineClassTokens,
  extractTextFromInlineClassTokens,
  type InlineClassToken,
} from './inlineMarkup';

export type ParsedExplicitMarkup = {
  isBaseOnly: boolean;
  categoryHint: string | null;
  classTokens: InlineClassToken[];
  contentText: string;
};

const hasBalancedParentheses = (text: string): boolean => {
  let balance = 0;
  for (const character of text) {
    if (character === '(' || character === '（') balance++;
    if (character === ')' || character === '）') balance--;
    if (balance < 0) return false;
  }
  return balance === 0 && (text.endsWith(')') || text.endsWith('）'));
};

const extractBaseNameAndCategoryHint = (
  content: string
): { baseName: string; categoryHint: string | null } => {
  if (hasBalancedParentheses(content)) {
    const lastOpenParen = Math.max(content.lastIndexOf('('), content.lastIndexOf('（'));
    if (lastOpenParen !== -1) {
      return {
        baseName: content.substring(0, lastOpenParen).trim(),
        categoryHint: content.substring(lastOpenParen + 1, content.length - 1).trim(),
      };
    }
  }

  return { baseName: content, categoryHint: null };
};

export const parseExplicitMarkup = (rawContent: string): ParsedExplicitMarkup => {
  const isBaseOnly = rawContent.endsWith('*');
  const content = isBaseOnly ? rawContent.slice(0, -1) : rawContent;
  const { baseName, categoryHint } = extractBaseNameAndCategoryHint(content);
  const classTokens = buildInlineClassTokens(baseName);

  return {
    isBaseOnly,
    categoryHint,
    classTokens,
    contentText: extractTextFromInlineClassTokens(classTokens),
  };
};
