import React from 'react';
import { proxy, useSnapshot } from 'valtio';

import { getCardRankColors } from '@/lib/design';
import { renderTextWithHighlights } from '@/lib/textUtils';
import { CATEGORY_HINTS, type CategoryHint } from '@/lib/types';
import { useDarkMode } from '@/context/DarkModeContext';
import { useLocalCharacter } from '@/context/EditModeContext';
import { autoWrapNames } from '@/data/autoWrapNames';
import type { SkillType } from '@/data/types';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';
import { cards, characters } from '@/data';

type CharacterRecord = (typeof characters)[string];

// Safely resolve character-linked expressions like foo.bar[0] without eval
const resolveCharacterExpression = (
  expr: string,
  character?: CharacterRecord
): unknown | undefined => {
  if (!character) return undefined;
  const trimmed = expr.trim().replace(/^:/, '');
  // Only allow dotted/bracket paths with alphanumerics/underscore; no operators or calls
  if (!/^[\w.$[\]]+$/.test(trimmed)) return undefined;

  const tokens: Array<string | number> = [];
  const pathPattern = /([^.[\]]+)|(\[(\d+)\])/g;
  let match: RegExpExecArray | null;

  while ((match = pathPattern.exec(trimmed)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[3]) tokens.push(Number(match[3]));
  }

  let current: unknown = character;
  for (const key of tokens) {
    if (current == null || (typeof current !== 'object' && typeof current !== 'function')) {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
};

function preprocessText(text: string, currentCharacterName?: string | undefined): string {
  // If text already contains curly braces, return as-is
  if (text.includes('{') || text.includes('}') || text.includes('《') || text.includes('》')) {
    return text;
  }

  let result = text;

  const currentCharacter = currentCharacterName ? characters[currentCharacterName] : undefined;
  const currentCharacterNames = [
    currentCharacterName,
    currentCharacter?.id,
    ...(currentCharacter?.aliases ?? []),
  ].filter((name): name is string => typeof name === 'string' && name.length > 0);

  // Track positions that have been wrapped to avoid overlaps
  const processedRanges: Array<{ start: number; end: number }> = [];

  for (const name of autoWrapNames) {
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
const renderTextWithClasses = (text: string): (string | React.ReactElement)[] => {
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
 * Check if a string has balanced parentheses and ends with ')' or '）'
 * Supports both ASCII () and full-width （）.
 */
const hasBalancedParentheses = (text: string): boolean => {
  let balance = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '（') balance++;
    if (ch === ')' || ch === '）') balance--;
    if (balance < 0) return false;
  }
  return balance === 0 && (text.endsWith(')') || text.endsWith('）'));
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
    const lastOpenParen = Math.max(content.lastIndexOf('('), content.lastIndexOf('（'));
    if (lastOpenParen !== -1) {
      const baseName = content.substring(0, lastOpenParen).trim();
      const categoryHint = content.substring(lastOpenParen + 1, content.length - 1).trim();
      return { baseName, categoryHint };
    }
  }

  // If no balanced parentheses, return the whole content as baseName
  return { baseName: content, categoryHint: null };
};

// ---------- Damage tag processing system ----------

type TagCategory = 'source' | 'calculation' | 'electric' | 'shield' | 'injure' | 'bubble';

interface TagDefinition {
  category: TagCategory;
  names: string[]; // Includes primary name and aliases
  // Modify final display text: returns React elements to insert (bold, colors, etc.) and suffix strings
  processDisplay?: () => {
    prefixElement?: React.ReactElement; // Modifier inserted after the number, e.g. "无来源", "固定", "电击"
    suffixText?: string; // Text appended inside parentheses, e.g. "无视护盾"
    suffixNote?: string; // Note appended to tooltip
    preventBoost?: boolean; // Whether to prevent adding character boost
  };
}

// Tag definitions table
const TAG_DEFINITIONS: TagDefinition[] = [
  {
    category: 'source',
    names: ['有来源', '有来源伤害'],
    // Default tag, no special effect
  },
  {
    category: 'source',
    names: ['无来源', '无来源伤害', '环境伤害', '环境'],
    processDisplay: () => ({
      prefixElement: <strong key='source'>{'无来源'}</strong>,
      suffixNote: '；该伤害无来源，不会触发来源相关效果',
      preventBoost: true,
    }),
  },
  {
    category: 'calculation',
    names: ['受双方影响', '可增', '可增型', '可增型伤害', '常规', '常规伤害'],
    processDisplay: () => ({
      suffixNote: '；会受到其它来源的攻击增伤/减伤，受击增伤/减伤等效果影响',
    }),
  },
  {
    category: 'calculation',
    names: ['只受目标影响', '受目标影响', '不受来源影响', '不增', '不增型', '不增型伤害'],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'不受来源影响的'}</strong>,
      suffixNote: '；不受攻击增伤/减伤影响，但仍受受击增伤/减伤等其它效果影响',
      preventBoost: true,
    }),
  },
  {
    category: 'calculation',
    names: ['只受来源影响', '受来源影响', '不受目标影响'],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'不受目标影响的'}</strong>,
      suffixNote: '；不受受击增伤/减伤影响，但仍受攻击增伤/减伤等其它效果影响',
      preventBoost: true,
    }),
  },
  {
    category: 'calculation',
    names: [
      '不受双方影响',
      '不受影响',
      '固定值伤害',
      '固定型伤害',
      '固定',
      '固定值',
      '固定型',
      '不变型',
      '不变值',
      '不变型伤害',
      '不变值伤害',
    ],
    processDisplay: () => ({
      prefixElement: <strong key='calc'>{'固定'}</strong>,
      suffixNote: '；不受包括攻击增伤/减伤、受击增伤/减伤等效果在内的大多数效果的影响',
      preventBoost: true,
    }),
  },
  {
    category: 'electric',
    names: ['电击', '电击伤害'],
    processDisplay: () => ({
      prefixElement: (
        <strong key='electric' className='text-blue-600 dark:text-blue-400'>
          {'电击'}
        </strong>
      ),
      suffixNote:
        '；可对目标造成感电，一段时间内目标受到的电击伤害增加，可叠加，目标遇水时发生电爆炸并失去感电',
    }),
  },
  {
    category: 'shield',
    names: ['可攻击护盾', '可击破护盾', '可破盾', '可破盾伤害'],
    processDisplay: () => ({
      suffixText: '可破盾',
      suffixNote: '；会被护盾抵挡且正常消耗护盾层数',
    }),
  },
  {
    category: 'shield',
    names: [
      '不可攻击护盾',
      '不可击破护盾',
      '不可破盾',
      '不可破盾伤害',
      '无法攻击护盾',
      '无法击破护盾',
      '无法破盾',
      '无法破盾伤害',
    ],
    processDisplay: () => ({
      suffixText: '不破盾',
      suffixNote: '；会被护盾完全抵挡，不消耗护盾层数',
    }),
  },
  {
    category: 'shield',
    names: [
      '无视护盾',
      '无视护盾伤害',
      '穿透',
      '穿透护盾',
      '穿透伤害',
      '穿透护盾伤害',
      '真实',
      '真实伤害',
    ],
    processDisplay: () => ({
      suffixText: '无视护盾',
      suffixNote:
        '；无视包括护盾在内的绝大多数保护效果，直接对目标造成伤害，但由此引发虚弱时可能会被护盾等状态抵消',
    }),
  },
  {
    category: 'injure',
    names: ['可致伤', '可导致受伤', '会导致受伤', '会致伤'],
    processDisplay: () => ({
      suffixText: '可致伤',
      suffixNote: '；成功命中目标且未被护盾等效果抵挡时，使目标进入受伤状态',
    }),
  },
  {
    category: 'injure',
    names: ['不可致伤', '不可导致受伤', '不会导致受伤', '不会致伤'],
    processDisplay: () => ({
      suffixText: '不可致伤',
      suffixNote: '；不会使目标进入受伤状态',
    }),
  },
  {
    category: 'bubble',
    names: ['可攻击泡泡', '可击破泡泡'],
    processDisplay: () => ({
      suffixText: '可攻击泡泡',
      suffixNote: '；可以正常攻击泡泡',
    }),
  },
  {
    category: 'bubble',
    names: ['不可攻击泡泡', '不可击破泡泡'],
    processDisplay: () => ({
      suffixText: '不可攻击泡泡',
      suffixNote: '；无法攻击泡泡',
    }),
  },
];

// Parse tag strings and return effects in order of appearance
function parseDamageTags(rawTags: string[]): {
  displayPrefixElements: React.ReactElement[];
  displaySuffixes: string[];
  tooltipAppends: string[];
  preventBoost: boolean;
} {
  const displayPrefixElements: React.ReactElement[] = [];
  const displaySuffixes: string[] = [];
  const tooltipAppends: string[] = [];
  let preventBoost = false;

  const seenCategories = new Set<TagCategory>();

  // Process tags in order, but skip categories already processed
  for (const rawTag of rawTags) {
    const trimmed = rawTag.trim();
    if (!trimmed) continue;

    // Find matching tag definition
    const def = TAG_DEFINITIONS.find((d) =>
      d.names.some((name) => name.toLowerCase() === trimmed.toLowerCase())
    );
    if (!def) continue;

    // Only take the first tag of each category
    if (seenCategories.has(def.category)) continue;
    seenCategories.add(def.category);

    // Apply effects
    if (def.processDisplay) {
      const result = def.processDisplay();
      if (result.prefixElement) {
        displayPrefixElements.push(result.prefixElement);
      }
      if (result.suffixText) {
        displaySuffixes.push(result.suffixText);
      }
      if (result.suffixNote) {
        tooltipAppends.push(result.suffixNote);
      }
      if (result.preventBoost) {
        preventBoost = true;
      }
    }
  }

  // *** ADD: Default calculation category if none specified ***
  if (!seenCategories.has('calculation')) {
    const defaultCalcDef = TAG_DEFINITIONS.find(
      (d) => d.category === 'calculation' && d.names.includes('受双方影响')
    );
    if (defaultCalcDef?.processDisplay) {
      const result = defaultCalcDef.processDisplay();
      if (result.suffixNote) {
        tooltipAppends.push(result.suffixNote);
      }
      // Note: No prefix element or preventBoost for default calculation
    }
  }

  return { displayPrefixElements, displaySuffixes, tooltipAppends, preventBoost };
}

// ---------- End of tag processing ----------

/**
 * Parse and render text with tooltips for patterns like {visible text}
 * The text inside the brackets will be shown as visible text and also as tooltip content.
 * @param text - Text to parse and add tooltips to
 * @returns JSX elements with tooltip-enabled portions
 */
const renderTextWithTooltips = (
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

    const rawContent = match[1] || '';

    // Detect trailing asterisk to indicate base damage only
    let isBaseOnly = false;
    let content = rawContent;
    if (content.endsWith('*')) {
      isBaseOnly = true;
      content = content.slice(0, -1);
    }

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
        tooltipContent = boost === 0 ? `基础伤害${base}` : `基础伤害${base}+角色增伤${boost}`;
      } else {
        visibleText = contentForTooltip;
        tooltipContent = contentForTooltip;
      }
    } else if (contentForTooltip.startsWith('_')) {
      // ---------- Wall crack damage branch (applies tag system) ----------
      // Remove leading underscore, content may contain comma-separated tags
      const withoutUnderscore = contentForTooltip.substring(1);

      // Check if there are comma-separated tags
      const hasTags = withoutUnderscore.includes(',');

      if (!hasTags) {
        // Wall crack number without tags
        const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
        if (!numericOnlyPattern.test(withoutUnderscore)) {
          // Not a pure number, fallback to link
          const linkName = withoutUnderscore || '';
          const card = cards[linkName as keyof typeof cards];
          if ((!categoryHint || categoryHint === '知识卡') && card) {
            const rankColors = getCardRankColors(card.rank, false, isDarkMode);
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
                  {withoutUnderscore}
                </Tag>
              </GotoLink>
            );
          } else {
            const hint2 = isCategoryHint(categoryHint) ? categoryHint : undefined;
            parts.push(
              <GotoLink
                name={linkName}
                className='underline'
                key={`${linkName}-${tooltipPattern.lastIndex}`}
                {...(hint2 ? { categoryHint: hint2 } : {})}
              >
                {withoutUnderscore}
              </GotoLink>
            );
          }
          lastIndex = tooltipPattern.lastIndex;
          continue;
        }

        const parsedNumber = parseFloat(withoutUnderscore);
        let totalValue: number;
        let baseValue: number;
        const effectiveBoost = wallCrackDamageBoost ?? 0;

        if (isBaseOnly) {
          baseValue = parsedNumber;
          totalValue = baseValue + effectiveBoost;
        } else {
          totalValue = parsedNumber;
          baseValue = totalValue - effectiveBoost;
        }

        // *** ADD: Default calculation note for wall crack without tags ***
        const defaultCalcDef = TAG_DEFINITIONS.find(
          (d) => d.category === 'calculation' && d.names.includes('受双方影响')
        );
        const defaultNote = defaultCalcDef?.processDisplay?.()?.suffixNote ?? '';
        tooltipContent = `基础墙缝伤害${baseValue}${
          effectiveBoost !== 0 ? `+角色墙缝增伤${effectiveBoost}` : ''
        }${defaultNote}`;

        const displayText = `${totalValue}伤害`;

        parts.push(
          <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
            {displayText}
          </Tooltip>
        );

        // Skip immediately following "伤害" or "点伤害" to avoid duplication
        const afterMatch = normalized.slice(tooltipPattern.lastIndex);
        const skipDamagePattern = /^(伤害|点伤害)/;
        const skipMatch = skipDamagePattern.exec(afterMatch);
        if (skipMatch) {
          tooltipPattern.lastIndex += skipMatch[0].length;
        }

        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      // Wall crack number with tags
      const partsForTag = withoutUnderscore.split(',').map((s) => s.trim());
      let numericPart = partsForTag[0] || '';
      const tagParts = partsForTag.slice(1);
      let localIsBaseOnly = isBaseOnly;
      if (numericPart.endsWith('*')) {
        localIsBaseOnly = true;
        numericPart = numericPart.slice(0, -1);
      }

      const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
      if (!numericOnlyPattern.test(numericPart)) {
        // Invalid numeric part, fallback to link
        const linkName = numericPart || '';
        const card = cards[linkName as keyof typeof cards];
        if ((!categoryHint || categoryHint === '知识卡') && card) {
          const rankColors = getCardRankColors(card.rank, false, isDarkMode);
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
                {numericPart}
              </Tag>
            </GotoLink>
          );
        } else {
          const hint2 = isCategoryHint(categoryHint) ? categoryHint : undefined;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              {...(hint2 ? { categoryHint: hint2 } : {})}
            >
              {numericPart}
            </GotoLink>
          );
        }
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      const parsedNumber = parseFloat(numericPart);
      const tagEffects = parseDamageTags(tagParts);

      // Calculate wall crack damage value
      let totalValue: number;
      let baseValue: number;
      const effectiveBoost = tagEffects.preventBoost ? 0 : (wallCrackDamageBoost ?? 0);

      if (localIsBaseOnly) {
        baseValue = parsedNumber;
        totalValue = baseValue + effectiveBoost;
      } else {
        totalValue = parsedNumber;
        baseValue = totalValue - effectiveBoost;
      }

      // Build base tooltip
      let baseTooltip = `基础墙缝伤害${baseValue}`;
      if (effectiveBoost !== 0) {
        baseTooltip += `+角色墙缝增伤${effectiveBoost}`;
      }

      // Append tag notes
      const fullTooltip = baseTooltip + tagEffects.tooltipAppends.join('');

      // Build display text React elements
      const displayElements: React.ReactNode[] = [];
      displayElements.push(`${totalValue}`);

      // Insert prefix elements (无来源, 固定, 电击, etc.)
      const sourceElements: React.ReactElement[] = [];
      const calcElements: React.ReactElement[] = [];
      const electricElements: React.ReactElement[] = [];

      tagEffects.displayPrefixElements.forEach((el) => {
        if (el.key === 'source') sourceElements.push(el);
        else if (el.key === 'calc') calcElements.push(el);
        else if (el.key === 'electric') electricElements.push(el);
      });

      // Add source and calculation prefixes
      if (sourceElements.length > 0 || calcElements.length > 0) {
        displayElements.push('');
        sourceElements.forEach((el) => displayElements.push(el));
        if (sourceElements.length > 0 && calcElements.length > 0) {
          displayElements.push('的');
        }
        calcElements.forEach((el) => displayElements.push(el));
      }

      // Add electric prefix
      if (electricElements.length > 0) {
        displayElements.push(' ');
        electricElements.forEach((el) => displayElements.push(el));
      }

      // Add the word "伤害"
      displayElements.push('伤害');

      // Build suffix items inside parentheses
      const suffixItems: string[] = [];
      // Shield suffixes
      const shieldSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可破盾', '不破盾', '无视护盾'].includes(s)
      );
      if (shieldSuffix.length > 0) suffixItems.push(...shieldSuffix);

      // Injure suffixes
      const injureSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可致伤', '不可致伤'].includes(s)
      );
      if (injureSuffix.length > 0) suffixItems.push(...injureSuffix);

      // Bubble suffixes
      const bubbleSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可攻击泡泡', '不可攻击泡泡'].includes(s)
      );
      if (bubbleSuffix.length > 0) suffixItems.push(...bubbleSuffix);

      if (suffixItems.length > 0) {
        displayElements.push(`（${suffixItems.join('，')}）`);
      }

      parts.push(
        <Tooltip key={`hover-${index}-${match.index}`} content={fullTooltip}>
          <>{displayElements}</>
        </Tooltip>
      );

      // Skip immediately following "伤害" or "点伤害"
      const afterMatch = normalized.slice(tooltipPattern.lastIndex);
      const skipDamagePattern = /^(伤害|点伤害)/;
      const skipMatch = skipDamagePattern.exec(afterMatch);
      if (skipMatch) {
        tooltipPattern.lastIndex += skipMatch[0].length;
      }

      lastIndex = tooltipPattern.lastIndex;
      continue;
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

      // Check if there are comma-separated tags
      const hasTags = contentForTooltip.includes(',');

      if (!hasTags) {
        // Pure number without tags (original logic kept, extra description removed)
        const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
        const isNumericOnly = numericOnlyPattern.test(contentForTooltip);

        if (!isNumericOnly || attackBoost == null) {
          // Non-number branch...
          if (contentForTooltip.startsWith(':')) {
            const currentCharacter: CharacterRecord | undefined =
              currentCharacterId && currentCharacterId in characters
                ? characters[currentCharacterId as keyof typeof characters]
                : undefined;
            const evaluated = resolveCharacterExpression(contentForTooltip, currentCharacter);
            if (typeof evaluated === 'string' || typeof evaluated === 'number') {
              parts.push(String(evaluated));
              lastIndex = tooltipPattern.lastIndex;
              continue;
            }
          }
          const linkName = contentForTooltip || ''; // Ensure string type
          const card = cards[contentForTooltip as keyof typeof cards];

          if ((!categoryHint || categoryHint === '知识卡') && card) {
            const rankColors = getCardRankColors(card.rank, false, isDarkMode);
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

        // Pure number without tags
        const parsedNumber = parseFloat(contentForTooltip);
        let totalValue: number;
        let baseValue: number;

        if (isBaseOnly) {
          baseValue = parsedNumber;
          totalValue = Math.round((baseValue + (attackBoost ?? 0)) * 10) / 10;
        } else {
          totalValue = parsedNumber;
          baseValue = Math.round((totalValue - (attackBoost ?? 0)) * 10) / 10;
        }

        // *** ADD: Default calculation note for plain number ***
        const defaultCalcDef = TAG_DEFINITIONS.find(
          (d) => d.category === 'calculation' && d.names.includes('受双方影响')
        );
        const defaultNote = defaultCalcDef?.processDisplay?.()?.suffixNote ?? '';
        tooltipContent =
          (attackBoost ?? 0) === 0
            ? `基础伤害${baseValue}${defaultNote}`
            : `基础伤害${baseValue}+角色增伤${attackBoost}${defaultNote}`;

        const displayText = `${totalValue}伤害`;

        parts.push(
          <Tooltip key={`hover-${index}-${match.index}`} content={tooltipContent}>
            {displayText}
          </Tooltip>
        );

        // Skip immediately following "伤害" or "点伤害"
        const afterMatch = normalized.slice(tooltipPattern.lastIndex);
        const skipDamagePattern = /^(伤害|点伤害)/;
        const skipMatch = skipDamagePattern.exec(afterMatch);
        if (skipMatch) {
          tooltipPattern.lastIndex += skipMatch[0].length;
        }

        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      // ---------- Number with tags processing ----------
      const partsForTag = contentForTooltip.split(',').map((s) => s.trim());
      let numericPart = partsForTag[0] || '';
      const tagParts = partsForTag.slice(1);

      let localIsBaseOnly = isBaseOnly;
      if (numericPart.endsWith('*')) {
        localIsBaseOnly = true;
        numericPart = numericPart.slice(0, -1);
      }

      // Parse number
      const numericOnlyPattern = /^-?\d+(?:\.\d+)?$/;
      if (!numericOnlyPattern.test(numericPart) || attackBoost == null) {
        // If not a pure number, fallback to normal link (could be card or skill)
        const linkName = numericPart || '';
        const card = cards[linkName as keyof typeof cards];
        if ((!categoryHint || categoryHint === '知识卡') && card) {
          const rankColors = getCardRankColors(card.rank, false, isDarkMode);
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
                {numericPart}
              </Tag>
            </GotoLink>
          );
        } else {
          const hint2 = isCategoryHint(categoryHint) ? categoryHint : undefined;
          parts.push(
            <GotoLink
              name={linkName}
              className='underline'
              key={`${linkName}-${tooltipPattern.lastIndex}`}
              {...(hint2 ? { categoryHint: hint2 } : {})}
            >
              {numericPart}
            </GotoLink>
          );
        }
        lastIndex = tooltipPattern.lastIndex;
        continue;
      }

      const parsedNumber = parseFloat(numericPart);
      const tagEffects = parseDamageTags(tagParts);

      // Calculate damage value
      let totalValue: number;
      let baseValue: number;
      const effectiveAttackBoost = tagEffects.preventBoost ? 0 : (attackBoost ?? 0);

      if (localIsBaseOnly) {
        baseValue = parsedNumber;
        totalValue = Math.round((baseValue + effectiveAttackBoost) * 10) / 10;
      } else {
        totalValue = parsedNumber;
        baseValue = Math.round((totalValue - effectiveAttackBoost) * 10) / 10;
      }

      // Build base tooltip
      let baseTooltip =
        effectiveAttackBoost === 0
          ? `基础伤害${baseValue}`
          : `基础伤害${baseValue}+角色增伤${effectiveAttackBoost}`;

      // Append tag notes
      const fullTooltip = baseTooltip + tagEffects.tooltipAppends.join('');

      // Build display text React elements
      const displayElements: React.ReactNode[] = [];
      displayElements.push(`${totalValue}`);

      // Insert prefix elements (无来源, 固定, 电击, etc.)
      const sourceElements: React.ReactElement[] = [];
      const calcElements: React.ReactElement[] = [];
      const electricElements: React.ReactElement[] = [];

      tagEffects.displayPrefixElements.forEach((el) => {
        if (el.key === 'source') sourceElements.push(el);
        else if (el.key === 'calc') calcElements.push(el);
        else if (el.key === 'electric') electricElements.push(el);
      });

      // Add source and calculation prefixes
      if (sourceElements.length > 0 || calcElements.length > 0) {
        displayElements.push('');
        sourceElements.forEach((el) => displayElements.push(el));
        if (sourceElements.length > 0 && calcElements.length > 0) {
          displayElements.push('的');
        }
        calcElements.forEach((el) => displayElements.push(el));
      }

      // Add electric prefix
      if (electricElements.length > 0) {
        displayElements.push(' ');
        electricElements.forEach((el) => displayElements.push(el));
      }

      // Add the word "伤害"
      displayElements.push('伤害');

      // Build suffix items inside parentheses
      const suffixItems: string[] = [];
      // Shield suffixes
      const shieldSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可破盾', '不破盾', '无视护盾'].includes(s)
      );
      if (shieldSuffix.length > 0) suffixItems.push(...shieldSuffix);

      // Injure suffixes
      const injureSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可致伤', '不可致伤'].includes(s)
      );
      if (injureSuffix.length > 0) suffixItems.push(...injureSuffix);

      // Bubble suffixes
      const bubbleSuffix = tagEffects.displaySuffixes.filter((s) =>
        ['可攻击泡泡', '不可攻击泡泡'].includes(s)
      );
      if (bubbleSuffix.length > 0) suffixItems.push(...bubbleSuffix);

      if (suffixItems.length > 0) {
        displayElements.push(`（${suffixItems.join('，')}）`);
      }

      parts.push(
        <Tooltip key={`hover-${index}-${match.index}`} content={fullTooltip}>
          <>{displayElements}</>
        </Tooltip>
      );

      // Skip immediately following "伤害" or "点伤害"
      const afterMatch = normalized.slice(tooltipPattern.lastIndex);
      const skipDamagePattern = /^(伤害|点伤害)/;
      const skipMatch = skipDamagePattern.exec(afterMatch);
      if (skipMatch) {
        tooltipPattern.lastIndex += skipMatch[0].length;
      }

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
