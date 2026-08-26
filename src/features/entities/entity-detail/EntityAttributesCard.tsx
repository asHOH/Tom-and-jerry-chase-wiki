'use client';

import { getEntityTypeColors } from '@/lib/design';
import { useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { getSingleItemPrototype, getSingleItemVariant } from '@/lib/singleItemTools';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalEntity } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Entity, Entitytaglist, Entitytypelist, SingleItem } from '@/data/types';
import ActorAttributesSection from '@/features/actor-profiles/components/ActorAttributesSection';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import ActorProfileSelect from '@/features/shared/detail-view/ActorProfileSelect';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import CharacterLikeAttributesSection from '@/features/shared/detail-view/CharacterLikeAttributesSection';
import EditableCheckboxGroup from '@/features/shared/detail-view/EditableCheckboxGroup';
import PhysicalAttributesSection from '@/features/shared/detail-view/PhysicalAttributesSection';
import SingleItemListEditor from '@/features/shared/detail-view/SingleItemListEditor';
import { editable } from '@/components/ui/editable';
import { FormSelect } from '@/components/ui/FormControls';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';

import getEntityFactionId from '../lib/getEntityFactionId';

const ENTITY_TYPES: readonly Entitytypelist[] = [
  '投射类',
  '触发类',
  '物件类',
  'NPC',
  '变身类',
  '特殊类',
];
const ENTITY_TAGS: readonly Entitytaglist[] = [
  '抛掷',
  '平射',
  '命中',
  '触发',
  '延时',
  '功能',
  '阻挡',
  '指示',
  'NPC',
  '变形',
  '变身',
  '彩蛋',
  '星元',
  '特殊',
  '拾取',
  '交互',
  '伤害',
  '硬控',
  '增益',
  '群体',
  '复用',
  '巡逻',
  '追踪',
  '遥控',
  '衍生',
];
const ENTITY_TYPE_BY_TAG: Partial<Record<Entitytaglist, Entitytypelist>> = {
  抛掷: '投射类',
  平射: '投射类',
  追踪: '投射类',
  触发: '触发类',
  延时: '触发类',
  功能: '物件类',
  阻挡: '物件类',
  指示: '物件类',
  NPC: 'NPC',
  变形: '变身类',
  变身: '变身类',
};

const toArray = <Value extends string>(value: Value | readonly Value[]): Value[] =>
  typeof value === 'string' ? [value] : [...value];

const collapseValues = <Value extends string>(values: Value[]): Value | Value[] =>
  values.length === 1 ? values[0]! : values;

const deriveEntityTypes = (tags: readonly Entitytaglist[]): Entitytypelist[] => {
  const types = new Set<Entitytypelist>();
  tags.forEach((tag) => {
    const type = ENTITY_TYPE_BY_TAG[tag];
    if (type) types.add(type);
  });
  return types.size > 0 ? Array.from(types) : ['特殊类'];
};

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode, isEditModeRequested, runtimeStatus } = useEditMode();
  const { entityName } = useLocalEntity();
  const ed = editable('entities');

  const editRuntime = useDraftDataRuntime();
  const rawEntity = editRuntime?.stores.entities[entityName];
  const entitySnapshot = useOptionalEditSnapshot(rawEntity, entity);
  const usesDraftData = isEditModeRequested && runtimeStatus === 'ready';
  const effectiveEntity = (usesDraftData && rawEntity ? entitySnapshot : entity) as Entity;

  /* 计算variant相关内容 */
  const prototype = getSingleItemPrototype({ name: entity.name, type: 'entity' });
  const variant = getSingleItemVariant({ name: entity.name, type: 'entity' });
  /* -------- */

  const factionId = getEntityFactionId(effectiveEntity);
  const ownerItems: readonly Readonly<SingleItem>[] = effectiveEntity.owner
    ? Array.isArray(effectiveEntity.owner)
      ? effectiveEntity.owner
      : [effectiveEntity.owner]
    : [];

  function putTypeTagOn(currentEntity: Entity, mode: 'type' | 'tag' = 'type') {
    const tags = mode === 'tag' ? currentEntity.entitytag : currentEntity.entitytype;
    if (typeof tags === 'string') {
      return (
        <Tag size='sm' margin='compact' colorStyles={getEntityTypeColors(tags, isDarkMode)}>
          {tags}
        </Tag>
      );
    } else {
      return tags.map((type) => {
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
            {(effectiveEntity.aliases ?? entity.aliases ?? []).length > 0 ? (
              (effectiveEntity.aliases ?? entity.aliases ?? []).map((alias, index, arr) => (
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
            <AddAliasButton
              onAdd={() => {
                if (!rawEntity) return;
                if (!rawEntity.aliases) rawEntity.aliases = [];
                if (!rawEntity.aliases.includes('新别名')) {
                  rawEntity.aliases.push('新别名');
                }
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
                actionPath={`${entityName}.entitytype`}
                options={ENTITY_TYPES}
                selected={toArray(effectiveEntity.entitytype)}
                minimumSelections={1}
                ariaLabelPrefix='衍生物类型'
                onChange={(types) => {
                  if (rawEntity && types.length > 0) rawEntity.entitytype = collapseValues(types);
                }}
              />
            ) : (
              putTypeTagOn(effectiveEntity, 'type')
            )}
          </div>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>标签: </span>
            {isEditMode ? (
              <EditableCheckboxGroup
                actionPath={`${entityName}.entitytag`}
                options={ENTITY_TAGS}
                selected={toArray(effectiveEntity.entitytag)}
                minimumSelections={1}
                ariaLabelPrefix='衍生物标签'
                onChange={(tags) => {
                  if (!rawEntity || tags.length === 0) return;
                  rawEntity.entitytag = collapseValues(tags);
                  rawEntity.entitytype = collapseValues(deriveEntityTypes(tags));
                }}
              />
            ) : (
              putTypeTagOn(effectiveEntity, 'tag')
            )}
          </div>
          {isEditMode ? (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-lg font-bold whitespace-pre'>归属者</span>
              <SingleItemListEditor
                actionPath={`${entityName}.owner`}
                items={ownerItems}
                itemLabel='归属者'
                onChange={(items) => {
                  if (!rawEntity) return;
                  if (items.length === 0) delete rawEntity.owner;
                  else rawEntity.owner = items.length === 1 ? items[0]! : items;
                }}
              />
            </div>
          ) : effectiveEntity.owner ? (
            <div className='flex items-center gap-2 text-sm'>
              <SingleItemAccordionCard items={effectiveEntity.owner} title='归属者：' />
            </div>
          ) : null}
          {isEditMode ? (
            <div className='grid gap-2 border-t border-gray-300 pt-1 dark:border-gray-600'>
              <label className='flex items-center gap-2 text-sm'>
                <span className='shrink-0'>阵营:</span>
                <FormSelect
                  size='sm'
                  value={effectiveEntity.factionId ?? ''}
                  aria-label='衍生物阵营'
                  onChange={(event) => {
                    if (!rawEntity) return;
                    const faction = event.target.value;
                    if (faction === 'cat' || faction === 'mouse') rawEntity.factionId = faction;
                    else delete rawEntity.factionId;
                  }}
                >
                  <option value=''>继承归属者</option>
                  <option value='cat'>猫</option>
                  <option value='mouse'>鼠</option>
                </FormSelect>
              </label>
              <ActorProfileSelect
                value={effectiveEntity.actorProfileName}
                onChange={(profileName) => {
                  if (!rawEntity) return;
                  if (profileName) {
                    rawEntity.actorProfileName = profileName;
                    delete rawEntity.entityAttributesAsCharacter;
                  } else delete rawEntity.actorProfileName;
                }}
              />
            </div>
          ) : null}
          <CharacterLikeAttributesSection
            attributes={effectiveEntity.entityAttributesAsCharacter}
            intro='该衍生物特性与'
            isDetailed={isDetailed}
            isEditMode={isEditMode}
            onChange={(attributes) => {
              if (!rawEntity) return;
              if (attributes) {
                rawEntity.entityAttributesAsCharacter = attributes;
                delete rawEntity.actorProfileName;
              } else delete rawEntity.entityAttributesAsCharacter;
            }}
          />
          {effectiveEntity.actorProfileName !== undefined ? (
            <div className='border-t border-gray-300 pt-1 dark:border-gray-600'>
              <span className='text-sm font-bold'>该物件属于特殊角色，具有以下属性：</span>
              <ActorAttributesSection name={effectiveEntity.actorProfileName} context='object' />
            </div>
          ) : null}
          <PhysicalAttributesSection
            attributes={effectiveEntity}
            draftAttributes={rawEntity}
            isEditMode={isEditMode}
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
          <SpecifyTypeNavigationButtons currentId={entity.name} specifyType='entity' />
        </NavigationButtonsRow>
      }
      wikiHistory={
        <SingleItemWikiHistoryDisplay singleItem={{ name: entity.name, type: 'entity' }} />
      }
    />
  );
}
