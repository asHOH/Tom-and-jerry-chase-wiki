import type { RenderTextPart } from './types';

export type InlineClassToken =
  | {
      type: 'text';
      text: string;
      sourceIndex: number;
    }
  | {
      type: 'styledText';
      text: string;
      className: string;
      sourceIndex: number;
    };

export const buildInlineClassTokens = (text: string): InlineClassToken[] => {
  const tokens: InlineClassToken[] = [];
  let lastIndex = 0;
  const classPattern = /\$([^$]+)\$([^#]+)#?/g;
  let match: RegExpExecArray | null;

  while ((match = classPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        text: text.slice(lastIndex, match.index),
        sourceIndex: lastIndex,
      });
    }

    tokens.push({
      type: 'styledText',
      text: match[1] || '',
      className: match[2] || '',
      sourceIndex: match.index,
    });

    lastIndex = classPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: text.slice(lastIndex), sourceIndex: lastIndex });
  }

  return tokens;
};

export const extractTextFromInlineClassTokens = (tokens: InlineClassToken[]): string =>
  tokens.map((token) => token.text).join('');

export const renderInlineClassTokens = (
  tokens: InlineClassToken[],
  keyPrefix: string = 'class'
): RenderTextPart[] =>
  tokens.map((token) =>
    token.type === 'text' ? (
      token.text
    ) : (
      <span key={`${keyPrefix}-${token.sourceIndex}`} className={token.className}>
        {token.text}
      </span>
    )
  );

const applyDoubleQuotesOrange = (text: string): RenderTextPart[] => {
  const parts: RenderTextPart[] = [];
  const regex = /(“)([^”]*?)(”)/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(match[1] || '');
    parts.push(
      <span key={`quote-${lastIndex}-${match.index}-${match[2]}`} className='text-orange-500'>
        {match[2]}
      </span>
    );
    parts.push(match[3] || '');
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

const applyNumbersAndOperatorsOrange = (text: string, index: number): RenderTextPart[] => {
  const parts: RenderTextPart[] = [];
  const regex = /(\d+(?:\.\d+)?)|([+\-×÷±%])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(
      <span
        key={`numop-${lastIndex}-${match.index}-${match[0]}-${index}`}
        className='text-blue-500 dark:text-sky-300'
      >
        {match[0]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const renderColorfulHighlight = (text: string): RenderTextPart[] => {
  const quotedParts = applyDoubleQuotesOrange(text);
  const result: RenderTextPart[] = [];

  for (const [index, part] of quotedParts.entries()) {
    if (typeof part === 'string') {
      result.push(...applyNumbersAndOperatorsOrange(part, index));
    } else {
      result.push(part);
    }
  }

  return result;
};
