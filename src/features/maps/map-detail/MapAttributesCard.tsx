'use client';

import { getMapLevelColors, getMapSizeColors, getMapTypeColors } from '@/lib/design';
import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalMap } from '@/hooks/useLocalEditEntity';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Map, MapSize, mapTypes, SingleItem, studyLevel } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import { FormSelect } from '@/components/ui/FormControls';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

const MAP_TYPES: readonly mapTypes[] = ['常规地图', '娱乐地图', '广场地图'];
const MAP_SIZES: readonly MapSize[] = ['微型', '小型', '中型', '大型'];
const STUDY_LEVELS: readonly studyLevel[] = ['见习学业', '高级学业', '特级学业', '大师学业'];

export default function MapAttributesCard({
  map,
  modeNames,
}: {
  map: Map;
  modeNames: readonly string[];
}) {
  const [isDarkMode] = useDarkMode();
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { mapName } = useLocalMap();
  const ed = editable('maps');

  const editRuntime = useDraftDataRuntime();
  const rawMap = editRuntime?.stores.maps[mapName];
  const mapSnapshot = useOptionalEditSnapshot(rawMap, map);
  const editModes = useOptionalEditSnapshot<PublishedGameDataByType['modes']>(
    editRuntime?.stores.modes,
    {}
  );
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveMap = usesDraftData && rawMap ? (mapSnapshot as Map) : map;
  const availableModeOptions = editRuntime ? Object.keys(editModes) : modeNames;
  const activeSupportedModes = Array.isArray(effectiveMap?.supportedModes)
    ? effectiveMap.supportedModes
    : [];

  return (
    <AttributesCardLayout
      imageUrl={map.imageUrl}
      alt={map.name}
      title={map.name}
      subtitle='(地图)'
      aliases={isEditMode ? undefined : map.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(effectiveMap.aliases ?? map.aliases ?? []).length > 0 ? (
              (effectiveMap.aliases ?? map.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawMap) return;
                      if (!rawMap.aliases) rawMap.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawMap.aliases = rawMap.aliases.filter((_, i) => i !== index);
                      } else {
                        rawMap.aliases[index] = trimmed;
                      }
                    }}
                  />
                  {index < arr.length - 1 && <span className='text-gray-400'>、</span>}
                </span>
              ))
            ) : (
              <span>{'<无内容>'}</span>
            )}
            <AddAliasButton
              onAdd={() => {
                if (!rawMap) return;
                if (!rawMap.aliases) rawMap.aliases = [];
                if (!rawMap.aliases.includes('新别名')) {
                  rawMap.aliases.push('新别名');
                }
              }}
            />
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型：</span>
            <Tag
              size='sm'
              margin='compact'
              colorStyles={getMapTypeColors(effectiveMap.type, isDarkMode)}
            >
              {isEditMode ? (
                <select
                  aria-label='地图类型'
                  value={effectiveMap.type}
                  onChange={(event) => {
                    if (rawMap) rawMap.type = event.target.value as mapTypes;
                  }}
                  className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
                >
                  {MAP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                effectiveMap.type
              )}
            </Tag>
            {!isEditMode && effectiveMap.size && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getMapSizeColors(effectiveMap.size, isDarkMode)}
              >
                {effectiveMap.size}
              </Tag>
            )}
            {!isEditMode && effectiveMap.studyLevelUnlock && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getMapLevelColors(effectiveMap.studyLevelUnlock, isDarkMode)}
              >
                {effectiveMap.studyLevelUnlock}
              </Tag>
            )}
          </div>

          {isEditMode && (
            <div className='grid gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>
                规模：
                <span className='text-indigo-700 dark:text-indigo-400'>
                  <FormSelect
                    size='sm'
                    fullWidth={false}
                    value={effectiveMap.size ?? ''}
                    aria-label='地图规模'
                    onChange={(event) => {
                      if (!rawMap) return;
                      const size = event.target.value;
                      if (size) rawMap.size = size as MapSize;
                      else delete rawMap.size;
                    }}
                  >
                    <option value=''>未设置</option>
                    {MAP_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </FormSelect>
                </span>
              </span>
              <span className='text-sm whitespace-pre'>
                学业等级：
                <span className='text-indigo-700 dark:text-indigo-400'>
                  <FormSelect
                    size='sm'
                    fullWidth={false}
                    value={effectiveMap.studyLevelUnlock ?? ''}
                    aria-label='地图解锁学业等级'
                    onChange={(event) => {
                      if (!rawMap) return;
                      const level = event.target.value;
                      if (level) rawMap.studyLevelUnlock = level as studyLevel;
                      else delete rawMap.studyLevelUnlock;
                    }}
                  >
                    <option value=''>未设置</option>
                    {STUDY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </FormSelect>
                </span>
              </span>
            </div>
          )}

          <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
            <span className='text-lg font-bold whitespace-pre'>地图信息</span>
            <div className='auto-fill-grid grid-container mt-1 grid grid-cols-[repeat(2,minmax(80px,1fr))] items-center justify-center gap-1 text-sm font-normal'>
              {(isEditMode || map.roomCount !== undefined) && (
                <span className='text-sm whitespace-pre'>
                  <Tooltip
                    content={
                      '地图中的房间数。只计入主房间，不计彩蛋房、过渡房间。房间目前根据鼠害怕表情、侍卫警戒、传送点的不同，出现了三种不同的定义分歧，目前正在讨论具体分类方法，因此本数据仅供参考'
                    }
                  >
                    房间数
                  </Tooltip>
                  ：
                  <span className='text-indigo-700 dark:text-indigo-400'>
                    <ed.span
                      path='roomCount'
                      initialValue={effectiveMap.roomCount ?? '<无内容>'}
                      valueType='number'
                      deleteOnEmpty
                      isSingleLine
                    />
                  </span>
                </span>
              )}
              {(isEditMode || map.pipeCount !== undefined) && (
                <span className='text-sm whitespace-pre'>
                  <Tooltip
                    content={
                      '地图中的管道组数。只计入常规管道，不计彩蛋房管道，且双向管道只计一个。对于管道较多的地图，可考虑携带知识卡-猫是液体'
                    }
                  >
                    管道数
                  </Tooltip>
                  ：
                  <span className='text-indigo-700 dark:text-indigo-400'>
                    <ed.span
                      path='pipeCount'
                      initialValue={effectiveMap.pipeCount ?? '<无内容>'}
                      valueType='number'
                      deleteOnEmpty
                      isSingleLine
                    />
                  </span>
                </span>
              )}
              {(isEditMode || (map.doorCount !== undefined && map.doorCount > 0)) && (
                <span className='text-sm whitespace-pre'>
                  <Tooltip
                    content={
                      '地图中的木门数。只计入传统木门，不计自动门等特殊门。对于木门较多的地图，可考虑携带知识卡-闭门羹'
                    }
                  >
                    木门数
                  </Tooltip>
                  ：
                  <span className='text-indigo-700 dark:text-indigo-400'>
                    <ed.span
                      path='doorCount'
                      initialValue={effectiveMap.doorCount ?? '<无内容>'}
                      valueType='number'
                      deleteOnEmpty
                      isSingleLine
                    />
                  </span>
                </span>
              )}
            </div>
            <div className='auto-fill-grid grid-container mt-1 grid grid-cols-[repeat(1,minmax(80px,1fr))] items-center justify-center gap-1 text-sm font-normal'>
              {(isEditMode || (map.hiddenRoomCount !== undefined && map.hiddenRoomCount > 0)) && (
                <span className='text-sm whitespace-pre'>
                  该地图有
                  <span className='text-red-600 dark:text-red-500'>
                    {' '}
                    <ed.span
                      path='hiddenRoomCount'
                      initialValue={effectiveMap.hiddenRoomCount ?? '<无内容>'}
                      valueType='number'
                      deleteOnEmpty
                      isSingleLine
                    />{' '}
                  </span>
                  个被隐藏的彩蛋区域
                </span>
              )}
              {isEditMode ? (
                <div className='flex flex-col gap-1'>
                  <label className='flex cursor-pointer items-center gap-1 text-xs'>
                    <input
                      type='checkbox'
                      checked={effectiveMap.randomizedRoom ?? false}
                      onChange={(e) => {
                        if (!rawMap) return;
                        rawMap.randomizedRoom = e.target.checked;
                      }}
                      className='h-3 w-3'
                    />
                    <span className='font-bold text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形会随机发生变化
                    </span>
                  </label>
                  <label className='flex cursor-pointer items-center gap-1 text-xs'>
                    <input
                      type='checkbox'
                      checked={effectiveMap.changeWithStudyLevel ?? false}
                      onChange={(e) => {
                        if (!rawMap) return;
                        rawMap.changeWithStudyLevel = e.target.checked;
                      }}
                      className='h-3 w-3'
                    />
                    <span className='font-bold text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形会随学业等级提升而变化
                    </span>
                  </label>
                  <label className='flex cursor-pointer items-center gap-1 text-xs'>
                    <input
                      type='checkbox'
                      checked={effectiveMap.changeWithMode ?? false}
                      onChange={(e) => {
                        if (!rawMap) return;
                        rawMap.changeWithMode = e.target.checked;
                      }}
                      className='h-3 w-3'
                    />
                    <span className='font-bold text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形在部分模式中会发生变化
                    </span>
                  </label>
                </div>
              ) : (
                <>
                  {effectiveMap.randomizedRoom === true && (
                    <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形会随机发生变化
                    </span>
                  )}
                  {effectiveMap.changeWithStudyLevel === true && (
                    <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形会随学业等级提升而变化
                    </span>
                  )}
                  {effectiveMap.changeWithMode === true && (
                    <span className='text-sm whitespace-pre text-fuchsia-600 dark:text-fuchsia-400'>
                      该地图的部分地形在部分模式中会发生变化
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {(isEditMode || (map.supportedModes && map.supportedModes.length > 0)) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>支持模式</span>
              {isEditMode ? (
                <div className='mt-1 flex flex-wrap gap-2 text-xs'>
                  {availableModeOptions.map((opt) => (
                    <label key={opt} className='flex cursor-pointer items-center gap-1'>
                      <input
                        type='checkbox'
                        checked={activeSupportedModes.includes(opt)}
                        onChange={(e) => {
                          if (!rawMap) return;
                          const current = Array.isArray(rawMap.supportedModes)
                            ? rawMap.supportedModes
                            : [];
                          const next = new Set(current);
                          if (e.target.checked) next.add(opt);
                          else next.delete(opt);
                          const arr = Array.from(next);
                          if (arr.length === 0) {
                            delete rawMap.supportedModes;
                          } else {
                            rawMap.supportedModes = arr;
                          }
                        }}
                        className='h-3 w-3'
                      />
                      <span className='font-bold'>{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className='mt-1'>
                  <SingleItemAccordionCard
                    items={(effectiveMap.supportedModes ?? []).map((str) => {
                      return { name: str, type: 'mode' } as SingleItem;
                    })}
                  />
                </div>
              )}
            </div>
          )}

          {(isEditMode || (effectiveMap.mapSkin && effectiveMap.mapSkin.length > 0)) && (
            <div className='border-t border-gray-300 py-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>地图换肤</span>
              <div className='mt-1 flex flex-col gap-2'>
                {(effectiveMap.mapSkin ?? []).map((singleMapSkin, index) => {
                  return (
                    <div
                      key={index}
                      className='rounded-lg border border-indigo-200 bg-linear-to-r from-indigo-50 to-indigo-100 p-2 dark:border-indigo-800 dark:from-indigo-900 dark:to-indigo-950'
                    >
                      <div className='flex items-center gap-2'>
                        <div className='shrink-0'>
                          <Image
                            src={singleMapSkin.imageUrl}
                            alt={`${singleMapSkin.name}图标`}
                            className='h-16 w-16 object-contain py-0.5'
                            width={90}
                            height={90}
                            priority={index === 0}
                          />
                        </div>
                        <div className='flex flex-col'>
                          <span className='text-base font-bold dark:text-white'>
                            <ed.span
                              path={`mapSkin.${index}.name`}
                              initialValue={singleMapSkin.name}
                              isSingleLine
                            />
                          </span>
                          <span className='mt-1 text-xs wrap-break-word whitespace-pre-wrap text-gray-500 dark:text-gray-300'>
                            <ed.span
                              path={`mapSkin.${index}.description`}
                              initialValue={singleMapSkin.description}
                            />
                          </span>
                          {isEditMode ? (
                            <span className='mt-1 text-xs text-gray-500 dark:text-gray-300'>
                              图片:{' '}
                              <ed.span
                                path={`mapSkin.${index}.imageUrl`}
                                initialValue={singleMapSkin.imageUrl}
                                isSingleLine
                              />
                            </span>
                          ) : null}
                        </div>
                        {isEditMode ? (
                          <IconButton
                            type='button'
                            aria-label={`删除地图换肤${index + 1}`}
                            variant='delete'
                            size='sm'
                            className='ml-auto'
                            onClick={() => {
                              if (!rawMap?.mapSkin) return;
                              const next = rawMap.mapSkin.filter(
                                (_, skinIndex) => skinIndex !== index
                              );
                              if (next.length > 0) rawMap.mapSkin = next;
                              else delete rawMap.mapSkin;
                            }}
                          >
                            <TrashIcon
                              className={getIconButtonIconClassName('sm')}
                              aria-hidden='true'
                            />
                          </IconButton>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {isEditMode ? (
                  <IconButton
                    type='button'
                    aria-label='添加地图换肤'
                    variant='add'
                    size='sm'
                    onClick={() => {
                      if (!rawMap) return;
                      if (!rawMap.mapSkin) rawMap.mapSkin = [];
                      rawMap.mapSkin.push({
                        name: '新换肤',
                        imageUrl: effectiveMap.imageUrl,
                        description: '请填写换肤介绍',
                      });
                    }}
                  >
                    <PlusIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
                  </IconButton>
                ) : null}
              </div>
            </div>
          )}
        </>
      }
      navigation={
        <NavigationButtonsRow>
          <SpecifyTypeNavigationButtons currentId={map.name} specifyType='map' />
        </NavigationButtonsRow>
      }
      wikiHistory={<SingleItemWikiHistoryDisplay singleItem={{ name: map.name, type: 'map' }} />}
    />
  );
}
