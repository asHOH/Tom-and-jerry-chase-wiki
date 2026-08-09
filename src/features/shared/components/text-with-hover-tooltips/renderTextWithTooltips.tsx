import { characters } from '@/data/static';
import Tooltip from '@/components/ui/Tooltip';

import { resolveCharacterExpression } from './characterText';
import {
  parseDamageContent,
  renderDamageTooltip,
  renderExplicitLink,
  renderSkillLink,
  resolveSkillLinkName,
} from './explicitMarkupRendering';
import { renderInlineClassTokens } from './inlineMarkup';
import { buildSemanticTextTokens } from './semanticTextTokens';
import type { CharacterRecord, RenderTextPart } from './types';

const ADDITION_EXPRESSION_PATTERN = /^(-?\d+(?:\.\d+)?)\+(-?\d+(?:\.\d+)?)$/;

const parseAdditionExpression = (value: string): { base: number; boost: number } | null => {
  const match = ADDITION_EXPRESSION_PATTERN.exec(value);
  if (!match) return null;

  return {
    base: Number(match[1]),
    boost: Number(match[2]),
  };
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
  const semanticTokens = buildSemanticTextTokens(text, attackBoost !== null);

  for (const token of semanticTokens) {
    if (token.type === 'text') {
      parts.push(token.text);
      continue;
    }

    if (token.type === 'styledText') {
      parts.push(...renderInlineClassTokens([token], `class-${index}`));
      continue;
    }

    const { rawContent } = token;
    const { isBaseOnly, categoryHint, classTokens, contentText } = token.parsed;
    const visibleText = renderInlineClassTokens(
      classTokens,
      `explicit-${index}-${token.sourceIndex}`
    );
    const elementKey = `hover-${index}-${token.sourceIndex}-${rawContent}`;

    if (contentText.includes('+')) {
      const additionExpression = parseAdditionExpression(contentText);
      const additionVisibleText = additionExpression
        ? String(additionExpression.base + additionExpression.boost)
        : contentText;
      const tooltipContent = additionExpression
        ? additionExpression.boost === 0
          ? `基础伤害${additionExpression.base}`
          : `基础伤害${additionExpression.base}+角色增伤${additionExpression.boost}`
        : contentText;

      parts.push(
        <Tooltip key={elementKey} content={tooltipContent}>
          {additionVisibleText}
        </Tooltip>
      );
      continue;
    }

    if (contentText.startsWith('_')) {
      const damage = parseDamageContent(contentText.slice(1), isBaseOnly);

      if (!damage.isNumeric) {
        parts.push(
          renderExplicitLink({
            linkName: damage.numericPart,
            displayText: damage.numericPart,
            categoryHint,
            isDarkMode,
            sourceIndex: token.sourceIndex,
            sourceEnd: token.sourceEnd,
          })
        );
        continue;
      }

      parts.push(
        renderDamageTooltip({
          kind: 'wallCrack',
          parsedNumber: Number(damage.numericPart),
          boost: wallCrackDamageBoost ?? 0,
          isBaseOnly: damage.isBaseOnly,
          tagParts: damage.tagParts,
          elementKey,
        })
      );
      continue;
    }

    const skillLinkName = resolveSkillLinkName(contentText, currentCharacterId);
    if (skillLinkName) {
      parts.push(renderSkillLink(visibleText, skillLinkName, token.sourceEnd));
      continue;
    }

    const damage = parseDamageContent(contentText, isBaseOnly);
    const canRenderDamage = damage.isNumeric && attackBoost !== null;

    if (!canRenderDamage) {
      if (damage.tagParts === null && contentText.startsWith(':')) {
        const currentCharacter: CharacterRecord | undefined =
          currentCharacterId && currentCharacterId in characters
            ? characters[currentCharacterId as keyof typeof characters]
            : undefined;
        const evaluated = resolveCharacterExpression(contentText, currentCharacter);
        if (typeof evaluated === 'string' || typeof evaluated === 'number') {
          parts.push(String(evaluated));
          continue;
        }
      }

      const isTaggedFallback = damage.tagParts !== null;
      parts.push(
        renderExplicitLink({
          linkName: isTaggedFallback ? damage.numericPart : contentText,
          displayText: isTaggedFallback ? damage.numericPart : visibleText,
          categoryHint,
          isDarkMode,
          sourceIndex: token.sourceIndex,
          sourceEnd: token.sourceEnd,
        })
      );
      continue;
    }

    parts.push(
      renderDamageTooltip({
        kind: 'character',
        parsedNumber: Number(damage.numericPart),
        boost: attackBoost,
        isBaseOnly: damage.isBaseOnly,
        tagParts: damage.tagParts,
        elementKey,
      })
    );
  }

  return parts;
};
