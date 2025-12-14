import React from 'react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useLocalCharacter } from '@/context/EditModeContext';
import { cards, characters } from '@/data';
import type { SkillType } from '@/data/types';
import { proxy, useSnapshot } from 'valtio';

import { getCardRankColors } from '@/lib/design-tokens';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { CATEGORY_HINTS, type CategoryHint } from '@/lib/types';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';

const nameBlacklist = [
  '破墙',
  '捕鼠夹',
  '爪刀',
  '迅',
  '三叉戟',
  '绝地反击',
  '追风',
  '兔子',
  '大表哥',
  '相助',
];

function preprocessText(text: string, currentCharacterName?: string | undefined): string {
  // If text already contains curly braces, return as-is
  if (text.includes('{') || text.includes('}') || text.includes('《') || text.includes('》')) {
    return text;
  }

  // Collect canonical names (exclude aliases) and sort by length (longest first)
  const canonicalCharacterNames = [
    ...Object.keys(characters),
    ...Object.values(characters).map((character) => character.id),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  const canonicalCardNames = [
    ...Object.keys(cards),
    ...Object.values(cards).map((card) => card.id),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  const names = Array.from(new Set([...canonicalCharacterNames, ...canonicalCardNames]))
    .filter((name) => !nameBlacklist.includes(name))
    .sort((a, b) => b.length - a.length);

  let result = text;

  const currentCharacter = currentCharacterName ? characters[currentCharacterName] : undefined;
  const currentCharacterNames = [
    currentCharacterName,
    currentCharacter?.id,
    ...(currentCharacter?.aliases ?? []),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  // Track positions that have been wrapped to avoid overlaps
  const processedRanges: Array<{ start: number; end: number }> = [];

  for (const name of names) {
    let searchIndex = 0;

    while (true) {
      const index = result.indexOf(name, searchIndex);
      if (index === -1) break;

      // Check if this position overlaps with already processed ranges
      const overlaps = processedRanges.some(
        (range) => index < range.end && index + name.length > range.start
      );

      if (!overlaps) {
        if (currentCharacterNames.includes(name)) {
          processedRanges.push({
            start: index,
            end: index + name.length,
          });
          searchIndex = index + name.length;
        } else {
          // Wrap the character name with curly braces
          result =
            result.substring(0, index) + '{' + name + '}' + result.substring(index + name.length);

          // Track this range (accounting for the added braces)
          processedRanges.push({
            start: index,
            end: index + name.length + 2, // +2 for the braces
          });

          // Update ranges after this insertion
          processedRanges.forEach((range) => {
            if (range.start > index) {
              range.start += 2;
              range.end += 2;
            }
          });

          searchIndex = index + name.length + 2;
        }
      } else {
        searchIndex = index + 1;
      }
    }
  }

  return result;
}

/**
 * Parse and render text with class styling for patterns like $text$className#
 * The text between $ symbols will be styled using the full className after the second $ until #
 * @param text - Text to parse and add classes to
 * @returns JSX elements with class-styled portions
 */
export const renderTextWithClasses = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const classPattern = /\$([^$]+)\$([^#]+)#?/g;
  let match;

  while ((match = classPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const content = match[1] || '';
    const className = match[2] || '';

    // Apply full className
    parts.push(
      <span key={`class-${match.index}`} className={className}>
        {content}
      </span>
    );

    lastIndex = classPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

/**
 * Check if a string has balanced parentheses and ends with ')'
 * @param text - Text to check
 * @returns Whether the text has balanced parentheses and ends with ')'
 */
const hasBalancedParentheses = (text: string): boolean => {
  let balance = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') balance++;
    if (text[i] === ')') balance--;
    if (balance < 0) return false; // Unbalanced closing parenthesis
  }
  return balance === 0 && text.endsWith(')');
};

/**
 * Extract the base name from content with parentheses
 * @param content - Content that may contain parentheses
 * @returns Object with baseName and categoryHint
 */
const extractBaseNameAndCategoryHint = (
  content: string
): { baseName: string; categoryHint: string | null } => {
  // Check if content has balanced parentheses and ends with ')'
  if (hasBalancedParentheses(content)) {
    const lastOpenParen = content.lastIndexOf('(');
    if (lastOpenParen !== -1) {
      const baseName = content.substring(0, lastOpenParen).trim();
      const categoryHint = content.substring(lastOpenParen + 1, content.length - 1).trim();
      return { baseName, categoryHint };
    }
  }

  // If no balanced parentheses, return the whole content as baseName
  return { baseName: content, categoryHint: null };
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

  // First, normalize 《content》 to {content} so we can reuse the same parser
  const normalized = text.replace(/《([^》]+?)》/g, '{$1}');

  // Process the text to handle both {} patterns and $class$ patterns
  let lastIndex = 0;
  const tooltipPattern = /\{([^}]+?)\}/g;
  let match;

  while ((match = tooltipPattern.exec(normalized)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const beforeText = normalized.slice(lastIndex, match.index);
      // Process $class$ patterns in the text before the match
      parts.push(...renderTextWithClasses(beforeText));
    }

    const content = match[1] || '';

    // Extract base name and category hint (hide parentheses if present)
    const { baseName, categoryHint } = extractBaseNameAndCategoryHint(content);

    // Process the baseName for $class$ patterns
    const classProcessedBaseName = renderTextWithClasses(baseName);

    // Now process the class-processed content for tooltip logic
    let visibleText: string | (string | React.ReactElement)[] = classProcessedBaseName;
    let tooltipContent: string = '';

    // Helper function to extract text content from React elements
    const extractTextFromElements = (elements: (string | React.ReactElement)[]): string => {
      return elements
        .map((element) => {
          if (typeof element === 'string') {
            return element;
          } else {
            // Use type assertion to tell TypeScript this is a React element with props
            const reactElement = element as React.ReactElement<{ children?: React.ReactNode }>;
            if (reactElement.props && reactElement.props.children) {
              if (typeof reactElement.props.children === 'string') {
                return reactElement.props.children;
              } else if (Array.isArray(reactElement.props.children)) {
                return extractTextFromElements(reactElement.props.children);
              }
            }
          }
          return '';
        })
        .join('');
    };

    // Convert the class-processed content to string for tooltip parsing
    const contentForTooltip = extractTextFromElements(classProcessedBaseName);

    if (contentForTooltip.includes('+')) {
      const partsNum = contentForTooltip.split('+').map((s) => Number.parseFloat(s));
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
            ? `基础伤害${base}，同时也享受其他来源的攻击增伤加成`
            : `基础伤害${base}+角色增伤${boost}，同时也享受其他来源的攻击增伤加成`;
      } else {
        visibleText = contentForTooltip;
        tooltipContent = contentForTooltip;
      }
    } else if (contentForTooltip.startsWith('_')) {
      visibleText = contentForTooltip.substring(1);
      if (wallCrackDamageBoost !== undefined) {
        const totalWallCrackDamage = parseFloat(visibleText as string);
        const baseWallCrackDamage =
          Math.round((totalWallCrackDamage - wallCrackDamageBoost) * 10) / 10;
        tooltipContent = `基础墙缝伤害${baseWallCrackDamage}+角色墙缝增伤${wallCrackDamageBoost}，同时也享受其他来源的墙缝增伤加成`;
      } else {
        tooltipContent = `基础墙缝伤害${visibleText}，同时也享受其他来源的墙缝增伤加成`;
      }
    } else {
      // Use the extracted baseName for further processing
      visibleText = classProcessedBaseName;

      // Helper: push a skill goto link with consistent props
      const pushSkillLink = (
        displayText: string | (string | React.ReactElement)[],
        linkName: string
      ) => {
        const hint2 = '技能' as CategoryHint;
        parts.push(
          <GotoLink
            name={linkName}
            className='underline'
            key={`${linkName}-${tooltipPattern.lastIndex}`}
            categoryHint={hint2}
          >
            {typeof displayText === 'string' ? displayText : <>{displayText}</>}
          </GotoLink>
        );
      };

      // Consolidated leveled-skill patterns
      if (currentCharacterId) {
        const owner = characters[currentCharacterId as keyof typeof characters];
        const leveledPatterns: Array<{ regex: RegExp; type: SkillType }> = [
          { regex: /^(\d+)级被动$/, type: 'passive' },
          { regex: /^(\d+)级主动$/, type: 'active' },
          { regex: /^(\d+)级(?:武器|一武)$/, type: 'weapon1' },
          { regex: /^(\d+)级二武$/, type: 'weapon2' },
        ];

        let matchedLeveled = false;
        for (const { regex, type } of leveledPatterns) {
          const m = regex.exec(contentForTooltip);
          if (!m) continue;
          const level = m[1];
          const skill = owner?.skills?.find?.((s) => s.type === type);
          if (skill?.name) {
            pushSkillLink(visibleText, `${level}级${skill.name}`);
            lastIndex = tooltipPattern.lastIndex;
            matchedLeveled = true;
            break;
          }
        }
        if (matchedLeveled) continue;

        // Non-leveled aliases
        if (contentForTooltip === '主动技能') {
          const active = owner?.skills?.find?.((s) => s.type === 'active');
          if (active?.name) {
            pushSkillLink(visibleText, active.name);
            lastIndex = tooltipPattern.lastIndex;
            continue;
          }
        }
        if (contentForTooltip === '武器技能') {
          const w1 = owner?.skills?.find?.((s) => s.type === 'weapon1');
          if (w1?.name) {
            pushSkillLink(visibleText, w1.name);
            lastIndex = tooltipPattern.lastIndex;
            continue;
          }
        }
      }

      // If matches leveled skill prefix like "2级机械身躯", render as a generic skill link
      if (/^\d+级/.test(contentForTooltip)) {
        pushSkillLink(visibleText, contentForTooltip);
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      // Only treat as numeric if it's a pure number (no units or letters)
      const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
      const isNumericOnly = numericOnlyPattern.test(contentForTooltip);

      // If it's not a number or attack boost not available, try rendering as Knowledge Card tag
      if (!isNumericOnly || attackBoost == null) {
        if (contentForTooltip.startsWith(':')) {
          parts.push(
            new Function('$char', `with ($char) { return ${contentForTooltip.slice(1)}; }`)(
              characters[currentCharacterId as keyof typeof characters]
            )
          );
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }
        const linkName = contentForTooltip;
        const card = cards[contentForTooltip as keyof typeof cards];

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
                className='mr-0.5 ml-0.75'
              >
                {contentForTooltip}
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
            {typeof visibleText === 'string' ? visibleText : <>{visibleText}</>}
          </GotoLink>
        );
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      const totalAttack = parseFloat(contentForTooltip);
      const baseAttack = Math.round((totalAttack - attackBoost) * 10) / 10;
      tooltipContent =
        attackBoost === 0
          ? `基础伤害${baseAttack}，同时也享受其他来源的攻击增伤加成`
          : `基础伤害${baseAttack}+角色增伤${attackBoost}，同时也享受其他来源的攻击增伤加成`;

      parts.push(
        <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
          {typeof visibleText === 'string' ? visibleText : <>{visibleText}</>}
        </Tooltip>
      );
      lastIndex = tooltipPattern.lastIndex;
      continue;
    }

    // For '+' and '_' branches (or invalid '+'), show tooltip for computed visible text
    parts.push(
      <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
        {typeof visibleText === 'string' ? visibleText : <>{visibleText}</>}
      </Tooltip>
    );

    lastIndex = tooltipPattern.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < normalized.length) {
    const remainingText = normalized.slice(lastIndex);
    parts.push(...renderTextWithClasses(remainingText));
  }

  return parts;
};

interface TextWithHoverTooltipsProps {
  text: string;
}

const emptyObject = proxy({ attackBoost: 0 });

export default function TextWithHoverTooltips({ text: rawText }: TextWithHoverTooltipsProps) {
  const [isDarkMode] = useDarkMode();
  const intermediateParts: (string | React.ReactElement)[] = [];
  const localCharacterCtx = useLocalCharacter();
  const currentCharacterId = localCharacterCtx.characterId;
  const rawLocalCharacter = characters[currentCharacterId];
  const localCharacter = useSnapshot(rawLocalCharacter ?? emptyObject);
  const text = preprocessText(rawText, currentCharacterId);
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

  return <>{finalParts}</>;
}
