import { Fragment, useMemo } from 'react';

import { storage, StorageKey } from '@/lib/localStorage';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { getActorProfile } from '@/features/actor-profiles/selectors';
import { usePublishedCharacter } from '@/features/characters/components/character-detail/PublishedCharacterContext';
import Tooltip from '@/components/ui/Tooltip';

import { renderColorfulHighlight } from './text-with-hover-tooltips/inlineMarkup';
import { renderTextWithTooltips } from './text-with-hover-tooltips/renderTextWithTooltips';
import {
  buildTextWithHoverTooltipTokens,
  claimHighlightedDamageSuffixes,
} from './text-with-hover-tooltips/textWithHoverTooltipTokens';
import type { RenderTextPart } from './text-with-hover-tooltips/types';

type TextWithHoverTooltipsProps = {
  text: string;
};

const markdownHighlightClassName =
  'box-decoration-clone rounded-[2px] bg-amber-100/70 px-0.5 font-medium text-amber-950 dark:bg-amber-300/15 dark:text-amber-100';

const shouldMeasureTooltipParsing = (): boolean => {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return false;
  }

  return storage.getItem(StorageKey.TooltipMeasurement) === '1';
};

const getCurrentTime = (): number =>
  typeof performance === 'undefined' ? Date.now() : performance.now();

export default function TextWithHoverTooltips({ text: rawText }: TextWithHoverTooltipsProps) {
  const [isDarkMode] = useDarkMode();
  const localCharacterCtx = useLocalCharacter();
  const currentCharacterId = localCharacterCtx.characterId;
  const localCharacter = usePublishedCharacter(currentCharacterId);
  const actorProfile = localCharacter ? getActorProfile(currentCharacterId) : undefined;
  const attackBoost = actorProfile?.attack ?? 0;
  const wallCrackDamageBoost =
    localCharacter?.factionId === 'mouse' ? actorProfile?.wallDamage : undefined;
  const parsedText = useMemo(
    () => buildTextWithHoverTooltipTokens(rawText, currentCharacterId),
    [currentCharacterId, rawText]
  );
  const referencedBuffIds = useMemo(() => {
    const ids = new Set<string>();
    for (const match of rawText.matchAll(/!\{(\d+)(?:-(\d+))?\}/g)) {
      if (match[1]) ids.add(match[1]);
      if (match[2]) ids.add(match[2]);
    }
    return [...ids];
  }, [rawText]);

  const colorfulHighlightedParts = useMemo(() => {
    const shouldMeasure = shouldMeasureTooltipParsing();
    const startTime = shouldMeasure ? getCurrentTime() : 0;
    const plannedTokens = claimHighlightedDamageSuffixes(parsedText.tokens, attackBoost !== null);
    const renderedParts: RenderTextPart[] = [];
    let highlightedChildren: RenderTextPart[] = [];
    let highlightGroupIndex = 0;

    const flushHighlight = () => {
      if (highlightedChildren.length === 0) return;

      renderedParts.push(
        <span
          key={`markdown-highlight-${highlightGroupIndex}`}
          className={markdownHighlightClassName}
        >
          {highlightedChildren.map((child, childIndex) => (
            <Fragment key={`highlight-child-${highlightGroupIndex}-${childIndex}`}>
              {child}
            </Fragment>
          ))}
        </span>
      );
      highlightedChildren = [];
      highlightGroupIndex++;
    };

    plannedTokens.forEach((token, index) => {
      let tokenParts: RenderTextPart[];

      if (token.type === 'text') {
        const semanticParts = renderTextWithTooltips(
          token.text,
          attackBoost,
          index,
          wallCrackDamageBoost,
          isDarkMode,
          currentCharacterId
        );
        tokenParts = token.isHighlighted
          ? semanticParts
          : semanticParts.flatMap((part) =>
              typeof part === 'string' ? renderColorfulHighlight(part) : part
            );
      } else {
        const visibleRendered = renderTextWithTooltips(
          token.visibleText,
          attackBoost,
          token.sourceIndex,
          wallCrackDamageBoost,
          isDarkMode,
          currentCharacterId
        );

        const tooltipRendered = renderTextWithTooltips(
          token.tooltipContent,
          attackBoost,
          token.sourceIndex,
          wallCrackDamageBoost,
          isDarkMode,
          currentCharacterId
        );

        tokenParts = [
          <Tooltip key={`hover-${token.sourceIndex}-${token.matchIndex}`} content={tooltipRendered}>
            {token.isQuoted ? (
              <span className='text-orange-500'>{visibleRendered}</span>
            ) : (
              visibleRendered
            )}
          </Tooltip>,
        ];
      }

      if (token.isHighlighted) {
        highlightedChildren.push(
          <Fragment key={`highlight-token-${index}`}>
            {tokenParts.map((part, partIndex) => (
              <Fragment key={`highlight-token-${index}-part-${partIndex}`}>{part}</Fragment>
            ))}
          </Fragment>
        );
      } else {
        flushHighlight();
        renderedParts.push(...tokenParts);
      }
    });

    flushHighlight();

    if (shouldMeasure) {
      console.debug('[TextWithHoverTooltips]', {
        durationMs: Number((getCurrentTime() - startTime).toFixed(2)),
        inputLength: rawText.length,
        parsedTextLength: parsedText.text.length,
        tokenCount: parsedText.tokens.length,
        intermediatePartCount: plannedTokens.length,
        finalPartCount: renderedParts.length,
        actorProfileAvailable: actorProfile !== undefined,
      });
    }

    return renderedParts;
  }, [
    attackBoost,
    currentCharacterId,
    isDarkMode,
    rawText,
    parsedText,
    actorProfile,
    wallCrackDamageBoost,
  ]);

  return (
    <>
      {referencedBuffIds.map((id) => (
        <span key={id} id={`buff-${id}`} className='scroll-mt-24' aria-hidden='true' />
      ))}
      {colorfulHighlightedParts.map((part, index) => (
        <Fragment key={`text-part-${index}`}>{part}</Fragment>
      ))}
    </>
  );
}
