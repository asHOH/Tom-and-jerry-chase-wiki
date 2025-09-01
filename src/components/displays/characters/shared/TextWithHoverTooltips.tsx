import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { renderTextWithHighlights } from '../../../../lib/textUtils';
import { useLocalCharacter } from '@/context/EditModeContext';
import { characters, cards } from '@/data';
import { proxy, useSnapshot } from 'valtio';
import GotoLink from '@/components/GotoLink';
import { useDarkMode } from '@/context/DarkModeContext';
import { getCardRankColors } from '@/lib/design-tokens';
import Tag from '@/components/ui/Tag';
import { CATEGORY_HINTS, type CategoryHint } from '@/lib/types';

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
  wallCrackDamageBoost?: number,
  isDarkMode: boolean = false,
  currentCharacterId?: string
): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  const isCategoryHint = (v: string | null): v is CategoryHint =>
    !!v && (CATEGORY_HINTS as readonly string[]).includes(v);
  // Normalize 《content》 to {content} so we can reuse the same parser
  const normalized = text.replace(/《([^》]+?)》/g, '{$1}');
  let lastIndex = 0;
  const tooltipPattern = /\{([^}]+?)\}/g;
  let match;

  // Small helper to keep tooltip element creation consistent
  const pushTooltip = (visibleText: string, tooltipContent: string) => {
    parts.push(
      <Tooltip key={`hover-${index}-${match!.index}`} content={tooltipContent}>
        {visibleText}
      </Tooltip>
    );
  };

  while ((match = tooltipPattern.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(normalized.slice(lastIndex, match.index));
    }

    const content = match[1] || '';
    let visibleText: string;
    let tooltipContent: string;

    if (content.includes('+')) {
      const partsNum = content.split('+').map((s) => Number.parseFloat(s));
      const [base, boost] = partsNum;
      if (
        base !== undefined &&
        boost !== undefined &&
        !Number.isNaN(base) &&
        !Number.isNaN(boost)
      ) {
        visibleText = String(base + boost);
        tooltipContent =
          boost === 0
            ? `同时也享受其他来源的攻击增伤加成`
            : `基础伤害${base}+角色增伤${boost}，同时也享受其他来源的攻击增伤加成`;
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
      // Support optional trailing category hint in parentheses, e.g. 绝地反击(特技) or 绝地反击(知识卡)
      const categoryMatch = /^(.*?)(?:\(([^)]+)\))$/.exec(content);
      let baseName: string = content;
      let categoryHint: string | null = null;
      if (categoryMatch) {
        const nameGroup = categoryMatch[1] ?? '';
        const hintGroup = categoryMatch[2] ?? '';
        baseName = (nameGroup || content).trim();
        categoryHint = hintGroup.trim() || null;
      }
      visibleText = baseName;

      // If matches special leveled passive pattern like "2级被动", link to current character's passive skill
      const passiveLevelMatch = /^(\d+)级被动$/.exec(baseName);
      if (passiveLevelMatch && currentCharacterId) {
        const level = passiveLevelMatch[1];
        const owner = characters[currentCharacterId as keyof typeof characters];
        const passive = owner?.skills?.find?.((s) => s.type === 'passive');
        if (passive?.name) {
          const hint2 = '技能' as CategoryHint;
          const linkName = `${level}级${passive.name}`;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              categoryHint={hint2}
            >
              {baseName}
            </GotoLink>
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }
      }

      // N级主动 -> current character's first active skill
      const activeLevelMatch = /^(\d+)级主动$/.exec(baseName);
      if (activeLevelMatch && currentCharacterId) {
        const level = activeLevelMatch[1];
        const owner = characters[currentCharacterId as keyof typeof characters];
        const active = owner?.skills?.find?.((s) => s.type === 'active');
        if (active?.name) {
          const hint2 = '技能' as CategoryHint;
          const linkName = `${level}级${active.name}`;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              categoryHint={hint2}
            >
              {baseName}
            </GotoLink>
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }
      }

      // N级武器 or N级一武 -> weapon1
      const weapon1LevelMatch = /^(\d+)级(武器|一武)$/.exec(baseName);
      if (weapon1LevelMatch && currentCharacterId) {
        const level = weapon1LevelMatch[1];
        const owner = characters[currentCharacterId as keyof typeof characters];
        const w1 = owner?.skills?.find?.((s) => s.type === 'weapon1');
        if (w1?.name) {
          const hint2 = '技能' as CategoryHint;
          const linkName = `${level}级${w1.name}`;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              categoryHint={hint2}
            >
              {baseName}
            </GotoLink>
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }
      }

      // N级二武 -> weapon2
      const weapon2LevelMatch = /^(\d+)级二武$/.exec(baseName);
      if (weapon2LevelMatch && currentCharacterId) {
        const level = weapon2LevelMatch[1];
        const owner = characters[currentCharacterId as keyof typeof characters];
        const w2 = owner?.skills?.find?.((s) => s.type === 'weapon2');
        if (w2?.name) {
          const hint2 = '技能' as CategoryHint;
          const linkName = `${level}级${w2.name}`;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              categoryHint={hint2}
            >
              {baseName}
            </GotoLink>
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }
      }

      // If matches leveled skill prefix like "2级机械身躯", render as a skill link
      if (/^\d+级/.test(baseName)) {
        const hint2 = '技能' as CategoryHint;
        const linkName = baseName;
        parts.push(
          <GotoLink
            name={linkName}
            className='underline'
            key={`${linkName}-${tooltipPattern.lastIndex}`}
            categoryHint={hint2}
          >
            {baseName}
          </GotoLink>
        );
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      // Only treat as numeric if it's a pure number (no units or letters)
      const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
      const isNumericOnly = numericOnlyPattern.test(visibleText);

      // If it's not a number or attack boost not available, try rendering as Knowledge Card tag
      if (!isNumericOnly || attackBoost == null) {
        const linkName = baseName;
        const card = cards[baseName as keyof typeof cards];

        // If explicitly marked as knowledge card or no hint (and we can resolve as a card), render as card Tag
        if ((!categoryHint || categoryHint === '知识卡') && card) {
          const rankColors = getCardRankColors(card.rank, false, isDarkMode);
          // Only pass recognized category hints to GotoLink for type safety
          const hint = isCategoryHint(categoryHint) ? categoryHint : undefined;
          parts.push(
            <GotoLink
              name={linkName}
              className='no-underline'
              key={`${card.rank}-${match.index}`}
              {...(hint ? { categoryHint: hint } : {})}
            >
              <Tag
                colorStyles={rankColors}
                size='sm'
                margin='micro'
                role='link'
                className='ml-0.75 mr-0.5'
              >
                {baseName}
              </Tag>
            </GotoLink>
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }

        // For other categories (e.g., 特技, 技能, etc.) or unknowns, render a plain goto link with the category kept in the link target
        const hint2 = isCategoryHint(categoryHint) ? categoryHint : undefined;
        parts.push(
          <GotoLink
            name={linkName}
            className='underline'
            key={`${linkName}-${tooltipPattern.lastIndex}`}
            {...(hint2 ? { categoryHint: hint2 } : {})}
          >
            {baseName}
          </GotoLink>
        );
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      const totalAttack = parseFloat(visibleText);
      const baseAttack = Math.round((totalAttack - attackBoost) * 10) / 10;
      tooltipContent =
        attackBoost === 0
          ? `同时也享受其他来源的攻击增伤加成`
          : `基础伤害${baseAttack}+角色增伤${attackBoost}，同时也享受其他来源的攻击增伤加成`;

      pushTooltip(visibleText, tooltipContent);
      lastIndex = tooltipPattern.lastIndex;
      continue;
    }

    // For '+' and '_' branches (or invalid '+'), show tooltip for computed visible text
    pushTooltip(visibleText, tooltipContent);

    lastIndex = tooltipPattern.lastIndex;
  }

  if (lastIndex < normalized.length) {
    parts.push(normalized.slice(lastIndex));
  }

  return parts;
};

interface TextWithHoverTooltipsProps {
  text: string;
}

const emptyObject = proxy({ attackBoost: 0 });

export default function TextWithHoverTooltips({ text }: TextWithHoverTooltipsProps) {
  const [isDarkMode] = useDarkMode();
  const highlightedParts = renderTextWithHighlights(text); // Handles **bold**
  const intermediateParts: (string | React.ReactElement)[] = [];
  const localCharacterCtx = useLocalCharacter();
  const currentCharacterId = localCharacterCtx.characterId;
  const rawLocalCharacter = characters[currentCharacterId];
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

  return <>{finalParts}</>;
}
