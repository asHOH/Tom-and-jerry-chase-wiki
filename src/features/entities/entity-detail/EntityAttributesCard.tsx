'use client';

import { useSnapshot } from 'valtio';

import { getEntityTypeColors } from '@/lib/design';
import { getSingleItemPrototype, getSingleItemVariant } from '@/lib/singleItemTools';
import { useLocalEntity } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Entity } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import AttributesCardLayout from '@/features/shared/detail-view/AttributesCardLayout';
import CharacterLikeAttributesSection from '@/features/shared/detail-view/CharacterLikeAttributesSection';
import PhysicalAttributesSection from '@/features/shared/detail-view/PhysicalAttributesSection';
import { editable } from '@/components/ui/editable';
import NavigationButtonsRow from '@/components/ui/NavigationButtonsRow';
import SingleItemAccordionCard from '@/components/ui/SingleItemAccordionCard';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';
import Tag from '@/components/ui/Tag';
import { entitiesEdit } from '@/data';

import getEntityFactionId from '../lib/getEntityFactionId';

export default function EntityAttributesCard({ entity }: { entity: Entity }) {
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { isEditMode } = useEditMode();
  const { entityName } = useLocalEntity();
  const ed = editable('entities');

  const entitiesSnapshot = useSnapshot(entitiesEdit);
  if (!entity) return null;

  const rawEntity = entitiesEdit[entityName];
  const effectiveEntity = (
    isEditMode ? (entitiesSnapshot[entityName] ?? entity) : entity
  ) as Entity;

  /* 计算variant相关内容 */
  const prototype = getSingleItemPrototype({ name: entity.name, type: 'entity' });
  const variant = getSingleItemVariant({ name: entity.name, type: 'entity' });
  /* -------- */

  const factionId = getEntityFactionId(entity);

  function putTypeTagOn(currentEntity: Entity, mode: 'type' | 'tag' = 'type') {
    const tags = mode === 'tag' ? currentEntity.entitytag : currentEntity.entitytype;
    if (typeof tags === 'string') {
      return (
        <Tag size='sm' margin='compact' colorStyles={getEntityTypeColors(tags, isDarkMode)}>
          <ed.span path='entitytype' initialValue={tags ?? '<无内容>'} isSingleLine />
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
            {putTypeTagOn(effectiveEntity, 'type')}
          </div>
          <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
            <span className='text-sm whitespace-pre'>标签: </span>
            {putTypeTagOn(effectiveEntity, 'tag')}
          </div>
          {effectiveEntity.owner && (
            <div className='flex items-center gap-2 text-sm'>
              <SingleItemAccordionCard items={effectiveEntity.owner} title='归属者：' />
            </div>
          )}
          <CharacterLikeAttributesSection
            attributes={effectiveEntity.entityAttributesAsCharacter}
            intro='该衍生物特性与'
            isDetailed={isDetailed}
            renderValue={(field, value) => (
              <ed.span
                path={`entityAttributesAsCharacter.${field}`}
                initialValue={value}
                valueType='number'
                isSingleLine
              />
            )}
          />
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
