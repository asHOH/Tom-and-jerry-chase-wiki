import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { renderTextWithHighlights } from '../../../../lib/textUtils';
import { useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data';
import { proxy, useSnapshot } from 'valtio';
import GotoLink from '@/components/GotoLink';

/**
 * Parse and render text with tooltips for patterns like {visible text}
 * The text inside the brackets will be shown as visible text and also as tooltip content.
 * @param text - Text to parse and add tooltips to
 * @returns JSX elements with tooltip-enabled portions
 */
export const renderTextWithTooltips = (
  text: string,
  attackBoost: number | null,
  index: number,
  wallCrackDamageBoost?: number
): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const tooltipPattern = /\{([^}]+?)\}/g;
  let match;

  while ((match = tooltipPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const content = match[1] || '';
    let visibleText: string;
    let tooltipContent: string;

    if (content.includes('+')) {
      const [base, boost] = content.split('+').map((s) => parseFloat(s));
      if (base && boost) {
        visibleText = String(base + boost);
        tooltipContent = `基础伤害${base}+角色增伤${boost}`;
      } else {
        visibleText = content;
        tooltipContent = content;
      }
    } else if (content.startsWith('_')) {
      visibleText = content.substring(1);
      if (wallCrackDamageBoost !== undefined) {
        const totalWallCrackDamage = parseFloat(visibleText);
        const baseWallCrackDamage =
          Math.round((totalWallCrackDamage - wallCrackDamageBoost) * 10) / 10;
        tooltipContent = `基础墙缝伤害${baseWallCrackDamage}+角色墙缝增伤${wallCrackDamageBoost}`;
      } else {
        tooltipContent = `墙缝伤害${visibleText}`;
      }
    } else {
      visibleText = content;
      const totalAttack = parseFloat(visibleText);
      if (Number.isNaN(totalAttack) || attackBoost == null) {
        parts.push(
          <GotoLink
            name={content}
            className='underline'
            key={`${content}-${tooltipPattern.lastIndex}`}
          >
            {content}
          </GotoLink>
        );
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }
      const baseAttack = Math.round((totalAttack - attackBoost) * 10) / 10;
      tooltipContent = `基础伤害${baseAttack}+角色增伤${attackBoost}`;
    }

    parts.push(
      <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
        {visibleText}
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

const emptyObject = proxy({ attackBoost: 0 });

export default function TextWithHoverTooltips({ text }: TextWithHoverTooltipsProps) {
  const highlightedParts = renderTextWithHighlights(text); // Handles **bold**
  const intermediateParts: (string | React.ReactElement)[] = [];
  const rawLocalCharacter = characters[useLocalCharacter().characterId];
  const localCharacter = useSnapshot(rawLocalCharacter ?? emptyObject);

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
            {visibleText}
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
  intermediateParts.forEach((part, index) => {
    if (typeof part === 'string') {
      finalParts.push(
        ...renderTextWithTooltips(
          part,
          localCharacter.attackBoost ?? null,
          index,
          'wallCrackDamageBoost' in localCharacter ? localCharacter.wallCrackDamageBoost : undefined
        )
      );
    } else {
      finalParts.push(part);
    }
  });

  return <>{finalParts}</>;
}
