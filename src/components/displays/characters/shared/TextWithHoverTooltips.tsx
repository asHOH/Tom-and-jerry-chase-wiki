import React from 'react';
import Tooltip from '../../../ui/Tooltip';

interface TextWithHoverTooltipsProps {
  text: string;
}

export default function TextWithHoverTooltips({ text }: TextWithHoverTooltipsProps) {
  if (!text.includes('[') || !text.includes('](')) {
    return <>{text}</>;
  }

  const tooltipPattern = /\[([^\]]+?)\]\(([^)]+?)\)/g;
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = tooltipPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const visibleText = match[1] || '';
    const tooltipContent = match[2] || '';

    parts.push(
      <Tooltip key={match.index} content={tooltipContent}>
        <span className='underline decoration-dotted cursor-help'>{visibleText}</span>
      </Tooltip>
    );

    lastIndex = tooltipPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}
