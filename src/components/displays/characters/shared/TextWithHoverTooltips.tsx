import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { renderTextWithHighlights } from '../../../../lib/textUtils';

interface TextWithHoverTooltipsProps {
  text: string;
}

export default function TextWithHoverTooltips({ text }: TextWithHoverTooltipsProps) {
  const highlightedParts = renderTextWithHighlights(text);
  const finalParts: (string | React.ReactElement)[] = [];

  highlightedParts.forEach((part, index) => {
    if (typeof part === 'string') {
      const tooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
      let lastIndex = 0;
      let match;

      while ((match = tooltipPattern.exec(part)) !== null) {
        if (match.index > lastIndex) {
          finalParts.push(part.slice(lastIndex, match.index));
        }

        const visibleText = match[1] || '';
        const tooltipContent = match[2] || '';

        finalParts.push(
          <Tooltip key={`${index}-${match.index}`} content={tooltipContent}>
            <span className='underline decoration-dotted cursor-help'>{visibleText}</span>
          </Tooltip>
        );

        lastIndex = tooltipPattern.lastIndex;
      }

      if (lastIndex < part.length) {
        finalParts.push(part.slice(lastIndex));
      }
    } else {
      finalParts.push(part);
    }
  });

  return <>{finalParts}</>;
}
