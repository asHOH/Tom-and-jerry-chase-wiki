'use client';

import React, { Fragment } from 'react';
import uniq from 'lodash-es/uniq';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type { CharacterWithFaction } from '@/lib/types';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import type { Skill, SkillLevel, SkillUsageProperties } from '@/data/types';
import {
  addSkillPart,
  convertSkillToParts,
  getSkillUsageParts,
  getSkillUsageSections,
  hasSkillParts,
  removeSkillPart,
} from '@/features/characters/utils/skillUsage';
import TextWithItemKeyTooltips from '@/features/shared/components/TextWithItemKeyTooltips';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import Button from '@/components/ui/Button';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

import SkillUsagePropertiesEditor from './SkillUsagePropertiesEditor';

const e = editable('characters');

type SkillCardPropertiesProps = {
  skill: DeepReadonly<Skill>;
  characterId: string;
  skillIndex: number;
  localCharacter: CharacterWithFaction;
  isEditMode: boolean;
  isDetailed: boolean;
  isMobileEditMode?: boolean;
};

function InlinePropertyList({ properties }: { properties: React.ReactNode[] }) {
  return properties.map((property, index) => (
    <React.Fragment key={index}>
      {index > 0 && ' · '}
      {property}
    </React.Fragment>
  ));
}

function PropertyContainer({
  children,
  isMobileEditMode,
}: {
  children: React.ReactNode;
  isMobileEditMode: boolean;
}) {
  return (
    <div
      className={cn(
        'mt-1 px-2 text-sm text-gray-500 dark:text-gray-400',
        isMobileEditMode && 'divide-y divide-dashed divide-gray-300'
      )}
    >
      {children}
    </div>
  );
}

function AddPartButton({ skillRef }: { skillRef: Skill }) {
  const isMultiPart = 'parts' in skillRef;
  return (
    <Button
      variant='unstyled'
      type='button'
      onClick={() => (isMultiPart ? addSkillPart(skillRef) : convertSkillToParts(skillRef))}
      className='mt-2 inline-flex items-center gap-1 rounded border border-dashed border-blue-400 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30'
    >
      <PlusIcon className='h-3 w-3' aria-hidden='true' />
      {isMultiPart ? '添加技能段' : '转换为多段技能'}
    </Button>
  );
}

export default function SkillCardProperties({
  skill,
  characterId,
  skillIndex,
  localCharacter,
  isEditMode,
  isDetailed,
  isMobileEditMode = false,
}: SkillCardPropertiesProps) {
  const editRuntime = useDraftDataRuntime();
  const skillRef =
    editRuntime?.stores.characters[characterId]?.skills[skillIndex] ??
    localCharacter.skills[skillIndex]!;

  const getCooldownProperty = (): React.ReactNode => {
    if (!skill.skillLevels.some((level: SkillLevel) => level.cooldown)) return null;

    const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
    const uniqueCooldowns = uniq(cooldowns);
    if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-' && !isEditMode) {
      return `CD: ${uniqueCooldowns[0]} 秒`;
    }

    return (
      <>
        CD:{' '}
        {cooldowns.map((cooldown, index) => (
          <React.Fragment key={index}>
            {index !== 0 && '/'}
            <e.span
              path={`skills.${skillIndex}.skillLevels.${index}.cooldown`}
              initialValue={cooldown}
              isSingleLine={true}
            />
          </React.Fragment>
        ))}{' '}
        秒
      </>
    );
  };

  const getChargesProperty = (): React.ReactNode => {
    if (skill.type === 'passive') return null;
    const charges = skill.skillLevels.map((level: SkillLevel) => level.charges || 1);
    const uniqueCharges = uniq(charges);
    if (uniqueCharges.length === 1 && !isEditMode) {
      if (uniqueCharges[0] === 1) return null;
      return `技能存储次数: ${uniqueCharges[0]}`;
    }

    return (
      <>
        技能存储次数:{' '}
        {charges.map((charge, index) => (
          <React.Fragment key={index}>
            {index !== 0 && '/'}
            <e.span
              path={`skills.${skillIndex}.skillLevels.${index}.charges`}
              initialValue={charge}
              isSingleLine={true}
            />
          </React.Fragment>
        ))}
      </>
    );
  };

  const commonProperties = [getCooldownProperty(), getChargesProperty()].filter(
    (property): property is React.ReactNode => property !== null
  );

  if (isEditMode && skill.type !== 'passive') {
    commonProperties.push(
      <div key='aliases' className='flex text-xs text-gray-400 dark:text-gray-500'>
        别名：
        {skill.aliases?.map((alias, index) => (
          <Fragment key={`${alias}-${index}`}>
            <e.span
              initialValue={alias}
              path={`skills.${skillIndex}.aliases.${index}`}
              isSingleLine={true}
              onSave={(newValue) => {
                const trimmed = newValue.trim();
                if (trimmed === '') {
                  skillRef.aliases = skillRef.aliases!.filter(
                    (_, aliasIndex) => aliasIndex !== index
                  );
                } else {
                  skillRef.aliases![index] = trimmed;
                }
              }}
            />
            {index < skill.aliases!.length - 1 && <span>、</span>}
          </Fragment>
        ))}
        <AddAliasButton
          onAdd={() => {
            skillRef.aliases ??= [];
            if (!skillRef.aliases.includes('新别名')) skillRef.aliases.push('新别名');
          }}
        />
      </div>
    );
  }

  if (!isEditMode) {
    const sections = getSkillUsageSections(skill);
    const usageNodes = sections.flatMap((section, sectionIndex) => {
      const propertyNodes = section.properties.map((text) => (
        <TextWithItemKeyTooltips
          key={`${sectionIndex}-${text}`}
          text={text}
          isDetailed={isDetailed}
        />
      ));

      if (section.label) {
        return [
          <div key={section.label}>
            <span className='font-semibold text-gray-600 dark:text-gray-300'>
              {section.label}：
            </span>
            <InlinePropertyList properties={propertyNodes} />
          </div>,
        ];
      }
      return propertyNodes;
    });

    if (commonProperties.length === 0 && usageNodes.length === 0) return null;
    return (
      <PropertyContainer isMobileEditMode={isMobileEditMode}>
        {commonProperties.length > 0 && <InlinePropertyList properties={commonProperties} />}
        {sections.length > 1 ? (
          <div className={cn('space-y-1', commonProperties.length > 0 && 'mt-1')}>{usageNodes}</div>
        ) : (
          usageNodes.length > 0 && (
            <>
              {commonProperties.length > 0 && ' · '}
              <InlinePropertyList properties={usageNodes} />
            </>
          )
        )}
      </PropertyContainer>
    );
  }

  if (skill.type === 'passive') {
    return commonProperties.length > 0 ? (
      <PropertyContainer isMobileEditMode={isMobileEditMode}>
        <InlinePropertyList properties={commonProperties} />
      </PropertyContainer>
    ) : null;
  }

  const usageParts = getSkillUsageParts(skill);
  const multiPart = hasSkillParts(skill);

  return (
    <PropertyContainer isMobileEditMode={isMobileEditMode}>
      {commonProperties.length > 0 && (
        <div className='space-y-1'>
          {commonProperties.map((property, index) => (
            <div key={index}>{property}</div>
          ))}
        </div>
      )}
      <div className='mt-2 space-y-3'>
        {usageParts.map((usage, partIndex) => {
          const usageRef: SkillUsageProperties =
            'parts' in skillRef ? skillRef.parts[partIndex]! : skillRef;
          const pathPrefix = multiPart
            ? `skills.${skillIndex}.parts.${partIndex}`
            : `skills.${skillIndex}`;

          return (
            <div
              key={partIndex}
              className={cn(
                usageParts.length > 1 &&
                  'rounded border border-dashed border-gray-300 p-2 dark:border-gray-600'
              )}
            >
              {usageParts.length > 1 && (
                <div className='mb-2 flex items-center justify-between'>
                  <span className='text-sm font-semibold text-gray-600 dark:text-gray-300'>
                    第{partIndex + 1}段
                  </span>
                  <IconButton
                    type='button'
                    aria-label={`移除第${partIndex + 1}段`}
                    onClick={() => removeSkillPart(skillRef, partIndex)}
                    variant='delete'
                    size='sm'
                  >
                    <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
                  </IconButton>
                </div>
              )}
              <SkillUsagePropertiesEditor
                usage={usage}
                usageRef={usageRef}
                pathPrefix={pathPrefix}
                radioNameSuffix={`${skillIndex}-${partIndex}`}
                factionId={localCharacter.factionId!}
              />
            </div>
          );
        })}
      </div>
      <AddPartButton skillRef={skillRef} />
    </PropertyContainer>
  );
}
