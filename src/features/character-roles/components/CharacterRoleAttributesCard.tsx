'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/design';
import type { FactionId } from '@/data/types';
import type { RankableProperty } from '@/features/characters/utils/ranking';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

import {
  formatCharacterRoleAttackCooldown,
  formatCharacterRoleNumber,
  formatCharacterRolePhysicsType,
  formatCharacterRoleSex,
  formatCharacterRoleSize,
  formatCharacterRoleType,
} from '../formatters';
import type { CharacterRole } from '../schema';
import {
  getCharacterRole,
  getDisplayedCharacterRoleGravity,
  isFactionDisplayedGravityUniform,
} from '../selectors';
import { CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS, type CharacterRoleAttributeKey } from '../tooltips';

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

type CharacterRoleAttributesCardProps = {
  name: string;
  className?: string;
  EnglishName?: string;
} & (CharacterContextProps | ObjectContextProps);

type AttributeItem = {
  key: CharacterRoleAttributeKey;
  label: string;
  value: string | undefined;
  suffix?: string;
  numeric: boolean;
};

const NUMBER_VALUE_CLASS = 'text-blue-500 dark:text-sky-300';
const RANKING_LINK_CLASS = 'cursor-pointer hover:underline focus-visible:underline';

const SUMMARY_KEYS: Readonly<
  Record<CharacterRoleAttributesContext, readonly CharacterRoleAttributeKey[]>
> = {
  character: ['maxHp', 'hpRecovery', 'runSpeed', 'jumpSpeed'],
  object: ['roleType', 'physicsType', 'maxHp', 'hpRecovery', 'runSpeed', 'attackCooldown'],
};

const optionalNumber = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : formatCharacterRoleNumber(value);

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
  role: CharacterRole;
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
  const formattedValue = formatCharacterRoleNumber(value);
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
      <span className={NUMBER_VALUE_CLASS}>{formatCharacterRoleNumber(value)}</span>)
    </>
  );

const AttackCooldownValue = ({ role, factionId, specialHit, specialMiss }: CooldownValueProps) => (
  <span>
    {role.attackCooldown.miss === undefined ? (
      <>
        命中{' '}
        <CooldownNumber
          value={role.attackCooldown.hit}
          property='clawKnifeCdHit'
          factionId={factionId}
        />
        <SpecialCooldown value={specialHit} /> s
      </>
    ) : (
      <>
        <CooldownNumber
          value={role.attackCooldown.miss}
          property='clawKnifeCdUnhit'
          factionId={factionId}
        />
        <SpecialCooldown value={specialMiss} /> /{' '}
        <CooldownNumber
          value={role.attackCooldown.hit}
          property='clawKnifeCdHit'
          factionId={factionId}
        />
        <SpecialCooldown value={specialHit} /> s
      </>
    )}
  </span>
);

const createAttributeItems = (
  role: CharacterRole,
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
      key: 'roleType',
      label: '角色类型',
      value: isObject ? formatCharacterRoleType(role.roleType) : undefined,
      numeric: false,
    },
    {
      key: 'physicsType',
      label: '物理特质',
      value: isObject ? formatCharacterRolePhysicsType(role.physicsType) : undefined,
      numeric: false,
    },
    { key: 'sex', label: '性别', value: formatCharacterRoleSex(role.sex), numeric: false },
    { key: 'EnglishName', label: '英文名', value: EnglishName, numeric: false },
    {
      key: 'maxHp',
      label: 'Hp上限',
      value: formatCharacterRoleNumber(role.maxHp),
      numeric: true,
    },
    {
      key: 'hpRecovery',
      label: 'Hp恢复',
      value: formatCharacterRoleNumber(role.hpRecovery),
      suffix: 'Hp/s',
      numeric: true,
    },
    {
      key: 'runSpeed',
      label: '移速',
      value: formatCharacterRoleNumber(role.runSpeed),
      suffix: '/s',
      numeric: true,
    },
    {
      key: 'jumpSpeed',
      label: '跳跃速度',
      value: formatCharacterRoleNumber(role.jumpSpeed),
      suffix: '/s',
      numeric: true,
    },
    { key: 'size', label: '体型', value: formatCharacterRoleSize(role.size), numeric: false },
    {
      key: 'climbSpeed',
      label: '攀爬速度',
      value: formatCharacterRoleNumber(role.climbSpeed),
      suffix: '/s',
      numeric: true,
    },
    {
      key: 'visionScale',
      label: '视野缩放',
      value: formatCharacterRoleNumber(role.visionScale),
      numeric: true,
    },
    {
      key: 'gravity',
      label: '重力参数',
      value: hideGravity
        ? undefined
        : formatCharacterRoleNumber(getDisplayedCharacterRoleGravity(role)),
      numeric: true,
    },
    {
      key: 'attack',
      label: '攻击力',
      value:
        isObject || isMouseCharacter || role.attack !== 0 ? optionalNumber(role.attack) : undefined,
      numeric: true,
    },
    {
      key: 'wallDamage',
      label: '破坏力',
      value: isObject || isMouseCharacter ? formatCharacterRoleNumber(role.wallDamage) : undefined,
      numeric: true,
    },
    {
      key: 'attackRange',
      label: '爪刀范围',
      value: isObject || isCatCharacter ? optionalNumber(role.attackRange) : undefined,
      numeric: true,
    },
    {
      key: 'attackCooldown',
      label: '爪刀CD',
      value:
        isObject || isCatCharacter
          ? formatCharacterRoleAttackCooldown(role.attackCooldown)
          : undefined,
      numeric: true,
    },
    {
      key: 'pushCheeseSpeed',
      label: '推速',
      value: isObject || isMouseCharacter ? optionalNumber(role.pushCheeseSpeed) : undefined,
      suffix: '%/s',
      numeric: true,
    },
    {
      key: 'initialItem',
      label: '初始道具',
      value:
        isObject || (isCatCharacter && role.initialItem !== '老鼠夹')
          ? role.initialItem
          : undefined,
      numeric: false,
    },
    {
      key: 'deformCooldown',
      label: '变形彩蛋CD',
      value: optionalNumber(role.deformCooldown),
      suffix: 's',
      numeric: true,
    },
    {
      key: 'shoppingDelay',
      label: '购物到货时间',
      value: isObject || isCatCharacter ? optionalNumber(role.shoppingDelay) : undefined,
      suffix: 's',
      numeric: true,
    },
  ];
};

export default function CharacterRoleAttributesCard({
  name,
  className,
  EnglishName,
  context,
  factionId,
  specialClawKnifeCdHit,
  specialClawKnifeCdUnhit,
}: CharacterRoleAttributesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const role = getCharacterRole(name);
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
  const collapsedAttributes = SUMMARY_KEYS[context].flatMap((key) => {
    const attribute = attributesByKey.get(key);
    return attribute ? [attribute] : [];
  });
  const displayedAttributes = expanded ? visibleAttributes : collapsedAttributes;
  const hasMore = visibleAttributes.length > collapsedAttributes.length;

  return (
    <div className={cn('space-y-3', className)}>
      <div id={contentId} className='grid grid-cols-2 gap-3'>
        {displayedAttributes.map((attribute) => {
          const rankableProperty = getRankableProperty(attribute.key, context, factionId);
          const value =
            attribute.key === 'attackCooldown' ? (
              <AttackCooldownValue
                role={role}
                factionId={context === 'character' ? factionId : undefined}
                specialHit={specialClawKnifeCdHit}
                specialMiss={specialClawKnifeCdUnhit}
              />
            ) : rankableProperty && factionId ? (
              <Link
                href={getRankingHref(rankableProperty, factionId)}
                className={cn(
                  'truncate',
                  attribute.numeric && NUMBER_VALUE_CLASS,
                  RANKING_LINK_CLASS
                )}
              >
                {attribute.value}
              </Link>
            ) : (
              <span className={cn('truncate', attribute.numeric && NUMBER_VALUE_CLASS)}>
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
              <Tooltip content={CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS[attribute.key]}>
                {attribute.label}
              </Tooltip>
              {': '}
              {value}
              {attribute.suffix ? (
                <span className='shrink-0 text-xs text-gray-400 dark:text-gray-500'>
                  {attribute.suffix}
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
