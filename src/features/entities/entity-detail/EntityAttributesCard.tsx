'use client';

import { getEntityTypeColors } from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalEntity } from '@/context/EditModeContext';
import { Entity } from '@/data/types';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { entitiesEdit } from '@/data';

import getEntityFactionId from '../lib/getEntityFactionId';

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { entityName } = useLocalEntity();
  const ed = editable('entities');

  if (!entity) return null;

  const rawEntity = entitiesEdit[entityName];

  const collisionOptions = ['角色', '道具', '墙壁', '平台', '地面'] as const;
  const activeCollision = Array.isArray(rawEntity?.collsion) ? rawEntity.collsion : [];

  const factionId = getEntityFactionId(entity);

  function putTypeTagOn(entity: Entity) {
    if (typeof entity.entitytype === 'string') {
      return (
        <Tag
          size='sm'
          margin='compact'
          colorStyles={getEntityTypeColors(entity.entitytype, isDarkMode)}
        >
          <ed.span path='entitytype' initialValue={entity.entitytype ?? '<无内容>'} isSingleLine />
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
      aliases={isEditMode ? undefined : entity.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(rawEntity?.aliases ?? entity.aliases ?? []).length > 0 ? (
              (rawEntity?.aliases ?? entity.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawEntity) return;
                      if (!rawEntity.aliases) rawEntity.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawEntity.aliases = rawEntity.aliases.filter((_, i) => i !== index);
                      } else {
                        rawEntity.aliases[index] = trimmed;
                      }
                    }}
                  />
                  {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                </span>
              ))
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <button
              type='button'
              aria-label='添加别名'
              onClick={() => {
                if (!rawEntity) return;
                if (!rawEntity.aliases) rawEntity.aliases = [];
                if (!rawEntity.aliases.includes('新别名')) {
                  rawEntity.aliases.push('新别名');
                }
              }}
              className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
            >
              <PlusIcon className='h-3 w-3' aria-hidden='true' />
            </button>
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {putTypeTagOn(entity)}
          </div>
          {entity.owner && (
            <div className='flex items-center gap-2 text-sm'>
              <SingleItemAccordionCard items={entity.owner} title='归属者：' />
            </div>
          )}
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
                      ：
                      <span className='text-indigo-700 dark:text-indigo-400'>
                        <ed.span
                          path={`entityAttributesAsCharacter.${
                            title === 'Hp上限'
                              ? 'maxHp'
                              : title === 'Hp恢复'
                                ? 'hpRecovery'
                                : title === '移速'
                                  ? 'moveSpeed'
                                  : title === '跳跃'
                                    ? 'jumpHeight'
                                    : 'attackBoost'
                          }`}
                          initialValue={text ?? '<无内容>'}
                          valueType='number'
                          isSingleLine
                        />
                      </span>
                    </span>
                  )
                )}
              </div>
            </div>
          )}
          {(isEditMode ||
            entity.move !== undefined ||
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
                {isEditMode ? (
                  <>
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>移动:</span>
                      <label className='flex cursor-pointer items-center gap-1'>
                        <input
                          type='checkbox'
                          checked={rawEntity?.move ?? false}
                          onChange={(e) => {
                            if (!rawEntity) return;
                            rawEntity.move = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(rawEntity?.move ?? false) ? '可移动' : '不可移动'}
                        </span>
                      </label>
                    </div>
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>重力:</span>
                      <label className='flex cursor-pointer items-center gap-1'>
                        <input
                          type='checkbox'
                          checked={rawEntity?.gravity ?? false}
                          onChange={(e) => {
                            if (!rawEntity) return;
                            rawEntity.gravity = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(rawEntity?.gravity ?? false) ? '会受重力影响' : '不受重力影响'}
                        </span>
                      </label>
                    </div>
                    <div className='col-span-2 flex flex-wrap items-center gap-2 text-xs'>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>碰撞:</span>
                      {collisionOptions.map((opt) => (
                        <label key={opt} className='flex cursor-pointer items-center gap-1'>
                          <input
                            type='checkbox'
                            checked={activeCollision.includes(opt)}
                            onChange={(e) => {
                              if (!rawEntity) return;
                              const next = new Set(activeCollision);
                              if (e.target.checked) next.add(opt);
                              else next.delete(opt);
                              const arr = Array.from(next);
                              if (arr.length === 0) {
                                delete rawEntity.collsion;
                              } else {
                                rawEntity.collsion = arr;
                              }
                            }}
                            className='h-3 w-3'
                          />
                          <span className='font-bold'>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
