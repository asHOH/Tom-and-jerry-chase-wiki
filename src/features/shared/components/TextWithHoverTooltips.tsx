import { Fragment, useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import Tooltip from '@/components/ui/Tooltip';
import { characters } from '@/data';

import { renderColorfulHighlight } from './text-with-hover-tooltips/inlineMarkup';
import { renderTextWithTooltips } from './text-with-hover-tooltips/renderTextWithTooltips';
import { buildTextWithHoverTooltipTokens } from './text-with-hover-tooltips/textWithHoverTooltipTokens';
import type { RenderTextPart } from './text-with-hover-tooltips/types';

type TextWithHoverTooltipsProps = {
  text: string;
};

const emptyObject = proxy({ attackBoost: 0 });

const markdownHighlightClassName =
  'box-decoration-clone rounded-[2px] bg-amber-100/70 px-0.5 font-medium text-amber-950 dark:bg-amber-300/15 dark:text-amber-100';

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
  const parsedText = useMemo(
    () => buildTextWithHoverTooltipTokens(rawText, currentCharacterId),
    [currentCharacterId, rawText]
  );

  const colorfulHighlightedParts = useMemo(() => {
    const shouldMeasure = shouldMeasureTooltipParsing();
    const startTime = shouldMeasure ? getCurrentTime() : 0;
    const intermediateParts: RenderTextPart[] = [];

    parsedText.tokens.forEach((part, index) => {
      switch (part.type) {
        case 'text':
          intermediateParts.push(part.text);
          break;
        case 'markdownHighlight':
          intermediateParts.push(
            <span key={`markdown-highlight-${index}`} className={markdownHighlightClassName}>
              {part.text}
            </span>
          );
          break;
        case 'hoverTooltip': {
          const visibleRendered = renderTextWithTooltips(
            part.visibleText,
            attackBoost,
            part.sourceIndex,
            wallCrackDamageBoost,
            isDarkMode,
            currentCharacterId
          );

          const tooltipRendered = renderTextWithTooltips(
            part.tooltipContent,
            attackBoost,
            part.sourceIndex,
            wallCrackDamageBoost,
            isDarkMode,
            currentCharacterId
          );

          intermediateParts.push(
            <Tooltip key={`hover-${part.sourceIndex}-${part.matchIndex}`} content={tooltipRendered}>
              {part.isQuoted ? (
                <span className='text-orange-500'>{visibleRendered}</span>
              ) : (
                visibleRendered
              )}
            </Tooltip>
          );
          break;
        }
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
        parsedTextLength: parsedText.text.length,
        tokenCount: parsedText.tokens.length,
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
    parsedText,
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
