'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/design';
import type { FactionId } from '@/data/types';
import Tooltip from '@/components/ui/Tooltip';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

import {
  CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS,
  formatCharacterRoleAttackCooldown,
  formatCharacterRoleNumber,
  formatCharacterRolePhysicsType,
  formatCharacterRoleSex,
  formatCharacterRoleSize,
  formatCharacterRoleType,
  getCharacterRole,
  getCharacterRoleJumpHeight,
  getDisplayedCharacterRoleGravity,
  isFactionDisplayedGravityUniform,
  type CharacterRole,
  type CharacterRoleAttributeKey,
} from '..';

export type CharacterRoleAttributesContext = 'character' | 'object';

type CharacterContextProps = {
  context: 'character';
  factionId: FactionId;
};

type ObjectContextProps = {
  context: 'object';
  factionId?: never;
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

const SUMMARY_KEYS: Readonly<
  Record<CharacterRoleAttributesContext, readonly CharacterRoleAttributeKey[]>
> = {
  character: ['sex', 'EnglishName', 'maxHp', 'hpRecovery', 'runSpeed', 'jumpHeight'],
  object: ['roleType', 'physicsType', 'maxHp', 'hpRecovery', 'runSpeed', 'attackCooldown'],
};

const optionalNumber = (value: number | undefined): string | undefined =>
  value === undefined ? undefined : formatCharacterRoleNumber(value);

const createAttributeItems = (
  role: CharacterRole,
  context: CharacterRoleAttributesContext,
  EnglishName: string | undefined,
  hideGravity: boolean
): readonly AttributeItem[] => [
  {
    key: 'roleType',
    label: '角色类型',
    value: context === 'character' ? undefined : formatCharacterRoleType(role.roleType),
    numeric: false,
  },
  {
    key: 'physicsType',
    label: '物理特质',
    value: context === 'character' ? undefined : formatCharacterRolePhysicsType(role.physicsType),
    numeric: false,
  },
  { key: 'sex', label: '性别', value: formatCharacterRoleSex(role.sex), numeric: false },
  { key: 'EnglishName', label: '英文名', value: EnglishName, numeric: false },
  { key: 'size', label: '体型', value: formatCharacterRoleSize(role.size), numeric: false },
  {
    key: 'baseHp',
    label: '基础Hp',
    value: role.baseHp === role.maxHp ? undefined : formatCharacterRoleNumber(role.baseHp),
    numeric: true,
  },
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
    suffix: 'Hp/秒',
    numeric: true,
  },
  {
    key: 'runSpeed',
    label: '移动速度',
    value: formatCharacterRoleNumber(role.runSpeed),
    suffix: '单位长/秒',
    numeric: true,
  },
  {
    key: 'jumpSpeed',
    label: '跳跃速度',
    value: formatCharacterRoleNumber(role.jumpSpeed),
    suffix: '单位长/秒',
    numeric: true,
  },
  {
    key: 'jumpHeight',
    label: '跳跃高度',
    value: formatCharacterRoleNumber(getCharacterRoleJumpHeight(role)),
    suffix: '单位长',
    numeric: true,
  },
  {
    key: 'climbSpeed',
    label: '攀爬速度',
    value: formatCharacterRoleNumber(role.climbSpeed),
    suffix: '单位长/秒',
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
  { key: 'attack', label: '攻击力', value: optionalNumber(role.attack), numeric: true },
  {
    key: 'wallDamage',
    label: '破坏力',
    value: formatCharacterRoleNumber(role.wallDamage),
    numeric: true,
  },
  {
    key: 'attackRange',
    label: '攻击范围',
    value: optionalNumber(role.attackRange),
    numeric: true,
  },
  {
    key: 'attackCooldown',
    label: '攻击冷却',
    value: formatCharacterRoleAttackCooldown(role.attackCooldown),
    numeric: true,
  },
  {
    key: 'pushCheeseSpeed',
    label: '推奶酪速度',
    value: optionalNumber(role.pushCheeseSpeed),
    suffix: '%/秒',
    numeric: true,
  },
  {
    key: 'initialItem',
    label: '初始道具',
    value: role.initialItem,
    numeric: false,
  },
  {
    key: 'deformCooldown',
    label: '变形彩蛋CD',
    value: optionalNumber(role.deformCooldown),
    suffix: '秒',
    numeric: true,
  },
  {
    key: 'shoppingCooldown',
    label: '购物CD',
    value: optionalNumber(role.shoppingCooldown),
    suffix: '秒',
    numeric: true,
  },
  {
    key: 'shoppingDelay',
    label: '购物所需时间',
    value: optionalNumber(role.shoppingDelay),
    suffix: '秒',
    numeric: true,
  },
];

export default function CharacterRoleAttributesCard({
  name,
  className,
  EnglishName,
  context,
  factionId,
}: CharacterRoleAttributesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const role = getCharacterRole(name);
  const hideGravity = context === 'character' && isFactionDisplayedGravityUniform(factionId);
  const visibleAttributes = createAttributeItems(role, context, EnglishName, hideGravity).filter(
    (attribute) => attribute.value !== undefined
  );
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
        {displayedAttributes.map((attribute) => (
          <p
            key={attribute.key}
            className='flex items-baseline gap-1 py-1 text-sm text-gray-700 dark:text-gray-300'
          >
            <Tooltip content={CHARACTER_ROLE_ATTRIBUTE_TOOLTIPS[attribute.key]}>
              {attribute.label}
            </Tooltip>
            {': '}
            <span className={cn('truncate', attribute.numeric && NUMBER_VALUE_CLASS)}>
              {attribute.value}
            </span>
            {attribute.suffix ? (
              <span className='flex-shrink-0 text-xs text-gray-400 dark:text-gray-500'>
                {attribute.suffix}
              </span>
            ) : null}
          </p>
        ))}
      </div>

      {hasMore ? (
        <div className='flex items-center justify-center gap-4 pt-1'>
          <div className='flex-1 border-t border-gray-200 dark:border-gray-700' />
          <button
            type='button'
            onClick={() => setExpanded((current) => !current)}
            aria-controls={contentId}
            aria-expanded={expanded}
            className='flex flex-shrink-0 items-center gap-1 rounded-sm text-base font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:text-gray-400 dark:hover:text-gray-200 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-slate-800'
          >
            <span>{expanded ? '收起' : '展开全部'}</span>
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
