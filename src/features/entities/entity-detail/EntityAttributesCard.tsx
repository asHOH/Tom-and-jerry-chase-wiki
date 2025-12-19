'use client';

import { useState } from 'react'; // 移除 useMemo 导入

import { getEntityTypeColors } from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Entity } from '@/data/types';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemButton from '@/components/ui/SingleItemButton';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import AttributesCardLayout from '@/components/displays/shared/AttributesCardLayout';

import getEntityFactionId from '../lib/getEntityFactionId';

// 提取箭头SVG组件到函数外部
const ArrowIcon = ({ expanded }: { expanded: boolean }) => (
  <div className={`transition-transform duration-300 ${expanded ? 'rotate-90' : 'rotate-0'}`}>
    <svg
      className='h-5 w-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
    </svg>
  </div>
);

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const [expandedOwners, setExpandedOwners] = useState(false);

  if (!entity) return null;

  const factionId = getEntityFactionId(entity);

  // 将renderOwners改为普通函数
  function renderOwners() {
    if (!entity.owner) return null;

    // 如果是数组
    if (Array.isArray(entity.owner)) {
      const owners = entity.owner;

      // 空数组不显示
      if (owners.length === 0) {
        return null;
      }

      // 只有一个元素时按原方式显示
      if (owners.length === 1) {
        return (
          <span className='flex items-center text-sm'>
            {'归属者：'}
            {owners[0] !== undefined ? <SingleItemButton singleItem={owners[0]} /> : null}
          </span>
        );
      }

      // 多个元素时
      const firstOwner = owners[0];

      return (
        <div className='flex flex-col gap-2 text-sm'>
          <div className='flex items-center'>
            <span className='mr-2 whitespace-nowrap'>归属者：</span>
            <div className='flex flex-wrap items-center gap-1'>
              {firstOwner !== undefined ? <SingleItemButton singleItem={firstOwner} /> : null}
              <button
                onClick={() => setExpandedOwners(!expandedOwners)}
                className='ml-1 flex items-center justify-center rounded-full p-1.5 transition-all duration-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:outline-none dark:hover:bg-gray-800 dark:focus:ring-gray-600'
                aria-label={expandedOwners ? '折叠所有者列表' : '展开所有者列表'}
              >
                <ArrowIcon expanded={expandedOwners} />
              </button>
            </div>
          </div>

          {/* 展开的剩余所有者列表 */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedOwners ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div
              className={`flex flex-wrap gap-2 pt-1 transition-opacity duration-300 ${
                expandedOwners ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {owners.map((owner, index) => (
                <SingleItemButton key={index} singleItem={owner} size='small' />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 如果是单个元素
    return (
      <span className='flex items-center text-sm'>
        {'归属者：'}
        <SingleItemButton singleItem={entity.owner} />
      </span>
    );
  }

  function putTypeTagOn(entity: Entity) {
    if (typeof entity.entitytype === 'string') {
      return (
        <Tag
          size='sm'
          margin='compact'
          colorStyles={getEntityTypeColors(entity.entitytype, isDarkMode)}
        >
          {entity.entitytype}
        </Tag>
      );
    } else {
      return entity.entitytype.map((type) => {
        return (
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getEntityTypeColors(type, isDarkMode)}
            key={type}
          >
            {type}
          </Tag>
        );
      });
    }
  }

  return (
    <AttributesCardLayout
      imageUrl={entity.imageUrl}
      alt={entity.name}
      title={entity.name}
      subtitle={`(衍生物${factionId === 'cat' ? '·猫' : factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={entity.aliases}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {putTypeTagOn(entity)}
          </div>
          {renderOwners()}
          {entity.entityAttributesAsCharacter !== undefined && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-sm font-bold'>
                该衍生物特性与<span className='text-fuchsia-600 dark:text-fuchsia-400'>角色</span>
                类似，可看作
                {entity.entityAttributesAsCharacter.factionBelong === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫阵营</span>
                ) : entity.entityAttributesAsCharacter.factionBelong === 'mouse' ? (
                  <span className='text-amber-700 dark:text-amber-600'>鼠阵营</span>
                ) : (
                  <span className='text-fuchsia-600 dark:text-fuchsia-400'>第三阵营</span>
                )}
                的
                {entity.entityAttributesAsCharacter.type === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫角色</span>
                ) : entity.entityAttributesAsCharacter.type === 'mouse' ? (
                  <span className='text-amber-700 dark:text-amber-600'>鼠角色</span>
                ) : (
                  <span className='text-fuchsia-600 dark:text-fuchsia-400'>特殊角色</span>
                )}
              </span>
              <div
                className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
                style={{ gridTemplateColumns: `repeat(2, minmax(80px, 1fr))` }}
              >
                {[
                  entity.entityAttributesAsCharacter.maxHp === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp上限',
                        text: entity.entityAttributesAsCharacter.maxHp,
                      },
                  entity.entityAttributesAsCharacter.hpRecovery === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp恢复',
                        text: entity.entityAttributesAsCharacter.hpRecovery,
                      },
                  entity.entityAttributesAsCharacter.moveSpeed === undefined
                    ? { title: null, text: null }
                    : {
                        title: '移速',
                        text: entity.entityAttributesAsCharacter.moveSpeed,
                      },
                  entity.entityAttributesAsCharacter.jumpHeight === undefined
                    ? { title: null, text: null }
                    : {
                        title: '跳跃',
                        text: entity.entityAttributesAsCharacter.jumpHeight,
                      },
                  entity.entityAttributesAsCharacter.attackBoost === undefined
                    ? { title: null, text: null }
                    : {
                        title: '攻击增伤',
                        text: entity.entityAttributesAsCharacter.attackBoost,
                      },
                ].map(({ title, text }) =>
                  title === null ? null : (
                    <span className='text-sm whitespace-pre' key={title}>
                      <Tooltip
                        content={getTooltipContent(
                          title,
                          entity.entityAttributesAsCharacter?.type === 'cat' ? 'cat' : 'mouse',
                          isDetailed
                        )}
                      >
                        {title}
                      </Tooltip>
                      ：<span className='text-indigo-700 dark:text-indigo-400'>{text}</span>
                    </span>
                  )
                )}
              </div>
            </div>
          )}
          {(entity.move !== undefined ||
            entity.gravity !== undefined ||
            entity.collsion !== undefined) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>移动信息</span>
              <div
                className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
                style={{
                  gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                  gridTemplateRows: 'repeat(2,1fr)',
                }}
              >
                {entity.move !== undefined && (
                  <span className='text-sm whitespace-pre'>
                    {entity.move === true ? (
                      <span className='text-green-600 dark:text-green-500'>可</span>
                    ) : (
                      <span className='text-red-600 dark:text-red-500'>不可</span>
                    )}
                    移动
                  </span>
                )}
                {entity.gravity !== undefined && (
                  <span className='text-sm whitespace-pre'>
                    {entity.gravity === true ? (
                      <span className='text-orange-600 dark:text-orange-400'>会受</span>
                    ) : (
                      <span className='text-indigo-700 dark:text-indigo-400'>不受</span>
                    )}
                    重力影响
                  </span>
                )}
                <span className='text-sm whitespace-pre'>
                  {!!entity.collsion ? (
                    <>
                      <span className='text-orange-600 dark:text-orange-400'>会</span>与
                      {entity.collsion.map((string, key, array) => {
                        return (
                          <span key={key}>
                            <span
                              className={
                                string === '角色'
                                  ? 'text-red-600 dark:text-red-500'
                                  : string === '道具'
                                    ? 'text-indigo-700 dark:text-indigo-400'
                                    : 'text-fuchsia-600 dark:text-fuchsia-400'
                              }
                            >
                              {string}
                            </span>
                            {key < array.length - 1 ? '、' : ''}
                          </span>
                        );
                      })}
                      产生碰撞
                    </>
                  ) : (
                    <>
                      <span className='text-indigo-700 dark:text-indigo-400'>不会</span>
                      产生碰撞
                    </>
                  )}
                </span>
              </div>
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={entity.name} specifyType='entity' />
        </NavigationButtonsRow>
      }
    />
  );
}
