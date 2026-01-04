'use client';

import { useSnapshot } from 'valtio';

import {
  getItemSourceColors /* , getCardCostColors */,
  getItemTypeColors,
} from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalItem } from '@/context/EditModeContext';
import { Item } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { itemsEdit } from '@/data';

export default function ItemAttributesCard({ item }: { item: Item }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { itemName } = useLocalItem();
  const ed = editable('items');
  const itemsSnapshot = useSnapshot(itemsEdit);
  if (!item) return null;

  const rawItem = itemsEdit[itemName];
  const effectiveItem = itemsSnapshot[itemName] ?? item;

  const collisionOptions = ['角色', '道具', '墙壁', '平台', '地面'] as const;
  const activeCollision = Array.isArray(effectiveItem?.collsion) ? effectiveItem.collsion : [];

  const aliasesEditor = isEditMode ? (
    <div className='flex items-center gap-1'>
      <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
      {(effectiveItem.aliases ?? item.aliases ?? []).length > 0 ? (
        (effectiveItem.aliases ?? item.aliases ?? []).map((alias, index, arr) => (
          <span key={`${alias}-${index}`} className='inline-flex items-center'>
            <ed.span
              initialValue={alias || '<无内容>'}
              path={`aliases.${index}`}
              isSingleLine
              onSave={(newValue) => {
                if (!rawItem) return;
                if (!rawItem.aliases) rawItem.aliases = [];
                const trimmed = newValue.trim();
                if (trimmed === '') {
                  rawItem.aliases = rawItem.aliases.filter((_, i) => i !== index);
                } else {
                  rawItem.aliases[index] = trimmed;
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
          if (!rawItem) return;
          if (!rawItem.aliases) rawItem.aliases = [];
          if (!rawItem.aliases.includes('新别名')) {
            rawItem.aliases.push('新别名');
          }
        }}
        className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
      >
        <PlusIcon className='h-3 w-3' aria-hidden='true' />
      </button>
    </div>
  ) : undefined;

  return (
    <AttributesCardLayout
      imageUrl={item.imageUrl}
      alt={item.name}
      title={item.name}
      subtitle={`(道具${item.factionId === 'cat' ? '·猫' : item.factionId === 'mouse' ? '·鼠' : ''})`}
      aliases={isEditMode ? undefined : item.aliases}
      aliasesContent={aliasesEditor}
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getItemTypeColors(effectiveItem?.itemtype || '', isDarkMode)}
            >
              <ed.span
                path='itemtype'
                initialValue={effectiveItem.itemtype ?? '<无内容>'}
                isSingleLine
              />
            </Tag>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getItemSourceColors(effectiveItem?.itemsource || '', isDarkMode)}
            >
              <ed.span
                path='itemsource'
                initialValue={effectiveItem.itemsource ?? '<无内容>'}
                isSingleLine
              />
            </Tag>
          </div>
          {(isEditMode ||
            effectiveItem?.damage !== undefined ||
            effectiveItem?.walldamage !== undefined) && (
            <div
              className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
              style={{ gridTemplateColumns: `repeat(2, minmax(40px, 1fr))` }}
            >
              <span className='text-sm whitespace-pre'>
                伤害：
                <span className='text-red-600 dark:text-red-400'>
                  <ed.span
                    path='damage'
                    initialValue={effectiveItem.damage ?? '<无内容>'}
                    valueType='number'
                    isSingleLine
                  />
                </span>
              </span>
              <span className='text-sm whitespace-pre'>
                破墙伤害：
                <span className='text-yellow-700 dark:text-yellow-500'>
                  <ed.span
                    path='walldamage'
                    initialValue={effectiveItem.walldamage ?? '<无内容>'}
                    valueType='number'
                    isSingleLine
                  />
                </span>
              </span>
            </div>
          )}
          {isEditMode ? (
            <span className='text-sm whitespace-pre'>
              {'(猫)命中获得 '}
              <span className='text-indigo-700 dark:text-indigo-400'>
                <ed.span
                  path='exp'
                  initialValue={effectiveItem.exp ?? '<无内容>'}
                  valueType='number'
                  isSingleLine
                />
              </span>
              {' 经验'}
            </span>
          ) : effectiveItem?.exp != undefined ? (
            effectiveItem.exp == 0 ? (
              <span className='text-sm whitespace-pre'>(猫)命中不获得经验</span>
            ) : (
              <span className='text-sm whitespace-pre'>
                {'(猫)命中获得 '}
                <span className='text-indigo-700 dark:text-indigo-400'>{effectiveItem.exp}</span>
                {' 经验'}
              </span>
            )
          ) : null}
          {effectiveItem.itemAttributesAsCharacter !== undefined && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-sm font-bold'>
                该道具特性与<span className='text-fuchsia-600 dark:text-fuchsia-400'>角色</span>
                类似，可看作
                {effectiveItem.itemAttributesAsCharacter.factionBelong === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫阵营</span>
                ) : effectiveItem.itemAttributesAsCharacter.factionBelong === 'mouse' ? (
                  <span className='text-amber-700 dark:text-amber-600'>鼠阵营</span>
                ) : (
                  <span className='text-fuchsia-600 dark:text-fuchsia-400'>第三阵营</span>
                )}
                的
                {effectiveItem.itemAttributesAsCharacter.type === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫角色</span>
                ) : effectiveItem.itemAttributesAsCharacter.type === 'mouse' ? (
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
                  effectiveItem.itemAttributesAsCharacter.maxHp === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp上限',
                        text: effectiveItem.itemAttributesAsCharacter.maxHp,
                      },
                  effectiveItem.itemAttributesAsCharacter.hpRecovery === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp恢复',
                        text: effectiveItem.itemAttributesAsCharacter.hpRecovery,
                      },
                  effectiveItem.itemAttributesAsCharacter.moveSpeed === undefined
                    ? { title: null, text: null }
                    : {
                        title: '移速',
                        text: effectiveItem.itemAttributesAsCharacter.moveSpeed,
                      },
                  effectiveItem.itemAttributesAsCharacter.jumpHeight === undefined
                    ? { title: null, text: null }
                    : {
                        title: '跳跃',
                        text: effectiveItem.itemAttributesAsCharacter.jumpHeight,
                      },
                  effectiveItem.itemAttributesAsCharacter.attackBoost === undefined
                    ? { title: null, text: null }
                    : {
                        title: '攻击增伤',
                        text: effectiveItem.itemAttributesAsCharacter.attackBoost,
                      },
                ].map(({ title, text }) =>
                  title === null ? null : (
                    <span className='text-sm whitespace-pre' key={title}>
                      <Tooltip
                        content={getTooltipContent(
                          title,
                          effectiveItem.itemAttributesAsCharacter?.type === 'cat' ? 'cat' : 'mouse',
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
          {(isEditMode ||
            effectiveItem.move !== undefined ||
            effectiveItem.gravity !== undefined ||
            effectiveItem.collsion !== undefined) && (
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
                          checked={effectiveItem.move ?? false}
                          onChange={(e) => {
                            if (!rawItem) return;
                            rawItem.move = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(effectiveItem.move ?? false) ? '可移动' : '不可移动'}
                        </span>
                      </label>
                    </div>
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>重力:</span>
                      <label className='flex cursor-pointer items-center gap-1'>
                        <input
                          type='checkbox'
                          checked={effectiveItem.gravity ?? false}
                          onChange={(e) => {
                            if (!rawItem) return;
                            rawItem.gravity = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(effectiveItem.gravity ?? false) ? '会受重力影响' : '不受重力影响'}
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
                              if (!rawItem) return;
                              const current = Array.isArray(rawItem.collsion)
                                ? rawItem.collsion
                                : [];
                              const next = new Set(current);
                              if (e.target.checked) next.add(opt);
                              else next.delete(opt);
                              const arr = Array.from(next);
                              if (arr.length === 0) {
                                delete rawItem.collsion;
                              } else {
                                rawItem.collsion = arr;
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
                    {effectiveItem.move !== undefined && (
                      <span className='text-sm whitespace-pre'>
                        {effectiveItem.move === true ? (
                          <span className='text-green-600 dark:text-green-500'>可</span>
                        ) : (
                          <span className='text-red-600 dark:text-red-500'>不可</span>
                        )}
                        移动
                      </span>
                    )}
                    {effectiveItem.gravity !== undefined && (
                      <span className='text-sm whitespace-pre'>
                        {effectiveItem.gravity === true ? (
                          <span className='text-orange-600 dark:text-orange-400'>会受</span>
                        ) : (
                          <span className='text-indigo-700 dark:text-indigo-400'>不受</span>
                        )}
                        重力影响
                      </span>
                    )}
                    <span className='text-sm whitespace-pre'>
                      {!!effectiveItem.collsion ? (
                        <>
                          <span className='text-orange-600 dark:text-orange-400'>会</span>与
                          {effectiveItem.collsion.map((string, key, array) => {
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
          {(isEditMode || effectiveItem?.store !== undefined) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              {isEditMode ? (
                <div className='flex items-center gap-2'>
                  <span className='text-lg font-bold whitespace-pre'>局内商店：</span>
                  <label className='flex cursor-pointer items-center gap-1 text-xs'>
                    <input
                      type='checkbox'
                      checked={effectiveItem.store ?? false}
                      onChange={(e) => {
                        if (!rawItem) return;
                        rawItem.store = e.target.checked;
                      }}
                      className='h-3 w-3'
                    />
                    <span className='font-bold'>
                      {(effectiveItem.store ?? false) ? '有售' : '不售'}
                    </span>
                  </label>
                </div>
              ) : effectiveItem.store !== true ? (
                <span className='text-lg font-bold whitespace-pre text-red-600 dark:text-red-500'>
                  局内商店不售
                </span>
              ) : (
                <span className='text-lg font-bold whitespace-pre text-green-600 dark:text-green-500'>
                  局内商店有售
                </span>
              )}

              {(isEditMode ? (effectiveItem.store ?? false) : effectiveItem.store === true) && (
                <div
                  className='auto-fill-grid grid-container grid items-center justify-center gap-1 text-sm font-normal'
                  style={{
                    gridTemplateColumns: `repeat(2, minmax(80px, 1fr))`,
                    gridTemplateRows: 'repeat(2,1fr)',
                  }}
                >
                  <span className='text-sm whitespace-pre'>
                    售价：
                    <span className='text-orange-600 dark:text-orange-400'>
                      <ed.span
                        path='price'
                        initialValue={effectiveItem.price ?? '<无内容>'}
                        valueType='number'
                        isSingleLine
                      />
                    </span>
                  </span>
                  <span className='text-sm whitespace-pre'>
                    {'解锁：'}
                    <span className='text-indigo-700 dark:text-indigo-400'>
                      <ed.span
                        path='unlocktime'
                        initialValue={effectiveItem.unlocktime ?? '<无内容>'}
                        isSingleLine
                      />
                    </span>
                  </span>
                  <span className='text-sm whitespace-pre'>
                    {'购买CD：'}
                    <span className='text-indigo-700 dark:text-indigo-400'>
                      <ed.span
                        path='storeCD'
                        initialValue={effectiveItem.storeCD ?? '<无内容>'}
                        valueType='number'
                        isSingleLine
                      />
                    </span>
                    {'秒'}
                  </span>
                  {isEditMode ? (
                    <label className='flex cursor-pointer items-center gap-1 text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                      <input
                        type='checkbox'
                        checked={effectiveItem.teamCD ?? false}
                        onChange={(e) => {
                          if (!rawItem) return;
                          rawItem.teamCD = e.target.checked;
                        }}
                        className='h-3 w-3'
                      />
                      <span className='font-bold'>(鼠)团队共享CD</span>
                    </label>
                  ) : effectiveItem?.teamCD === true ? (
                    <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                      (鼠)团队共享CD
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={item.name} specifyType='item' />
        </NavigationButtonsRow>
      }
      wikiHistory={<SingleItemWikiHistoryDisplay singleItem={{ name: item.name, type: 'item' }} />}
    />
  );
}
