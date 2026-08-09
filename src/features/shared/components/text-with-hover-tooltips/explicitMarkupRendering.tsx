import React from 'react';

import { getCardRankColors } from '@/lib/design';
import { CATEGORY_HINTS, type CategoryHint } from '@/lib/types';
import { cards, characters } from '@/data/static';
import type { SkillType } from '@/data/types';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';

import { calculateDamageValues, isNumericDamageText, orderDamageSuffixes } from './damageDisplay';
import { parseDamageTags } from './damageTags';
import type { DamageTagEffects, RenderTextPart } from './types';

type RenderableText = string | RenderTextPart[];

type ExplicitLinkOptions = {
  linkName: string;
  displayText: RenderableText;
  categoryHint: string | null;
  isDarkMode: boolean;
  sourceIndex: number;
  sourceEnd: number;
};

type DamageKind = 'character' | 'wallCrack';

type DamageContent = {
  numericPart: string;
  tagParts: string[] | null;
  isBaseOnly: boolean;
  isNumeric: boolean;
};

type DamageTooltipOptions = {
  kind: DamageKind;
  parsedNumber: number;
  boost: number;
  isBaseOnly: boolean;
  tagParts: string[] | null;
  elementKey: string;
};

type DamageKindDefinition = {
  damageLabel: string;
  boostLabel: string;
  round: boolean;
  highlightTaggedTotal: boolean;
};

const LEVELED_SKILL_PATTERNS: ReadonlyArray<{ regex: RegExp; type: SkillType }> = [
  { regex: /^(\d+)级被动$/, type: 'passive' },
  { regex: /^(\d+)级主动$/, type: 'active' },
  { regex: /^(\d+)级(?:武器|一武)$/, type: 'weapon1' },
  { regex: /^(\d+)级二武$/, type: 'weapon2' },
];

const GENERIC_LEVELED_SKILL_PATTERN = /^\d+级/;

const SKILL_ALIAS_TYPES: Readonly<Record<string, SkillType>> = {
  主动技能: 'active',
  武器技能: 'weapon1',
};

const DAMAGE_KIND_DEFINITIONS = {
  character: {
    damageLabel: '基础伤害',
    boostLabel: '角色增伤',
    round: true,
    highlightTaggedTotal: true,
  },
  wallCrack: {
    damageLabel: '基础墙缝伤害',
    boostLabel: '角色墙缝增伤',
    round: false,
    highlightTaggedTotal: false,
  },
} as const satisfies Record<DamageKind, DamageKindDefinition>;

const CATEGORY_HINT_SET = new Set<string>(CATEGORY_HINTS);

const isCategoryHint = (value: string | null): value is CategoryHint =>
  value !== null && CATEGORY_HINT_SET.has(value);

const asReactNode = (text: RenderableText): React.ReactNode =>
  typeof text === 'string' ? text : <>{text}</>;

const renderDisplayElements = (elements: React.ReactNode[]): React.ReactElement[] =>
  elements.map((element, elementIndex) => (
    <React.Fragment key={`display-element-${elementIndex}`}>{element}</React.Fragment>
  ));

const buildDamageDisplayElements = (
  totalValue: number,
  tagEffects: DamageTagEffects,
  highlightTotal: boolean
): React.ReactNode[] => {
  const displayElements: React.ReactNode[] = [
    highlightTotal ? (
      <span key='damage-total' className='text-red-500'>
        {totalValue}
      </span>
    ) : (
      String(totalValue)
    ),
  ];
  const sourceElements: React.ReactElement[] = [];
  const calculationElements: React.ReactElement[] = [];
  const electricElements: React.ReactElement[] = [];

  for (const element of tagEffects.displayPrefixElements) {
    if (element.key === 'source') sourceElements.push(element);
    else if (element.key === 'calc') calculationElements.push(element);
    else if (element.key === 'electric') electricElements.push(element);
  }

  if (sourceElements.length > 0 || calculationElements.length > 0) {
    displayElements.push(...sourceElements);
    if (sourceElements.length > 0 && calculationElements.length > 0) {
      displayElements.push('的');
    }
    displayElements.push(...calculationElements);
  }

  displayElements.push(...electricElements, '伤害');

  const suffixItems = orderDamageSuffixes(tagEffects.displaySuffixes);
  if (suffixItems.length > 0) {
    displayElements.push(`（${suffixItems.join('，')}）`);
  }

  return displayElements;
};

export const parseDamageContent = (content: string, initialIsBaseOnly: boolean): DamageContent => {
  if (!content.includes(',')) {
    return {
      numericPart: content,
      tagParts: null,
      isBaseOnly: initialIsBaseOnly,
      isNumeric: isNumericDamageText(content),
    };
  }

  const [rawNumericPart = '', ...tagParts] = content.split(',').map((part) => part.trim());
  const hasInlineBaseOnlyMarker = rawNumericPart.endsWith('*');
  const numericPart = hasInlineBaseOnlyMarker ? rawNumericPart.slice(0, -1) : rawNumericPart;

  return {
    numericPart,
    tagParts,
    isBaseOnly: initialIsBaseOnly || hasInlineBaseOnlyMarker,
    isNumeric: isNumericDamageText(numericPart),
  };
};

export const renderExplicitLink = ({
  linkName,
  displayText,
  categoryHint,
  isDarkMode,
  sourceIndex,
  sourceEnd,
}: ExplicitLinkOptions): React.ReactElement => {
  const card = cards[linkName as keyof typeof cards];
  const hint = isCategoryHint(categoryHint) ? categoryHint : undefined;

  if ((!categoryHint || categoryHint === '知识卡') && card) {
    return (
      <GotoLink
        name={linkName}
        className='no-underline'
        key={`${card.rank}-${sourceIndex}`}
        {...(hint ? { categoryHint: hint } : {})}
      >
        <Tag
          colorStyles={getCardRankColors(card.rank, false, isDarkMode)}
          size='sm'
          margin='micro'
          role='link'
          className='mr-0.5 ml-0.75'
        >
          {linkName}
        </Tag>
      </GotoLink>
    );
  }

  return (
    <GotoLink
      name={linkName}
      className='underline'
      key={`${linkName}-${sourceEnd}`}
      {...(hint ? { categoryHint: hint } : {})}
    >
      {asReactNode(displayText)}
    </GotoLink>
  );
};

export const resolveSkillLinkName = (
  content: string,
  currentCharacterId?: string
): string | null => {
  if (currentCharacterId) {
    const owner = characters[currentCharacterId as keyof typeof characters];

    for (const { regex, type } of LEVELED_SKILL_PATTERNS) {
      const match = regex.exec(content);
      if (!match) continue;

      const skill = owner?.skills?.find?.((candidate) => candidate.type === type);
      if (skill?.name) return `${match[1]}级${skill.name}`;
    }

    const aliasType = SKILL_ALIAS_TYPES[content];
    if (aliasType) {
      const skill = owner?.skills?.find?.((candidate) => candidate.type === aliasType);
      if (skill?.name) return skill.name;
    }
  }

  return GENERIC_LEVELED_SKILL_PATTERN.test(content) ? content : null;
};

export const renderSkillLink = (
  displayText: RenderableText,
  linkName: string,
  sourceEnd: number
): React.ReactElement => (
  <GotoLink
    name={linkName}
    className='underline'
    key={`${linkName}-${sourceEnd}`}
    categoryHint='技能'
  >
    {asReactNode(displayText)}
  </GotoLink>
);

export const renderDamageTooltip = ({
  kind,
  parsedNumber,
  boost,
  isBaseOnly,
  tagParts,
  elementKey,
}: DamageTooltipOptions): React.ReactElement => {
  const definition = DAMAGE_KIND_DEFINITIONS[kind];
  const tagEffects = parseDamageTags(tagParts ?? []);
  const effectiveBoost = tagEffects.preventBoost ? 0 : boost;
  const { baseValue, totalValue } = calculateDamageValues({
    parsedNumber,
    boost: effectiveBoost,
    isBaseOnly,
    round: definition.round,
  });

  const tooltipContent = `${definition.damageLabel}${baseValue}${
    effectiveBoost !== 0 ? `+${definition.boostLabel}${effectiveBoost}` : ''
  }${tagEffects.tooltipAppends.join('')}`;
  const highlightTotal = definition.highlightTaggedTotal || tagParts === null;
  const displayElements = buildDamageDisplayElements(totalValue, tagEffects, highlightTotal);

  return (
    <Tooltip key={elementKey} content={tooltipContent}>
      <>{renderDisplayElements(displayElements)}</>
    </Tooltip>
  );
};
