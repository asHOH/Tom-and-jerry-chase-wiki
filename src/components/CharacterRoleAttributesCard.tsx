// src/features/characters/components/CharacterRoleAttributes.tsx
import { Component } from 'react';

import { cn } from '@/lib/design';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import rawRoles from '@/data/roles.json';
import type { characterRoles } from '@/data/types';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

import Tooltip from './ui/Tooltip';

const NUMBER_VALUE_CLASS = 'text-blue-500 dark:text-sky-300';

// 构建角色映射（模块级缓存）
const characterRolesMap: Record<string, characterRoles> = {};
(rawRoles as characterRoles[]).forEach((role) => {
  if (role.name) {
    characterRolesMap[role.name] = role;
  }
});

function getCharacterRole(name: string): characterRoles | undefined {
  return characterRolesMap[name];
}

// ---------- 格式化函数 ----------
function formatRoleType(val: unknown): string {
  const type = val as number | undefined;
  if (type === 0) return '老鼠';
  if (type === 1) return '猫咪';
  if (type === 2) return '特殊';
  return '未知';
}

function formatSex(val: unknown): string {
  const sex = val as number | undefined;
  if (sex === 1) return '男性';
  if (sex === 2) return '女性';
  if (sex === 0) return '无性别';
  return '未知';
}

function formatPhysicsTag(val: unknown): string {
  const tag = val as number | undefined;
  if (tag === 1) return '鼠';
  if (tag === 2) return '猫';
  if (tag === 1009) return '特殊';
  return '未知';
}

function formatSize(val: unknown): string {
  const size = val as string | undefined;
  if (!size) return '';
  const parts = size.split(';');
  if (parts.length === 2) {
    return `${parts[0]} × ${parts[1]}`;
  }
  return size;
}

function formatPushCheese(val: unknown): string {
  const value = val as number | undefined;
  if (value === undefined || value === null) return '';
  return String(value * 5);
}

function formatItemTag(val: unknown): string {
  const tag = val as string | undefined;
  if (tag === 'rattrap') return '老鼠夹';
  if (tag === 'dazhadan') return '大鞭炮';
  return '未知';
}

// ---------- 组件 ----------
interface CharacterRoleAttributesProps {
  name: string;
  className?: string;
  EnglishName?: string;
}

type AttrItem = {
  label: string;
  value: unknown;
  suffix?: string;
  formatter?: (val: unknown) => string;
};

interface State {
  expanded: boolean;
}

export default class CharacterRoleAttributes extends Component<
  CharacterRoleAttributesProps,
  State
> {
  state: State = {
    expanded: false,
  };

  toggleExpanded = () => {
    this.setState((prevState) => ({ expanded: !prevState.expanded }));
  };

  render() {
    const { name, className, EnglishName } = this.props;
    const { expanded } = this.state;

    const data = getCharacterRole(name);
    if (!data) {
      return (
        <p className='text-sm text-gray-500 dark:text-gray-400'>未找到角色 “{name}” 的属性数据</p>
      );
    }

    const attrList: AttrItem[] = [
      { label: '角色类型', value: data.roleType, formatter: formatRoleType },
      { label: '物理特质', value: data.physicsTag, formatter: formatPhysicsTag },
      { label: '性别', value: data.sex, formatter: formatSex },
      { label: '英文名', value: EnglishName },
      { label: '体型', value: data.size, formatter: formatSize },
      { label: '移动速度', value: data.runSpeed, suffix: ' /秒' },
      { label: '跳跃速度', value: data.jumpSpeed, suffix: ' /秒' },
      { label: '攀爬速度', value: data.climbSpeed, suffix: ' /秒' },
      //{ label: '基础Hp', value: data.baseHp },
      { label: 'Hp上限', value: data.maxHp },
      { label: 'Hp恢复', value: data.hpRecover, suffix: ' /秒' },
      { label: '攻击力', value: data.attack },
      { label: '破坏力', value: data.attackGoldGate },
      { label: '攻击范围', value: data.attackRange },
      { label: '攻击冷却', value: data.attackCd, suffix: ' s' },
      { label: '空刀CD比例', value: data.attackMissCdRate },
      {
        label: '推奶酪速度',
        value: data.pushCheese,
        formatter: formatPushCheese,
        suffix: ' %/秒',
      },
      { label: '视野缩放', value: data.vision },
      { label: '重力参数', value: data.gravity },
      { label: '初始道具', value: data.item, formatter: formatItemTag },
      { label: '购物所需时间', value: data.buyDelay, suffix: ' 秒' },
      { label: '变形彩蛋CD', value: data.deformCD, suffix: ' 秒' },
      //{ label: '购物CD', value: data.buyCD, suffix: ' 秒' },
    ];

    const visible = attrList.filter((item) => item.value !== undefined && item.value !== null);

    const displayed = expanded ? visible : visible.slice(0, 6);
    const hasMore = visible.length > 6;

    return (
      <div className={cn('space-y-3', className)}>
        <div className='grid grid-cols-2 gap-3'>
          {displayed.map((item) => {
            const displayValue =
              item.formatter && item.value !== undefined
                ? item.formatter(item.value)
                : String(item.value);
            const isNumber = typeof item.value === 'number';

            return (
              <p
                key={item.label}
                className='flex items-baseline gap-1 py-1 text-sm text-gray-700 dark:text-gray-300'
              >
                <Tooltip content={getSpecifyTypePositioningTagTooltipContent(item.label, 'role')}>
                  {item.label}
                </Tooltip>
                {': '}
                <span className={cn('truncate', isNumber && NUMBER_VALUE_CLASS)}>
                  {displayValue}
                </span>
                {item.suffix && (
                  <span className='flex-shrink-0 text-xs text-gray-400 dark:text-gray-500'>
                    {item.suffix}
                  </span>
                )}
              </p>
            );
          })}
        </div>

        {hasMore && (
          <div className='flex items-center justify-center gap-4 pt-1'>
            {/* 左侧分隔线 */}
            <div className='flex-1 border-t border-gray-200 dark:border-gray-700' />
            {/* 切换按钮 - 字体放大，居中悬浮 */}
            <button
              type='button'
              onClick={this.toggleExpanded}
              aria-expanded={expanded}
              className='flex flex-shrink-0 items-center gap-1 text-base font-medium text-gray-500 transition-colors hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-gray-200'
            >
              <span>{expanded ? '收起' : '展开全部'}</span>
              <ChevronDownIcon
                className={cn(
                  'size-4 transition-transform motion-reduce:transition-none',
                  expanded && 'rotate-180'
                )}
              />
            </button>
            {/* 右侧分隔线 */}
            <div className='flex-1 border-t border-gray-200 dark:border-gray-700' />
          </div>
        )}
      </div>
    );
  }
}
