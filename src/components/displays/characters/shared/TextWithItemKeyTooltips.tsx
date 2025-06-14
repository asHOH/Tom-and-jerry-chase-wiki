import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { getItemKeyTooltipContent } from '@/lib/tooltipUtils';

interface TextWithItemKeyTooltipsProps {
  text: string;
  isDetailed: boolean;
}

export default function TextWithItemKeyTooltips({
  text,
  isDetailed,
}: TextWithItemKeyTooltipsProps) {
  if (!text.includes('道具键*')) {
    return <>{text}</>;
  }

  const itemKeyPattern = /道具键\*([^（]*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = itemKeyPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const actionVerb = match[1].trim();

    parts.push(
      <Tooltip key={match.index} content={getItemKeyTooltipContent(actionVerb, isDetailed)}>
        道具键*
      </Tooltip>
    );

    if (actionVerb) {
      parts.push(actionVerb);
    }

    lastIndex = itemKeyPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
}
