'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/design';
import type { FactionId } from '@/data/types';
import type { RankableProperty } from '@/features/characters/utils/ranking';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

import {
  CHARACTER_ROLE_ATTRIBUTE_META,
  type CharacterRoleAttributeKey,
} from '../attributePresentation';
import {
  formatActorAttributeNumber,
  formatActorPhysicsType,
  formatActorSex,
  formatActorSize,
  formatActorType,
} from '../formatters';
import type { ActorProfile } from '../schema';
import {
  getActorProfile,
  getDisplayedActorGravity,
  isFactionDisplayedGravityUniform,
} from '../selectors';

export type CharacterRoleAttributesContext = 'character' | 'object';

type CharacterContextProps = {
  context: 'character';
  factionId: FactionId;
  specialClawKnifeCdHit?: number;
  specialClawKnifeCdUnhit?: number;
};

type ObjectContextProps = {
  context: 'object';
  factionId?: never;
  specialClawKnifeCdHit?: never;
  specialClawKnifeCdUnhit?: never;
};

type ActorAttributesSectionProps = {
  name: string;
  className?: string;
  EnglishName?: string;
} & (CharacterContextProps | ObjectContextProps);

type AttributeItemBase = {
  key: CharacterRoleAttributeKey;
};

type AttributeItem =
  | (AttributeItemBase & {
      renderKind?: 'text';
      value: string | undefined;
    })
  | (AttributeItemBase & {
      renderKind: 'attackCooldown';
      value: ActorProfile['attackCooldown'] | undefined;
    });

const NUMBER_VALUE_CLASS = 'text-blue-500 dark:text-sky-300';
const RANKING_LINK_CLASS = 'cursor-pointer hover:underline focus-visible:underline';

const OBJECT_SUMMARY_KEYS: readonly CharacterRoleAttributeKey[] = [
  'actorType',
  'physicsType',
  'maxHp',
  'hpRecovery',
  'runSpeed',
  'attackCooldown',
];

const MOUSE_SUMMARY_KEYS: readonly CharacterRoleAttributeKey[] = [
  'maxHp',
  'pushCheeseSpeed',
  'runSpeed',
  'jumpSpeed',
  'attack',
  'wallDamage',
];

const CAT_SECONDARY_SUMMARY_KEYS = ['attack', 'initialItem', 'hpRecovery'] as const;

const getSummaryKeys = (
  context: CharacterRoleAttributesContext,
  factionId: FactionId | undefined,
  attributesByKey: ReadonlyMap<CharacterRoleAttributeKey, AttributeItem>
): readonly CharacterRoleAttributeKey[] => {
  if (context === 'object') return OBJECT_SUMMARY_KEYS;
  if (factionId === 'mouse') return MOUSE_SUMMARY_KEYS;

  const secondaryKey =
    CAT_SECONDARY_SUMMARY_KEYS.find((key) => attributesByKey.has(key)) ?? 'hpRecovery';

  return ['maxHp', secondaryKey, 'runSpeed', 'jumpSpeed', 'attackCooldown', 'attackRange'];
};

const optionalNumber = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : formatActorAttributeNumber(value);

const getRankableProperty = (
  key: CharacterRoleAttributeKey,
  context: CharacterRoleAttributesContext,
  factionId: FactionId | undefined
): RankableProperty | undefined => {
  if (context !== 'character' || !factionId) return undefined;

  switch (key) {
    case 'maxHp':
      return 'maxHp';
    case 'hpRecovery':
      return 'hpRecovery';
    case 'runSpeed':
      return 'moveSpeed';
    case 'attack':
      return 'attackBoost';
    case 'wallDamage':
      return factionId === 'mouse' ? 'wallCrackDamageBoost' : undefined;
    case 'attackRange':
      return factionId === 'cat' ? 'clawKnifeRange' : undefined;
    case 'pushCheeseSpeed':
      return factionId === 'mouse' ? 'cheesePushSpeed' : undefined;
    default:
      return undefined;
  }
};

const getRankingHref = (property: RankableProperty, factionId: FactionId): string =>
  `/ranks/${property}/?faction=${factionId}`;

type CooldownValueProps = {
  cooldown: ActorProfile['attackCooldown'] | undefined;
  factionId: FactionId | undefined;
  specialHit: number | undefined;
  specialMiss: number | undefined;
};

const CooldownNumber = ({
  value,
  property,
  factionId,
}: {
  value: number;
  property: 'clawKnifeCdHit' | 'clawKnifeCdUnhit';
  factionId: FactionId | undefined;
}) => {
  const formattedValue = formatActorAttributeNumber(value);
  return factionId === 'cat' ? (
    <Link
      href={getRankingHref(property, factionId)}
      className={cn(NUMBER_VALUE_CLASS, RANKING_LINK_CLASS)}
    >
      {formattedValue}
    </Link>
  ) : (
    <span className={NUMBER_VALUE_CLASS}>{formattedValue}</span>
  );
};

const SpecialCooldown = ({ value }: { value: number | undefined }) =>
  value === undefined ? null : (
    <>
      {' ('}
      <span className={NUMBER_VALUE_CLASS}>{formatActorAttributeNumber(value)}</span>)
    </>
  );

const AttackCooldownValue = ({
  cooldown,
  factionId,
  specialHit,
  specialMiss,
}: CooldownValueProps) => {
  if (cooldown === undefined) return null;

  return (
    <span>
      {cooldown.miss === undefined ? (
        <>
          命中{' '}
          <CooldownNumber value={cooldown.hit} property='clawKnifeCdHit' factionId={factionId} />
          <SpecialCooldown value={specialHit} /> s
        </>
      ) : (
        <>
          <CooldownNumber value={cooldown.miss} property='clawKnifeCdUnhit' factionId={factionId} />
          <SpecialCooldown value={specialMiss} /> /{' '}
          <CooldownNumber value={cooldown.hit} property='clawKnifeCdHit' factionId={factionId} />
          <SpecialCooldown value={specialHit} /> s
        </>
      )}
    </span>
  );
};

const createAttributeItems = (
  role: ActorProfile,
  context: CharacterRoleAttributesContext,
  factionId: FactionId | undefined,
  EnglishName: string | undefined,
  hideGravity: boolean
): readonly AttributeItem[] => {
  const isObject = context === 'object';
  const isMouseCharacter = context === 'character' && factionId === 'mouse';
  const isCatCharacter = context === 'character' && factionId === 'cat';

  return [
    {
      key: 'actorType',
      value: isObject ? formatActorType(role.actorType) : undefined,
    },
    {
      key: 'physicsType',
      value: isObject ? formatActorPhysicsType(role.physicsType) : undefined,
    },
    { key: 'sex', value: formatActorSex(role.sex) },
    { key: 'EnglishName', value: EnglishName },
    {
      key: 'maxHp',
      value: formatActorAttributeNumber(role.maxHp),
    },
    {
      key: 'hpRecovery',
      value: formatActorAttributeNumber(role.hpRecovery),
    },
    {
      key: 'runSpeed',
      value: formatActorAttributeNumber(role.runSpeed),
    },
    {
      key: 'jumpSpeed',
      value: formatActorAttributeNumber(role.jumpSpeed),
    },
    { key: 'size', value: formatActorSize(role.size) },
    {
      key: 'climbSpeed',
      value: formatActorAttributeNumber(role.climbSpeed),
    },
    {
      key: 'visionScale',
      value: formatActorAttributeNumber(role.visionScale),
    },
    {
      key: 'gravity',
      value: hideGravity ? undefined : formatActorAttributeNumber(getDisplayedActorGravity(role)),
    },
    {
      key: 'attack',
      value:
        isObject || isMouseCharacter || role.attack !== 0 ? optionalNumber(role.attack) : undefined,
    },
    {
      key: 'wallDamage',
      value: isObject || isMouseCharacter ? formatActorAttributeNumber(role.wallDamage) : undefined,
    },
    {
      key: 'attackRange',
      value: isObject || isCatCharacter ? optionalNumber(role.attackRange) : undefined,
    },
    {
      key: 'attackCooldown',
      value: isObject || isCatCharacter ? role.attackCooldown : undefined,
      renderKind: 'attackCooldown',
    },
    {
      key: 'pushCheeseSpeed',
      value: isObject || isMouseCharacter ? optionalNumber(role.pushCheeseSpeed) : undefined,
    },
    {
      key: 'initialItem',
      value:
        isObject || (isCatCharacter && role.initialItem !== '老鼠夹')
          ? role.initialItem
          : undefined,
    },
    {
      key: 'deformCooldown',
      value: optionalNumber(role.deformCooldown),
    },
    {
      key: 'shoppingDelay',
      value: isObject || isCatCharacter ? optionalNumber(role.shoppingDelay) : undefined,
    },
  ];
};

export default function ActorAttributesSection({
  name,
  className,
  EnglishName,
  context,
  factionId,
  specialClawKnifeCdHit,
  specialClawKnifeCdUnhit,
}: ActorAttributesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const role = getActorProfile(name);
  const hideGravity = context === 'character' && isFactionDisplayedGravityUniform(factionId);
  const visibleAttributes = createAttributeItems(
    role,
    context,
    factionId,
    EnglishName,
    hideGravity
  ).filter((attribute) => attribute.value !== undefined);
  const attributesByKey = new Map(
    visibleAttributes.map((attribute) => [attribute.key, attribute] as const)
  );
  const summaryKeys = getSummaryKeys(context, factionId, attributesByKey);
  const collapsedAttributes = summaryKeys.flatMap((key) => {
    const attribute = attributesByKey.get(key);
    return attribute ? [attribute] : [];
  });
  const displayedAttributes = expanded ? visibleAttributes : collapsedAttributes;
  const hasMore = visibleAttributes.length > collapsedAttributes.length;

  return (
    <div className={cn('space-y-3', className)}>
      <div id={contentId} className='grid grid-cols-2 gap-3'>
        {displayedAttributes.map((attribute) => {
          const presentation = CHARACTER_ROLE_ATTRIBUTE_META[attribute.key];
          const rankableProperty = getRankableProperty(attribute.key, context, factionId);
          const value =
            attribute.renderKind === 'attackCooldown' ? (
              <AttackCooldownValue
                cooldown={attribute.value}
                factionId={context === 'character' ? factionId : undefined}
                specialHit={specialClawKnifeCdHit}
                specialMiss={specialClawKnifeCdUnhit}
              />
            ) : rankableProperty && factionId ? (
              <Link
                href={getRankingHref(rankableProperty, factionId)}
                className={cn(
                  'truncate',
                  presentation.numeric && NUMBER_VALUE_CLASS,
                  RANKING_LINK_CLASS
                )}
              >
                {attribute.value}
              </Link>
            ) : (
              <span className={cn('truncate', presentation.numeric && NUMBER_VALUE_CLASS)}>
                {attribute.value}
              </span>
            );

          return (
            <p
              key={attribute.key}
              className={cn(
                'flex items-baseline gap-1 py-1 text-sm text-gray-700 dark:text-gray-300',
                context === 'character' &&
                  factionId === 'cat' &&
                  attribute.key === 'attack' &&
                  'text-amber-600 dark:text-amber-400'
              )}
            >
              <Tooltip content={presentation.tooltip}>{presentation.label}</Tooltip>
              {': '}
              {value}
              {presentation.suffix ? (
                <span className='shrink-0 text-xs text-gray-400 dark:text-gray-500'>
                  {presentation.suffix}
                </span>
              ) : null}
            </p>
          );
        })}
      </div>

      {hasMore ? (
        <div className='flex items-center justify-center gap-4 pt-1'>
          <div className='flex-1 border-t border-gray-200 dark:border-gray-700' />
          <button
            type='button'
            onClick={() => setExpanded((current) => !current)}
            aria-controls={contentId}
            aria-expanded={expanded}
            className='flex shrink-0 items-center gap-1 rounded-sm text-base font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-800'
          >
            <span>{expanded ? '收起' : '展开'}</span>
            <ChevronDownIcon
              className={cn(
                'size-4 transition-transform motion-reduce:transition-none',
                expanded && 'rotate-180'
              )}
            />
          </button>
          <div className='flex-1 border-t border-gray-200 dark:border-gray-700' />
        </div>
      ) : null}
    </div>
  );
}
