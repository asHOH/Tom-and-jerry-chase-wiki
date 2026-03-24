'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getEntityTypeColors, getFactionButtonColors } from '@/lib/design';
import { getSpecifyTypePositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { Entity, Entitytaglist, Entitytypelist } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import Tooltip from '@/components/ui/Tooltip';
import Link from '@/components/Link';
import { entitiesEdit } from '@/data';

import getEntityFactionId from '../lib/getEntityFactionId';
import EntityCardDisplay from './EntityCardDisplay';

// 根据修改后的 types.ts 定义新的选项列表
// 注意：以下常量应与实际 types 中导出的值保持一致
// 实际使用时建议从 types 中导入预定义的数组常量
const ENTITY_TYPE_OPTIONS: Entitytypelist[] = [
  '投射类',
  '触发类',
  '物件类',
  'NPC',
  '变身类',
  '特殊类',
];

const ENTITY_TAG_OPTIONS: Entitytaglist[] = [
  '抛掷',
  '平射',
  '追踪',
  '触发',
  '延时',
  '遥控',
  '功能',
  '阻挡',
  '指示',
  'NPC',
  '变形',
  '变身',
  '拾取',
  '交互',
  '伤害',
  '硬控',
  '群体',
  '命中',
  '增益',
  '复用',
  '巡逻',
  '衍生',
  '彩蛋',
  '星元',
  '特殊',
];

type Props = { description?: string };

export default function EntityClient({ description }: Props) {
  // 基础筛选状态
  const [selectedTypes, setSelectedTypes] = useState<Entitytypelist[]>([]);
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse' | 'other')[]>([]);

  // 标签筛选相关状态
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Entitytaglist[]>([]);

  // 筛选逻辑开关：true = AND（所有选中项都必须满足），false = OR（满足任一即可）
  const [andMode, setAndMode] = useState(false);

  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  // 辅助函数：检查 entitytype 是否匹配（根据 andMode 决定逻辑）
  function matchesType(entity: Entity): boolean {
    if (selectedTypes.length === 0) return true;

    // 将 entitytype 统一转为数组处理
    const entityTypes = Array.isArray(entity.entitytype) ? entity.entitytype : [entity.entitytype];

    if (andMode) {
      // AND 逻辑：所有选中的类型都必须出现在 entityTypes 中
      return selectedTypes.every((type) => entityTypes.includes(type));
    } else {
      // OR 逻辑：至少有一个选中的类型出现在 entityTypes 中
      return selectedTypes.some((type) => entityTypes.includes(type));
    }
  }

  // 辅助函数：检查 entitytag 是否匹配（根据 andMode 决定逻辑）
  function matchesTag(entity: Entity): boolean {
    // 如果未启用标签筛选或未选中任何标签，则认为匹配
    if (!showTagFilter || selectedTags.length === 0) return true;

    // 如果实体没有 entitytag 字段，则无法匹配任何标签
    if (!entity.entitytag) return false;

    const entityTags = Array.isArray(entity.entitytag) ? entity.entitytag : [entity.entitytag];

    if (andMode) {
      // AND 逻辑：所有选中的标签都必须出现在 entityTags 中
      return selectedTags.every((tag) => entityTags.includes(tag));
    } else {
      // OR 逻辑：至少有一个选中的标签出现在 entityTags 中
      return selectedTags.some((tag) => entityTags.includes(tag));
    }
  }

  // 辅助函数：检查阵营是否匹配（根据 andMode 决定逻辑）
  function matchesFaction(entity: Entity): boolean {
    if (selectedFactions.length === 0) return true;

    const entityFaction = getEntityFactionId(entity);

    if (andMode) {
      // AND 逻辑：实体的阵营必须等于每一个选中的阵营（不可能同时为猫和鼠，所以此时结果必然为 false）
      // 为了直观，我们直接判断实体的阵营是否在选中列表中，并且选中的阵营数量必须为 1
      // 如果选中的阵营数量大于 1，AND 逻辑下永远不匹配
      if (selectedFactions.length > 1) return false;
      // 唯一选中阵营时，实体的阵营必须等于它
      return selectedFactions[0] === entityFaction;
    } else {
      // OR 逻辑：实体的阵营属于选中阵营之一
      const isCat = selectedFactions.includes('cat');
      const isMouse = selectedFactions.includes('mouse');
      const isOther = selectedFactions.includes('other');
      return (
        (isCat && entityFaction === 'cat') ||
        (isMouse && entityFaction === 'mouse') ||
        (isOther && entityFaction !== 'cat' && entityFaction !== 'mouse')
      );
    }
  }

  const entitiesSnapshot = useSnapshot(entitiesEdit);
  const filteredEntities = Object.values(entitiesSnapshot as Record<string, Entity>).filter(
    (entity: Entity) => {
      return matchesType(entity) && matchesFaction(entity) && matchesTag(entity);
    }
  );

  return (
    <CatalogPageShell
      title='衍生物'
      description={description ?? ''}
      filters={
        <>
          {/* 类型筛选 */}
          <FilterRow<Entitytypelist>
            label='类型筛选:'
            options={ENTITY_TYPE_OPTIONS}
            isActive={(type) => selectedTypes.includes(type)}
            onToggle={(type) =>
              setSelectedTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
              )
            }
            getOptionLabel={(opt) => opt}
            renderOption={(tag, button) => (
              <Tooltip
                key={String(tag)}
                content={getSpecifyTypePositioningTagTooltipContent(tag, 'entity')}
                className='cursor-pointer border-none'
              >
                {button}
              </Tooltip>
            )}
            getButtonStyle={(type, active) => {
              if (!active) return undefined;
              const colors = getEntityTypeColors(type, isDarkMode, false);
              return { backgroundColor: colors.backgroundColor, color: colors.color };
            }}
          />

          {/* 阵营筛选 */}
          <FilterRow<'cat' | 'mouse' | 'other'>
            label='阵营筛选:'
            options={['cat', 'mouse', 'other']}
            isActive={(f) => selectedFactions.includes(f)}
            onToggle={(f) =>
              setSelectedFactions((prev) =>
                prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
              )
            }
            getOptionLabel={(f) => {
              if (isMobile) {
                return f === 'cat' ? '猫阵营' : f === 'mouse' ? '鼠阵营' : '其它';
              }
              return f === 'cat' ? '猫阵营' : f === 'mouse' ? '鼠阵营' : '其它';
            }}
            getButtonStyle={(f, active) => {
              if (f === 'other') {
                return undefined;
              }
              return active ? getFactionButtonColors(f, isDarkMode) : undefined;
            }}
            getButtonClassName={(f, active) =>
              active && f === 'other'
                ? 'bg-gray-400 text-gray-800 border border-gray-400 dark:bg-gray-500 dark:text-gray-100 dark:border-gray-500'
                : ''
            }
          />

          {/* 控制区域：显示标签筛选 + 精确匹配 */}
          <div className='mt-2 flex items-center justify-end gap-4 md:mt-4'>
            <label className='inline-flex cursor-pointer items-center select-none'>
              <input
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                checked={showTagFilter}
                onChange={(e) => {
                  setShowTagFilter(e.target.checked);
                  // 当隐藏标签筛选时，清空已选标签，避免下次显示时仍保留旧值
                  if (!e.target.checked) {
                    setSelectedTags([]);
                  }
                }}
              />
              <span className='ml-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                显示标签
              </span>
            </label>

            <label className='inline-flex cursor-pointer items-center select-none'>
              <input
                type='checkbox'
                className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                checked={andMode}
                onChange={(e) => setAndMode(e.target.checked)}
              />
              <span className='ml-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
                精准筛选
              </span>
            </label>
          </div>

          {/* 条件渲染标签筛选行 */}
          {showTagFilter && (
            <FilterRow<Entitytaglist>
              label='标签筛选:'
              options={ENTITY_TAG_OPTIONS}
              isActive={(tag) => selectedTags.includes(tag)}
              onToggle={(tag) =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                )
              }
              getOptionLabel={(opt) => opt}
              renderOption={(tag, button) => (
                <Tooltip
                  key={String(tag)}
                  content={getSpecifyTypePositioningTagTooltipContent(tag, 'entity')}
                  className='cursor-pointer border-none'
                >
                  {button}
                </Tooltip>
              )}
              innerClassName='flex flex-wrap gap-1 md:gap-1.5'
              getButtonStyle={(tag, active) => {
                if (!active) return undefined;
                const colors = getEntityTypeColors(tag, isDarkMode, false);
                return { backgroundColor: colors.backgroundColor, color: colors.color };
              }}
            />
          )}
        </>
      }
    >
      <div className='auto-fit-grid grid-container grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-4'>
        {filteredEntities.length > 0 ? (
          filteredEntities.map((entity) => (
            <div
              key={entity.name}
              className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
            >
              <Link href={`/entities/${encodeURIComponent(entity.name)}`} className='block'>
                <EntityCardDisplay entity={entity} showTags={showTagFilter} />
              </Link>
            </div>
          ))
        ) : (
          <div className='col-span-full flex items-center justify-center py-12 text-lg text-gray-500 dark:text-gray-400'>
            未筛选到任何结果
          </div>
        )}
      </div>
    </CatalogPageShell>
  );
}
