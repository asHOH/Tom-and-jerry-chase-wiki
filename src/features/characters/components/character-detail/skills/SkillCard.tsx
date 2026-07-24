'use client';

import React, { Fragment } from 'react';
import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import { AssetManager } from '@/lib/assetManager';
import { cn, getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design';
import { CharacterWithFaction } from '@/lib/types';
import { useMobile } from '@/hooks/useMediaQuery';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { characters } from '@/data/store';
import { Skill, SkillLevel } from '@/data/types';
import SingleItemWikiHistoryDisplay from '@/features/shared/components/SingleItemWikiHistoryDisplay';
import DetailOwnbuffsCard from '@/features/shared/detail-view/DetaidOwnbuffsCard';
import DetailReverseCard from '@/features/shared/detail-view/DetailReverseCard';
import DetailTraitsCard from '@/features/shared/detail-view/DetailTraitsCard';
import Card from '@/components/ui/Card';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { TrashIcon } from '@/components/icons/CommonIcons';

import SkillCardMedia from './SkillCardMedia';
import SkillCardProperties from './SkillCardProperties';

const e = editable('characters');

type SkillCardProps = {
  skill: DeepReadonly<Skill>;
  isSingleWeapon?: boolean;
  characterId: string;
  skillIndex: number;
};

function SkillDescriptionPrefix({ skill, level }: { skill: DeepReadonly<Skill>; level: number }) {
  const results: React.ReactNode[] = [];
  const previousCharges = skill.skillLevels[level - 2]?.charges ?? 1;
  const charges = skill.skillLevels[level - 1]?.charges ?? 1;
  if (previousCharges != charges) {
    if (charges != 1) {
      results.push(
        <Fragment key='charges-change'>
          技能可以存储<span className='text-blue-600 dark:text-blue-400'>{charges}</span>次
        </Fragment>
      );
    }
  }
  const previousCooldown = skill.skillLevels[level - 2]?.cooldown ?? 0;
  const cooldown = skill.skillLevels[level - 1]?.cooldown ?? 0;
  if (previousCooldown != cooldown && level != 1) {
    results.push(
      <Fragment key='cooldown-change'>
        CD减少至<span className='text-blue-600 dark:text-blue-400'>{cooldown}</span>秒
      </Fragment>
    );
  }
  if (results.length === 0) return null;

  const children: React.ReactNode[] = [];
  results.forEach((result, idx) => {
    children.push(result);
    if (idx < results.length - 1) {
      children.push('；');
    } else {
      children.push(skill.skillLevels[level - 1]?.description ? '；' : '。');
    }
  });
  return <>{children}</>;
}

function getSkillTypeLabel(type: string, isSingleWeapon?: boolean) {
  if (isSingleWeapon && type === 'weapon1') {
    return '武器';
  }
  const typeMap = {
    active: '主动',
    weapon1: '武器1',
    weapon2: '武器2',
    passive: '被动',
  };
  return typeMap[type as keyof typeof typeMap] || '被动';
}

function updateSkillName({
  characterId,
  skillIndex,
  localCharacter,
  newName,
}: {
  characterId: string;
  skillIndex: number;
  localCharacter: CharacterWithFaction;
  newName: string;
}) {
  const factionId = localCharacter.factionId!;
  const skill = characters[characterId]!.skills[skillIndex]!;
  skill.name = newName;
  skill.imageUrl = AssetManager.getSkillImageUrl(
    localCharacter.id,
    { ...skill, name: newName },
    factionId
  );
}

function RemoveWeaponButton({ characterId }: { characterId: string }) {
  return (
    <IconButton
      type='button'
      aria-label='移除技能'
      onClick={() => {
        characters[characterId]!.skills = characters[characterId]!.skills.filter(
          ({ type }: Skill) => type != 'weapon2'
        );
      }}
      variant='delete'
      size='md'
      className='ml-auto'
    >
      <TrashIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
    </IconButton>
  );
}

function SkillHistory({ skill, className }: { skill: DeepReadonly<Skill>; className?: string }) {
  return (
    <div className={className}>
      <SingleItemWikiHistoryDisplay singleItem={{ name: skill.name, type: 'skill' }} />
    </div>
  );
}

function SkillHeader({
  skill,
  skillTypeLabel,
  characterId,
  skillIndex,
  localCharacter,
  isEditMode,
  showHistory,
}: {
  skill: DeepReadonly<Skill>;
  skillTypeLabel: string;
  characterId: string;
  skillIndex: number;
  localCharacter: CharacterWithFaction;
  isEditMode: boolean;
  showHistory: boolean;
}) {
  return (
    <div className='flex items-center justify-between'>
      <h3 className='px-2 text-xl font-bold md:py-2 dark:text-white'>
        {skillTypeLabel} ·{' '}
        <e.span
          id={`Skill:${skill.name}`}
          path={`skills.${skillIndex}.name`}
          initialValue={skill.name}
          isSingleLine={true}
          onSave={(newName) =>
            updateSkillName({ characterId, skillIndex, localCharacter, newName })
          }
        />
        {showHistory && <SkillHistory skill={skill} className='font-normal' />}
      </h3>
      {isEditMode && skill.type == 'weapon2' && <RemoveWeaponButton characterId={characterId} />}
    </div>
  );
}

function SkillDescription({
  skill,
  skillIndex,
  isDetailed,
  isEditMode,
}: {
  skill: DeepReadonly<Skill>;
  skillIndex: number;
  isDetailed: boolean;
  isEditMode: boolean;
}) {
  if (skill.type == 'passive' && !('description' in skill) && !isEditMode) {
    return null;
  }

  return (
    <div className='mt-3 px-2'>
      <div className='py-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
        <e.span
          initialValue={
            (isDetailed && skill.detailedDescription?.trim()
              ? skill.detailedDescription
              : skill.description) ?? '<无内容>'
          }
          path={`skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
          data-tutorial-id='skill-description-edit'
        />
      </div>
    </div>
  );
}

export default function SkillCard({
  skill,
  isSingleWeapon,
  characterId,
  skillIndex,
}: SkillCardProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const localCharacter = useSnapshot(characters[characterId]!) as CharacterWithFaction;
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();
  const skillTypeLabel = getSkillTypeLabel(skill.type, isSingleWeapon);

  const getLevelDescription = (level: SkillLevel): string =>
    isDetailed && level.detailedDescription?.trim() ? level.detailedDescription : level.description;

  return (
    <Card className='px-4! py-6! md:p-6! dark:border-slate-700 dark:bg-slate-800'>
      <div className='flex items-start'>
        <SkillCardMedia
          skill={skill}
          characterId={characterId}
          skillIndex={skillIndex}
          isEditMode={isEditMode}
        />
        <div className='flex-1'>
          <SkillHeader
            skill={skill}
            skillTypeLabel={skillTypeLabel}
            characterId={characterId}
            skillIndex={skillIndex}
            localCharacter={localCharacter}
            isEditMode={isEditMode}
            showHistory={!isMobile && !isEditMode}
          />
          {(!isMobile || !isEditMode) && (
            <SkillCardProperties
              skill={skill}
              characterId={characterId}
              skillIndex={skillIndex}
              localCharacter={localCharacter}
              isEditMode={isEditMode}
              isDetailed={isDetailed}
            />
          )}
          {!isMobile && (
            <SkillDescription
              skill={skill}
              skillIndex={skillIndex}
              isDetailed={isDetailed}
              isEditMode={isEditMode}
            />
          )}
        </div>
      </div>

      {isMobile && (
        <div className='flex-1'>
          {!isEditMode && <SkillHistory skill={skill} className='px-2' />}
          {isEditMode && (
            <SkillCardProperties
              skill={skill}
              characterId={characterId}
              skillIndex={skillIndex}
              localCharacter={localCharacter}
              isEditMode={isEditMode}
              isDetailed={isDetailed}
              isMobileEditMode={true}
            />
          )}
          <SkillDescription
            skill={skill}
            skillIndex={skillIndex}
            isDetailed={isDetailed}
            isEditMode={isEditMode}
          />
        </div>
      )}

      <div className='mt-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {skill.skillLevels
            .filter((level: SkillLevel) => {
              // Hide Lv.1 if: 1) mobile layout, 2) edit mode off, 3) description is empty for current detailed mode
              if (level.level === 1 && isMobile && !isEditMode) {
                return getLevelDescription(level)?.trim() !== '';
              }
              return true;
            })
            .map((level: SkillLevel) => (
              <div
                key={`${skill.id}-${level.level}`}
                className={cn(
                  'rounded p-4 dark:text-gray-300',
                  getSkillLevelContainerColor(level.level)
                )}
              >
                <p className='px-2 py-1 whitespace-pre-wrap'>
                  <span
                    className='font-bold'
                    style={{ color: getSkillLevelColors(level.level, false, isDarkMode).color }}
                  >
                    Lv.{level.level}:
                  </span>{' '}
                  <SkillDescriptionPrefix skill={skill} level={level.level} />
                  <e.span
                    initialValue={getLevelDescription(level)}
                    path={`skills.${skillIndex}.skillLevels.${level.level - 1}.${isDetailed ? 'detailedDescription' : 'description'}`}
                  />
                </p>
              </div>
            ))}
        </div>
      </div>
      <div className='mt-4 space-y-2'>
        <DetailTraitsCard singleItem={{ name: skill.name, type: 'skill' }} />
        <DetailReverseCard singleItem={{ name: skill.name, type: 'skill' }} />
        <DetailOwnbuffsCard singleItem={{ name: skill.name, type: 'skill' }} />
      </div>
    </Card>
  );
}
