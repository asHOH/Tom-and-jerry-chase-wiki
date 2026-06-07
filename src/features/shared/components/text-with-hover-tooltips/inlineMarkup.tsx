import React from 'react';

import type { RenderTextPart } from './types';

export const renderTextWithClasses = (text: string): RenderTextPart[] => {
  const parts: RenderTextPart[] = [];
  let lastIndex = 0;
  const classPattern = /\$([^$]+)\$([^#]+)#?/g;
  let match;

  while ((match = classPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const content = match[1] || '';
    const className = match[2] || '';

    parts.push(
      <span key={`class-${match.index}`} className={className}>
        {content}
      </span>
    );

    lastIndex = classPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const extractTextFromElements = (elements: RenderTextPart[]): string => {
  return elements
    .map((element) => {
      if (typeof element === 'string') {
        return element;
      }

      const reactElement = element as React.ReactElement<{ children?: React.ReactNode }>;
      if (reactElement.props && reactElement.props.children) {
        if (typeof reactElement.props.children === 'string') {
          return reactElement.props.children;
        }

        if (Array.isArray(reactElement.props.children)) {
          return extractTextFromElements(reactElement.props.children);
        }
      }

      return '';
    })
    .join('');
};

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
        className='text-blue-500'
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
