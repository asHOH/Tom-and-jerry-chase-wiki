'use client';

import { useSnapshot } from 'valtio';

import { getFixtureSourceColors, getFixtureTypeColors } from '@/lib/design-tokens';
import { getTooltipContent } from '@/lib/tooltipUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalFixture } from '@/context/EditModeContext';
import { Fixture } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { fixturesEdit } from '@/data';

export default function FixtureAttributesCard({ fixture }: { fixture: Fixture }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { fixtureName } = useLocalFixture();
  const ed = editable('fixtures');

  const fixturesSnapshot = useSnapshot(fixturesEdit);
  if (!fixture) return null;

  const rawFixture = fixturesEdit[fixtureName];
  const effectiveFixture = (
    isEditMode ? (fixturesSnapshot[fixtureName] ?? fixture) : fixture
  ) as Fixture;

  const collisionOptions = ['角色', '道具', '墙壁', '平台', '地面'] as const;
  const activeCollision = Array.isArray(effectiveFixture?.collsion)
    ? effectiveFixture.collsion
    : [];

  function putTypeTagOn(currentFixture: Fixture) {
    if (typeof currentFixture.type === 'string') {
      return (
        <Tag
          size='sm'
          margin='compact'
          colorStyles={getFixtureTypeColors(currentFixture.type, isDarkMode)}
        >
          {currentFixture.type}
        </Tag>
      );
    } else {
      return currentFixture.type.map((type) => {
        return (
          <Tag
            size='sm'
            margin='compact'
            colorStyles={getFixtureTypeColors(type, isDarkMode)}
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
      imageUrl={fixture.imageUrl}
      alt={fixture.name}
      title={fixture.name}
      subtitle='(地图组件)'
      aliases={isEditMode ? undefined : fixture.aliases}
      aliasesContent={
        isEditMode ? (
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-400 dark:text-gray-500'>别名：</span>
            {(effectiveFixture.aliases ?? fixture.aliases ?? []).length > 0 ? (
              (effectiveFixture.aliases ?? fixture.aliases ?? []).map((alias, index, arr) => (
                <span key={`${alias}-${index}`} className='inline-flex items-center'>
                  <ed.span
                    initialValue={alias || '<无内容>'}
                    path={`aliases.${index}`}
                    isSingleLine
                    onSave={(newValue) => {
                      if (!rawFixture) return;
                      if (!rawFixture.aliases) rawFixture.aliases = [];
                      const trimmed = newValue.trim();
                      if (trimmed === '') {
                        rawFixture.aliases = rawFixture.aliases.filter((_, i) => i !== index);
                      } else {
                        rawFixture.aliases[index] = trimmed;
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
                if (!rawFixture) return;
                if (!rawFixture.aliases) rawFixture.aliases = [];
                if (!rawFixture.aliases.includes('新别名')) {
                  rawFixture.aliases.push('新别名');
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
            {putTypeTagOn(effectiveFixture)}
            {effectiveFixture.source && (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getFixtureSourceColors(effectiveFixture.source, isDarkMode)}
              >
                <ed.span
                  path='source'
                  initialValue={effectiveFixture.source ?? '<无内容>'}
                  isSingleLine
                />
              </Tag>
            )}
          </div>
          {isEditMode && !effectiveFixture.source && (
            <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
              <span className='text-sm whitespace-pre'>来源: </span>
              <span className='text-indigo-700 dark:text-indigo-400'>
                <ed.span path='source' initialValue={'<无内容>'} isSingleLine />
              </span>
            </div>
          )}
          {effectiveFixture.fixtureAttributesAsCharacter !== undefined && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-sm font-bold'>
                该物件特性与<span className='text-fuchsia-600 dark:text-fuchsia-400'>角色</span>
                类似，可看作
                {effectiveFixture.fixtureAttributesAsCharacter.factionBelong === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫阵营</span>
                ) : effectiveFixture.fixtureAttributesAsCharacter.factionBelong === 'mouse' ? (
                  <span className='text-amber-700 dark:text-amber-600'>鼠阵营</span>
                ) : (
                  <span className='text-fuchsia-600 dark:text-fuchsia-400'>第三阵营</span>
                )}
                的
                {effectiveFixture.fixtureAttributesAsCharacter.type === 'cat' ? (
                  <span className='text-sky-600 dark:text-sky-400'>猫角色</span>
                ) : effectiveFixture.fixtureAttributesAsCharacter.type === 'mouse' ? (
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
                  effectiveFixture.fixtureAttributesAsCharacter.maxHp === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp上限',
                        text: effectiveFixture.fixtureAttributesAsCharacter.maxHp,
                      },
                  effectiveFixture.fixtureAttributesAsCharacter.hpRecovery === undefined
                    ? { title: null, text: null }
                    : {
                        title: 'Hp恢复',
                        text: effectiveFixture.fixtureAttributesAsCharacter.hpRecovery,
                      },
                  effectiveFixture.fixtureAttributesAsCharacter.moveSpeed === undefined
                    ? { title: null, text: null }
                    : {
                        title: '移速',
                        text: effectiveFixture.fixtureAttributesAsCharacter.moveSpeed,
                      },
                  effectiveFixture.fixtureAttributesAsCharacter.jumpHeight === undefined
                    ? { title: null, text: null }
                    : {
                        title: '跳跃',
                        text: effectiveFixture.fixtureAttributesAsCharacter.jumpHeight,
                      },
                  effectiveFixture.fixtureAttributesAsCharacter.attackBoost === undefined
                    ? { title: null, text: null }
                    : {
                        title: '攻击增伤',
                        text: effectiveFixture.fixtureAttributesAsCharacter.attackBoost,
                      },
                ].map(({ title, text }) =>
                  title === null ? null : (
                    <span className='text-sm whitespace-pre' key={title}>
                      <Tooltip
                        content={getTooltipContent(
                          title,
                          effectiveFixture.fixtureAttributesAsCharacter?.type === 'cat'
                            ? 'cat'
                            : 'mouse',
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
            effectiveFixture.move !== undefined ||
            effectiveFixture.gravity !== undefined ||
            effectiveFixture.collsion !== undefined) && (
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
                          checked={effectiveFixture.move ?? false}
                          onChange={(e) => {
                            if (!rawFixture) return;
                            rawFixture.move = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(effectiveFixture.move ?? false) ? '可移动' : '不可移动'}
                        </span>
                      </label>
                    </div>
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='text-xs text-gray-400 dark:text-gray-500'>重力:</span>
                      <label className='flex cursor-pointer items-center gap-1'>
                        <input
                          type='checkbox'
                          checked={effectiveFixture.gravity ?? false}
                          onChange={(e) => {
                            if (!rawFixture) return;
                            rawFixture.gravity = e.target.checked;
                          }}
                          className='h-3 w-3'
                        />
                        <span className='font-bold'>
                          {(effectiveFixture.gravity ?? false) ? '会受重力影响' : '不受重力影响'}
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
                              if (!rawFixture) return;
                              const current = Array.isArray(rawFixture.collsion)
                                ? rawFixture.collsion
                                : [];
                              const next = new Set(current);
                              if (e.target.checked) next.add(opt);
                              else next.delete(opt);
                              const arr = Array.from(next);
                              if (arr.length === 0) {
                                delete rawFixture.collsion;
                              } else {
                                rawFixture.collsion = arr;
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
                    {effectiveFixture.move !== undefined && (
                      <span className='text-sm whitespace-pre'>
                        {effectiveFixture.move === true ? (
                          <span className='text-green-600 dark:text-green-500'>可</span>
                        ) : (
                          <span className='text-red-600 dark:text-red-500'>不可</span>
                        )}
                        移动
                      </span>
                    )}
                    {effectiveFixture.gravity !== undefined && (
                      <span className='text-sm whitespace-pre'>
                        {effectiveFixture.gravity === true ? (
                          <span className='text-orange-600 dark:text-orange-400'>会受</span>
                        ) : (
                          <span className='text-indigo-700 dark:text-indigo-400'>不受</span>
                        )}
                        重力影响
                      </span>
                    )}
                    <span className='text-sm whitespace-pre'>
                      {!!effectiveFixture.collsion ? (
                        <>
                          <span className='text-orange-600 dark:text-orange-400'>会</span>与
                          {effectiveFixture.collsion.map((string, key, array) => {
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
          <SpecifyTypeNavigationButtons currentId={fixture.name} specifyType='fixture' />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay singleItem={{ name: fixture.name, type: 'fixture' }} />
      }
    />
  );
}
