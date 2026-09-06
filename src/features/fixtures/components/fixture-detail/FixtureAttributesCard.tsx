'use client';

import { getFixtureSourceColors, getFixtureTypeColors } from '@/lib/design';
import { getSingleItemPrototype, getSingleItemVariant } from '@/lib/singleItemTools';
import { useEditableDomain, useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalFixture } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { maps } from '@/data/static';
import { Fixture, FixtureSourceList, FixtureTypeList } from '@/data/types';
import ActorAttributesSection from '@/features/actor-profiles/components/ActorAttributesSection';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import ActorProfileSelect from '@/features/shared/detail-view/ActorProfileSelect';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import CharacterLikeAttributesSection from '@/features/shared/detail-view/CharacterLikeAttributesSection';
import EditableCheckboxGroup from '@/features/shared/detail-view/EditableCheckboxGroup';
import EditableStringList from '@/features/shared/detail-view/EditableStringList';
import PhysicalAttributesSection from '@/features/shared/detail-view/PhysicalAttributesSection';
import { editable } from '@/components/ui/editable';
import { FormSelect } from '@/components/ui/FormControls';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

const FIXTURE_TYPES: readonly FixtureTypeList[] = [
  '平台类',
  '地面类',
  '墙壁类',
  '组件类',
  '流程类',
  'NPC',
  '可交互',
];
const FIXTURE_SOURCES: readonly FixtureSourceList[] = ['通用组件', '地图组件', '模式组件'];

const toFixtureTypeArray = (type: Fixture['type']): FixtureTypeList[] =>
  typeof type === 'string' ? [type] : [...type];

export default function FixtureAttributesCard({ fixture }: { fixture: Fixture }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { fixtureName } = useLocalFixture();
  const ed = editable('fixtures');

  const [effectiveFixture, updateFixture] = useEditableEntity(
    { entityType: 'fixtures', entityId: fixtureName },
    fixture
  ) as unknown as readonly [Fixture, (mutate: (value: Fixture) => void) => void];
  const [mapsSnapshot] = useEditableDomain('maps', maps);

  /* 计算variant相关内容 */
  const prototype = getSingleItemPrototype({ name: fixture.name, type: 'fixture' });
  const variant = getSingleItemVariant({ name: fixture.name, type: 'fixture' });
  /* -------- */

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
                      updateFixture((draft) => {
                        if (!draft.aliases) draft.aliases = [];
                        const trimmed = newValue.trim();
                        if (trimmed === '') {
                          draft.aliases = draft.aliases.filter((_, i) => i !== index);
                        } else {
                          draft.aliases[index] = trimmed;
                        }
                      });
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
                updateFixture((draft) => {
                  if (!draft.aliases) draft.aliases = [];
                  if (!draft.aliases.includes('新别名')) draft.aliases.push('新别名');
                });
              }}
            />
          </div>
        ) : undefined
      }
      attributes={
        <>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>类型: </span>
            {isEditMode ? (
              <EditableCheckboxGroup
                actionPath={`${fixtureName}.type`}
                options={FIXTURE_TYPES}
                selected={toFixtureTypeArray(effectiveFixture.type)}
                minimumSelections={1}
                ariaLabelPrefix='地图组件类型'
                onChange={(types) => {
                  if (types.length === 0) return;
                  updateFixture((draft) => {
                    draft.type = types.length === 1 ? types[0]! : types;
                  });
                }}
              />
            ) : (
              putTypeTagOn(effectiveFixture)
            )}
            {isEditMode ? (
              <FormSelect
                size='sm'
                fullWidth={false}
                value={effectiveFixture.source}
                aria-label='地图组件来源'
                onChange={(event) => {
                  updateFixture((draft) => {
                    draft.source = event.target.value as FixtureSourceList;
                  });
                }}
              >
                {FIXTURE_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </FormSelect>
            ) : effectiveFixture.source ? (
              <Tag
                size='sm'
                margin='compact'
                colorStyles={getFixtureSourceColors(effectiveFixture.source, isDarkMode)}
              >
                {effectiveFixture.source}
              </Tag>
            ) : null}
          </div>
          {isEditMode ? (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>支持地图</span>
              <EditableStringList
                actionPath={`${fixtureName}.supportedMaps`}
                values={effectiveFixture.supportedMaps ?? []}
                options={Object.keys(mapsSnapshot)}
                itemLabel='支持地图'
                onChange={(supportedMaps) => {
                  updateFixture((draft) => {
                    if (supportedMaps.length > 0) draft.supportedMaps = supportedMaps;
                    else delete draft.supportedMaps;
                  });
                }}
              />
            </div>
          ) : null}
          {isEditMode ? (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <ActorProfileSelect
                value={effectiveFixture.actorProfileName}
                onChange={(profileName) => {
                  updateFixture((draft) => {
                    if (profileName) {
                      draft.actorProfileName = profileName;
                      delete draft.fixtureAttributesAsCharacter;
                    } else delete draft.actorProfileName;
                  });
                }}
              />
            </div>
          ) : null}
          <CharacterLikeAttributesSection
            attributes={effectiveFixture.fixtureAttributesAsCharacter}
            intro='该物件特性与'
            isDetailed={isDetailed}
            isEditMode={isEditMode}
            onChange={(attributes) => {
              updateFixture((draft) => {
                if (attributes) {
                  draft.fixtureAttributesAsCharacter = attributes;
                  delete draft.actorProfileName;
                } else delete draft.fixtureAttributesAsCharacter;
              });
            }}
          />
          {effectiveFixture.actorProfileName !== undefined ? (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-sm font-bold'>该物件属于特殊角色，具有以下属性：</span>
              <ActorAttributesSection name={effectiveFixture.actorProfileName} context='object' />
            </div>
          ) : null}
          <PhysicalAttributesSection
            attributes={effectiveFixture}
            isEditMode={isEditMode}
            onChange={(mutate) => updateFixture(mutate)}
          />
          {(prototype.length > 0 || variant.length > 0) && (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              {prototype.length > 0 && (
                <div>
                  <span className='text-lg font-bold whitespace-pre'>本内容为以下内容的变种：</span>
                  <div className='mt-1'>
                    <SingleItemAccordionCard items={prototype} />
                  </div>
                </div>
              )}
              {variant.length > 0 && (
                <div className={prototype.length > 0 ? 'mt-2' : ''}>
                  <span className='text-lg font-bold whitespace-pre'>本内容有以下变种：</span>
                  <div className='mt-1'>
                    <SingleItemAccordionCard items={variant} />
                  </div>
                </div>
              )}
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
