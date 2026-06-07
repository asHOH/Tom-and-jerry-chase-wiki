import { Fragment } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { renderTextWithHighlights } from '@/lib/textUtils';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import Tooltip from '@/components/ui/Tooltip';
import { characters } from '@/data';

import { replaceBuffIds } from './replaceBuffIds';
import { preprocessText } from './text-with-hover-tooltips/characterText';
import { renderColorfulHighlight } from './text-with-hover-tooltips/inlineMarkup';
import { renderTextWithTooltips } from './text-with-hover-tooltips/renderTextWithTooltips';
import type { RenderTextPart } from './text-with-hover-tooltips/types';

type TextWithHoverTooltipsProps = {
  text: string;
};

const emptyObject = proxy({ attackBoost: 0 });

export default function TextWithHoverTooltips({ text: rawText }: TextWithHoverTooltipsProps) {
  const [isDarkMode] = useDarkMode();
  const intermediateParts: RenderTextPart[] = [];
  const localCharacterCtx = useLocalCharacter();
  const currentCharacterId = localCharacterCtx.characterId;
  const rawLocalCharacter = characters[currentCharacterId];
  const localCharacter = useSnapshot(rawLocalCharacter ?? emptyObject);

  // 1. 先替换 !{buffID} 占位符
  let text = replaceBuffIds(rawText);

  // 2. 再进行自动角色名包裹（preprocessText）
  text = preprocessText(text, currentCharacterId);

  const highlightedParts = renderTextWithHighlights(text); // Handles **bold**

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

        // 检查前后字符是否为中文双引号
        const prevChar = match.index > 0 ? part[match.index - 1] : '';
        const nextChar =
          hoverTooltipPattern.lastIndex < part.length ? part[hoverTooltipPattern.lastIndex] : '';
        const isQuoted = prevChar === '“' && nextChar === '”';

        const visibleRendered = renderTextWithTooltips(
          visibleText,
          localCharacter.attackBoost ?? null,
          index,
          'wallCrackDamageBoost' in localCharacter
            ? localCharacter.wallCrackDamageBoost
            : undefined,
          isDarkMode,
          currentCharacterId
        );

        const tooltipRendered = renderTextWithTooltips(
          tooltipContent,
          localCharacter.attackBoost ?? null,
          index,
          'wallCrackDamageBoost' in localCharacter
            ? localCharacter.wallCrackDamageBoost
            : undefined,
          isDarkMode,
          currentCharacterId
        );

        intermediateParts.push(
          <Tooltip key={`hover-${index}-${match.index}`} content={tooltipRendered}>
            {isQuoted ? (
              <span className='text-orange-500'>{visibleRendered}</span>
            ) : (
              visibleRendered
            )}
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

  const finalParts: RenderTextPart[] = [];

  // Second pass: Handle {visible text} and $class$ patterns using the updated renderTextWithTooltips
  intermediateParts.forEach((part, index) => {
    if (typeof part === 'string') {
      finalParts.push(
        ...renderTextWithTooltips(
          part,
          localCharacter.attackBoost ?? null,
          index,
          'wallCrackDamageBoost' in localCharacter
            ? localCharacter.wallCrackDamageBoost
            : undefined,
          isDarkMode,
          currentCharacterId
        )
      );
    } else {
      finalParts.push(part);
    }
  });

  // 新增：对最终显示的纯文本部分进行橙色高亮（中文双引号、数字、运算符）
  const colorfulHighlightedParts = finalParts.flatMap((part) => {
    if (typeof part === 'string') {
      return renderColorfulHighlight(part);
    }
    return part;
  });

  return (
    <>
      {colorfulHighlightedParts.map((part, index) => (
        <Fragment key={`text-part-${index}`}>{part}</Fragment>
      ))}
    </>
  );
}
