'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/design';
import { useAppContext } from '@/context/AppContext';
import type { FactionId } from '@/data/types';
import type { RankableProperty } from '@/features/characters/utils/ranking';
import Button from '@/components/ui/Button';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

import { ACTOR_ATTRIBUTE_PRESENTATION, type ActorAttributeKey } from '../attributePresentation';
import {
  formatActorAttributeNumber,
  formatActorPhysicsType,
  formatActorSex,
  // formatActorSize,
  formatActorType,
} from '../formatters';
import type { ActorProfile } from '../schema';
import {
  getActorProfile,
  getDisplayedActorGravity,
  isFactionDisplayedGravityUniform,
} from '../selectors';

export type ActorContext = 'character' | 'object';

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

type DisplayedActorAttributeBase = {
  key: ActorAttributeKey;
};

type DisplayedActorAttribute =
  | (DisplayedActorAttributeBase & {
      renderKind?: 'text';
      value: string | undefined;
    })
  | (DisplayedActorAttributeBase & {
      renderKind: 'attackCooldown';
      value: ActorProfile['attackCooldown'] | undefined;
    });

const NUMBER_VALUE_CLASS = 'text-blue-500 dark:text-sky-300';
const RANKING_LINK_CLASS = 'cursor-pointer hover:underline focus-visible:underline';

const OBJECT_SUMMARY_KEYS: readonly ActorAttributeKey[] = [
  'actorType',
  'physicsType',
  'maxHp',
  'hpRecovery',
  'runSpeed',
  'attackCooldown',
];

const MOUSE_SUMMARY_KEYS: readonly ActorAttributeKey[] = [
  'maxHp',
  'pushCheeseSpeed',
  'runSpeed',
  'jumpSpeed',
  'attack',
  'wallDamage',
];

const CAT_SECONDARY_SUMMARY_KEYS = ['attack', 'initialItem', 'hpRecovery'] as const;

const getSummaryKeys = (
  context: ActorContext,
  factionId: FactionId | undefined,
  attributesByKey: ReadonlyMap<ActorAttributeKey, DisplayedActorAttribute>
): readonly ActorAttributeKey[] => {
  if (context === 'object') return OBJECT_SUMMARY_KEYS;
  if (factionId === 'mouse') return MOUSE_SUMMARY_KEYS;

  const secondaryKey =
    CAT_SECONDARY_SUMMARY_KEYS.find((key) => attributesByKey.has(key)) ?? 'hpRecovery';

  return ['maxHp', secondaryKey, 'runSpeed', 'jumpSpeed', 'attackCooldown', 'attackRange'];
};

const optionalNumber = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : formatActorAttributeNumber(value);

const getRankableProperty = (
  key: ActorAttributeKey,
  context: ActorContext,
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
    case 'jumpSpeed':
      return 'jumpSpeed';
    case 'climbSpeed':
      return 'climbSpeed';
    case 'visionScale':
      return 'visionScale';
    case 'gravity':
      return 'gravity';
    case 'attack':
      return 'attackBoost';
    case 'wallDamage':
      return factionId === 'mouse' ? 'wallCrackDamageBoost' : undefined;
    case 'attackRange':
      return factionId === 'cat' ? 'clawKnifeRange' : undefined;
    case 'pushCheeseSpeed':
      return factionId === 'mouse' ? 'cheesePushSpeed' : undefined;
    case 'deformCooldown':
      return 'deformCooldown';
    case 'shoppingDelay':
      return factionId === 'cat' ? 'shoppingDelay' : undefined;
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

const createDisplayedActorAttributes = (
  profile: ActorProfile,
  context: ActorContext,
  factionId: FactionId | undefined,
  EnglishName: string | undefined,
  hideGravity: boolean
): readonly DisplayedActorAttribute[] => {
  const isObject = context === 'object';
  const isMouseCharacter = context === 'character' && factionId === 'mouse';
  const isCatCharacter = context === 'character' && factionId === 'cat';

  return [
    {
      key: 'actorType',
      value: isObject ? formatActorType(profile.actorType) : undefined,
    },
    {
      key: 'physicsType',
      value: isObject ? formatActorPhysicsType(profile.physicsType) : undefined,
    },
    { key: 'sex', value: formatActorSex(profile.sex) },
    { key: 'EnglishName', value: EnglishName },
    {
      key: 'maxHp',
      value: formatActorAttributeNumber(profile.maxHp),
    },
    {
      key: 'hpRecovery',
      value: formatActorAttributeNumber(profile.hpRecovery),
    },
    {
      key: 'runSpeed',
      value: formatActorAttributeNumber(profile.runSpeed),
    },
    {
      key: 'jumpSpeed',
      value: formatActorAttributeNumber(profile.jumpSpeed),
    },
    // { key: 'size', value: formatActorSize(profile.size) },
    {
      key: 'climbSpeed',
      value: formatActorAttributeNumber(profile.climbSpeed),
    },
    {
      key: 'visionScale',
      value: formatActorAttributeNumber(profile.visionScale),
    },
    {
      key: 'gravity',
      value: hideGravity
        ? undefined
        : formatActorAttributeNumber(getDisplayedActorGravity(profile)),
    },
    {
      key: 'attack',
      value:
        isObject || isMouseCharacter || profile.attack !== 0
          ? optionalNumber(profile.attack)
          : undefined,
    },
    {
      key: 'wallDamage',
      value:
        isObject || isMouseCharacter ? formatActorAttributeNumber(profile.wallDamage) : undefined,
    },
    {
      key: 'attackRange',
      value: isObject || isCatCharacter ? optionalNumber(profile.attackRange) : undefined,
    },
    {
      key: 'attackCooldown',
      value: isObject || isCatCharacter ? profile.attackCooldown : undefined,
      renderKind: 'attackCooldown',
    },
    {
      key: 'pushCheeseSpeed',
      value: isObject || isMouseCharacter ? optionalNumber(profile.pushCheeseSpeed) : undefined,
    },
    {
      key: 'initialItem',
      value:
        isObject || (isCatCharacter && profile.initialItem !== '老鼠夹')
          ? profile.initialItem
          : undefined,
    },
    {
      key: 'deformCooldown',
      value: optionalNumber(profile.deformCooldown),
    },
    {
      key: 'shoppingDelay',
      value: isObject || isCatCharacter ? optionalNumber(profile.shoppingDelay) : undefined,
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
  const { isDetailedView } = useAppContext();
  const profile = getActorProfile(name);
  const hideGravity = context === 'character' && isFactionDisplayedGravityUniform(factionId);
  const visibleAttributes = createDisplayedActorAttributes(
    profile,
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
          const presentation = ACTOR_ATTRIBUTE_PRESENTATION[attribute.key];
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
              <Tooltip
                content={isDetailedView ? presentation.detailedTooltip : presentation.tooltip}
              >
                {presentation.label}
              </Tooltip>
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
          <div className='border-border flex-1 border-t' />
          <Button
            variant='unstyled'
            type='button'
            onClick={() => setExpanded((current) => !current)}
            aria-controls={contentId}
            aria-expanded={expanded}
            className='focus-visible:ring-focus flex shrink-0 items-center gap-1 rounded-sm text-base font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus-visible:ring-offset-slate-800'
          >
            <span>{expanded ? '收起' : '展开'}</span>
            <ChevronDownIcon
              className={cn(
                'size-4 transition-transform motion-reduce:transition-none',
                expanded && 'rotate-180'
              )}
            />
          </Button>
          <div className='border-border flex-1 border-t' />
        </div>
      ) : null}
    </div>
  );
}
