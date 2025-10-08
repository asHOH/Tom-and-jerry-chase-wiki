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
 * Parse and render text with color styling for patterns like $text$color#
 * The text between $ symbols will be colored using the color code after the second $ until #
 * @param text - Text to parse and add colors to
 * @returns JSX elements with color-styled portions
 */
export const renderTextWithColors = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const colorPattern = /\$([^$]+)\$([^#]+)#?/g;
  let match;

  while ((match = colorPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const content = match[1] || '';
    const color = match[2] || '';

    // Apply color using className
    parts.push(
      <span key={`color-${match.index}`} className={`text-${color}`}>
        {content}
      </span>
    );

    lastIndex = colorPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

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

  // First, handle color patterns $text$color#
  const colorProcessedParts = renderTextWithColors(text);

  // Process each part for other patterns
  colorProcessedParts.forEach((part) => {
    if (typeof part !== 'string') {
      parts.push(part);
      return;
    }

    // Normalize 《content》 to {content} so we can reuse the same parser
    const normalized = part.replace(/《([^》]+?)》/g, '{$1}');
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

        // Helper: push a skill goto link with consistent props
        const pushSkillLink = (displayText: string, linkName: string) => {
          const hint2 = '技能' as CategoryHint;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              categoryHint={hint2}
            >
              {displayText}
            </GotoLink>
          );
        };

        // Consolidated leveled-skill patterns
        if (currentCharacterId) {
          const owner = characters[currentCharacterId as keyof typeof characters];
          type TSkill = 'passive' | 'active' | 'weapon1' | 'weapon2';
          const leveledPatterns: Array<{ regex: RegExp; type: TSkill }> = [
            { regex: /^(\d+)级被动$/, type: 'passive' },
            { regex: /^(\d+)级主动$/, type: 'active' },
            { regex: /^(\d+)级(?:武器|一武)$/, type: 'weapon1' },
            { regex: /^(\d+)级二武$/, type: 'weapon2' },
          ];

          let matchedLeveled = false;
          for (const { regex, type } of leveledPatterns) {
            const m = regex.exec(baseName);
            if (!m) continue;
            const level = m[1];
            const skill = owner?.skills?.find?.((s) => s.type === type);
            if (skill?.name) {
              pushSkillLink(baseName, `${level}级${skill.name}`);
              lastIndex = tooltipPattern.lastIndex;
              matchedLeveled = true;
              break;
            }
          }
          if (matchedLeveled) continue;

          // Non-leveled aliases
          if (baseName === '主动技能') {
            const active = owner?.skills?.find?.((s) => s.type === 'active');
            if (active?.name) {
              pushSkillLink(baseName, active.name);
              lastIndex = tooltipPattern.lastIndex;
              continue;
            }
          }
          if (baseName === '武器技能') {
            const w1 = owner?.skills?.find?.((s) => s.type === 'weapon1');
            if (w1?.name) {
              pushSkillLink(baseName, w1.name);
              lastIndex = tooltipPattern.lastIndex;
              continue;
            }
          }
        }

        // If matches leveled skill prefix like "2级机械身躯", render as a generic skill link
        if (/^\d+级/.test(baseName)) {
          pushSkillLink(baseName, baseName);
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }

        // Only treat as numeric if it's a pure number (no units or letters)
        const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
        const isNumericOnly = numericOnlyPattern.test(visibleText);

        // If it's not a number or attack boost not available, try rendering as Knowledge Card tag
        if (!isNumericOnly || attackBoost == null) {
          if (content.startsWith(':')) {
            parts.push(
              new Function('$char', `with ($char) { return ${content.slice(1)}; }`)(
                characters[currentCharacterId as keyof typeof characters]
              )
            );
            lastIndex = tooltipPattern.lastIndex;
            continue;
          }
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
  });

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
          <Tooltip
            key={`hover-${index}-${match.index}`}
            content={renderTextWithTooltips(
              tooltipContent,
              localCharacter.attackBoost ?? null,
              index,
              'wallCrackDamageBoost' in localCharacter
                ? localCharacter.wallCrackDamageBoost
                : undefined,
              isDarkMode,
              currentCharacterId
            )}
          >
            {renderTextWithTooltips(
              visibleText,
              localCharacter.attackBoost ?? null,
              index,
              'wallCrackDamageBoost' in localCharacter
                ? localCharacter.wallCrackDamageBoost
                : undefined,
              isDarkMode,
              currentCharacterId
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

  const finalParts: (string | React.ReactElement)[] = [];

  // Second pass: Handle {visible text} and $color$ patterns using the updated renderTextWithTooltips
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
