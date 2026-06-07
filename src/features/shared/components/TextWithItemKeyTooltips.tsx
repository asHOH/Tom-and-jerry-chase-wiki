import type { ReactNode } from 'react';

import { getStarredItemKeyTooltipContent } from '@/lib/tooltipUtils';
import Tooltip from '@/components/ui/Tooltip';

const ITEM_KEY_MARKER = '道具键*';

type TextWithItemKeyTooltipsProps = {
  text: string;
  isDetailed: boolean;
};

export default function TextWithItemKeyTooltips({
  text,
  isDetailed,
}: TextWithItemKeyTooltipsProps) {
  if (!text.includes(ITEM_KEY_MARKER)) {
    return <>{text}</>;
  }

  const itemKeyPattern = /道具键\*([^（]*)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = itemKeyPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const actionVerb = match[1]?.trim() || '';

    parts.push(
      <Tooltip key={match.index} content={getStarredItemKeyTooltipContent(actionVerb, isDetailed)}>
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
