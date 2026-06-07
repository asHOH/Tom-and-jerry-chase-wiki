import { Fragment, useMemo } from 'react';
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

const shouldMeasureTooltipParsing = (): boolean => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem('tjwiki:measureTextWithHoverTooltips') === '1';
  } catch {
    return false;
  }
};

const getCurrentTime = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

export default function TextWithHoverTooltips({ text: rawText }: TextWithHoverTooltipsProps) {
  const [isDarkMode] = useDarkMode();
  const localCharacterCtx = useLocalCharacter();
  const currentCharacterId = localCharacterCtx.characterId;
  const rawLocalCharacter = characters[currentCharacterId];
  const localCharacter = useSnapshot(rawLocalCharacter ?? emptyObject);
  const attackBoost = localCharacter.attackBoost ?? null;
  const wallCrackDamageBoost =
    'wallCrackDamageBoost' in localCharacter ? localCharacter.wallCrackDamageBoost : undefined;

  const colorfulHighlightedParts = useMemo(() => {
    const shouldMeasure = shouldMeasureTooltipParsing();
    const startTime = shouldMeasure ? getCurrentTime() : 0;
    const intermediateParts: RenderTextPart[] = [];

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
            attackBoost,
            index,
            wallCrackDamageBoost,
            isDarkMode,
            currentCharacterId
          );

          const tooltipRendered = renderTextWithTooltips(
            tooltipContent,
            attackBoost,
            index,
            wallCrackDamageBoost,
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
            attackBoost,
            index,
            wallCrackDamageBoost,
            isDarkMode,
            currentCharacterId
          )
        );
      } else {
        finalParts.push(part);
      }
    });

    // 新增：对最终显示的纯文本部分进行橙色高亮（中文双引号、数字、运算符）
    const renderedParts = finalParts.flatMap((part) => {
      if (typeof part === 'string') {
        return renderColorfulHighlight(part);
      }
      return part;
    });

    if (shouldMeasure) {
      console.debug('[TextWithHoverTooltips]', {
        durationMs: Number((getCurrentTime() - startTime).toFixed(2)),
        inputLength: rawText.length,
        intermediatePartCount: intermediateParts.length,
        finalPartCount: renderedParts.length,
        characterSnapshotAvailable: localCharacter != null,
      });
    }

    return renderedParts;
  }, [
    attackBoost,
    currentCharacterId,
    isDarkMode,
    localCharacter,
    rawText,
    wallCrackDamageBoost,
  ]);

  return (
    <>
      {colorfulHighlightedParts.map((part, index) => (
        <Fragment key={`text-part-${index}`}>{part}</Fragment>
      ))}
    </>
  );
}
