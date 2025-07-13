import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { renderTextWithHighlights } from '../../../../lib/textUtils';

/**
 * Parse and render text with tooltips for patterns like {visible text}
 * The text inside the brackets will be shown as visible text and also as tooltip content.
 * @param text - Text to parse and add tooltips to
 * @returns JSX elements with tooltip-enabled portions
 */
export const renderTextWithTooltips = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const tooltipPattern = /\{([^}]+?)\}/g;
  let match;

  while ((match = tooltipPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const visibleText = match[1] || '';
    const tooltipContent = match[1] || ''; // Tooltip content is the same as visible text

    parts.push(
      <Tooltip key={match.index} content={tooltipContent}>
        <span className='cursor-help'>{visibleText}</span>
      </Tooltip>
    );

    lastIndex = tooltipPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

interface TextWithHoverTooltipsProps {
  text: string;
}

export default function TextWithHoverTooltips({ text }: TextWithHoverTooltipsProps) {
  const highlightedParts = renderTextWithHighlights(text); // Handles **bold**
  const intermediateParts: (string | React.ReactElement)[] = [];

  // First pass: Handle [visible text](tooltip content)
  highlightedParts.forEach((part, index) => {
    if (typeof part === 'string') {
      const hoverTooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
      let lastIndex = 0;
      let match;

      while ((match = hoverTooltipPattern.exec(part)) !== null) {
        if (match.index > lastIndex) {
          intermediateParts.push(part.slice(lastIndex, match.index));
        }

        const visibleText = match[1] || '';
        const tooltipContent = match[2] || '';

        intermediateParts.push(
          <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
            <span className='cursor-help'>{visibleText}</span>
          </Tooltip>
        );

        lastIndex = hoverTooltipPattern.lastIndex;
      }

      if (lastIndex < part.length) {
        intermediateParts.push(part.slice(lastIndex));
      }
    } else {
      intermediateParts.push(part);
    }
  });

  const finalParts: (string | React.ReactElement)[] = [];

  // Second pass: Handle {visible text} using the moved renderTextWithTooltips
  intermediateParts.forEach((part) => {
    if (typeof part === 'string') {
      finalParts.push(...renderTextWithTooltips(part));
    } else {
      finalParts.push(part);
    }
  });

  return <>{finalParts}</>;
}
