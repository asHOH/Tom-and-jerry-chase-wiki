import React from 'react';

import { getCardRankColors } from '@/lib/design';
import { CATEGORY_HINTS, type CategoryHint } from '@/lib/types';
import type { SkillType } from '@/data/types';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';
import { cards, characters } from '@/data';

import { resolveCharacterExpression } from './characterText';
import { calculateDamageValues, orderDamageSuffixes } from './damageDisplay';
import { parseDamageTags, TAG_DEFINITIONS } from './damageTags';
import { extractTextFromElements, renderTextWithClasses } from './inlineMarkup';
import type { CharacterRecord, ParsedName, RenderTextPart } from './types';

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
const extractBaseNameAndCategoryHint = (content: string): ParsedName => {
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
): RenderTextPart[] => {
  const parts: RenderTextPart[] = [];
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
    let visibleText: string | RenderTextPart[] = classProcessedBaseName;
    let tooltipContent: string = '';

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
        const effectiveBoost = wallCrackDamageBoost ?? 0;
        const { baseValue, totalValue } = calculateDamageValues({
          parsedNumber,
          boost: effectiveBoost,
          isBaseOnly,
          round: false,
        });

        // *** ADD: Default calculation note for wall crack without tags ***
        const defaultCalcDef = TAG_DEFINITIONS.find(
          (d) => d.category === 'calculation' && d.names.includes('受双方影响')
        );
        const defaultNote = defaultCalcDef?.processDisplay?.()?.suffixNote ?? '';
        tooltipContent = `基础墙缝伤害${baseValue}${
          effectiveBoost !== 0 ? `+角色墙缝增伤${effectiveBoost}` : ''
        }${defaultNote}`;

        const displayText = (
          <>
            <span className='text-red-500'>{totalValue}</span>伤害
          </>
        );

        parts.push(
          <Tooltip key={`hover-${index}-${match.index}-${rawContent}`} content={tooltipContent}>
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
      const effectiveBoost = tagEffects.preventBoost ? 0 : (wallCrackDamageBoost ?? 0);
      const { baseValue, totalValue } = calculateDamageValues({
        parsedNumber,
        boost: effectiveBoost,
        isBaseOnly: localIsBaseOnly,
        round: false,
      });

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
        displayElements.push('');
        electricElements.forEach((el) => displayElements.push(el));
      }

      // Add the word "伤害"
      displayElements.push('伤害');

      const suffixItems = orderDamageSuffixes(tagEffects.displaySuffixes);

      if (suffixItems.length > 0) {
        displayElements.push(`（${suffixItems.join('，')}）`);
      }

      parts.push(
        <Tooltip key={`hover-${index}-${match.index}-${rawContent}`} content={fullTooltip}>
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
      const pushSkillLink = (displayText: string | RenderTextPart[], linkName: string) => {
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
        const { baseValue, totalValue } = calculateDamageValues({
          parsedNumber,
          boost: attackBoost ?? 0,
          isBaseOnly,
          round: true,
        });

        // *** ADD: Default calculation note for plain number ***
        const defaultCalcDef = TAG_DEFINITIONS.find(
          (d) => d.category === 'calculation' && d.names.includes('受双方影响')
        );
        const defaultNote = defaultCalcDef?.processDisplay?.()?.suffixNote ?? '';
        tooltipContent =
          (attackBoost ?? 0) === 0
            ? `基础伤害${baseValue}${defaultNote}`
            : `基础伤害${baseValue}+角色增伤${attackBoost}${defaultNote}`;

        const displayText = (
          <>
            <span className='text-red-500'>{totalValue}</span>伤害
          </>
        );

        parts.push(
          <Tooltip key={`hover-${index}-${match.index}-${rawContent}`} content={tooltipContent}>
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
      const effectiveAttackBoost = tagEffects.preventBoost ? 0 : (attackBoost ?? 0);
      const { baseValue, totalValue } = calculateDamageValues({
        parsedNumber,
        boost: effectiveAttackBoost,
        isBaseOnly: localIsBaseOnly,
        round: true,
      });

      // Build base tooltip
      const baseTooltip =
        effectiveAttackBoost === 0
          ? `基础伤害${baseValue}`
          : `基础伤害${baseValue}+角色增伤${effectiveAttackBoost}`;

      // Append tag notes
      const fullTooltip = baseTooltip + tagEffects.tooltipAppends.join('');

      // Build display text React elements
      const displayElements: React.ReactNode[] = [];
      displayElements.push(<span className='text-red-500'>{totalValue}</span>);

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
        displayElements.push('');
        electricElements.forEach((el) => displayElements.push(el));
      }

      // Add the word "伤害"
      displayElements.push('伤害');

      const suffixItems = orderDamageSuffixes(tagEffects.displaySuffixes);

      if (suffixItems.length > 0) {
        displayElements.push(`（${suffixItems.join('，')}）`);
      }

      parts.push(
        <Tooltip key={`hover-${index}-${match.index}-${rawContent}`} content={fullTooltip}>
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
      <Tooltip key={`hover-${index}-${match.index}-${rawContent}`} content={tooltipContent}>
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
