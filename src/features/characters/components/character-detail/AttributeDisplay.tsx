import React, { Fragment } from 'react';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { characters } from '@/data';
import type { FactionId } from '@/data/types';
import { RANKABLE_PROPERTIES, RankableProperty } from '@/features/characters/utils/ranking';
import { useSnapshot } from 'valtio';

import { getTooltipContent } from '@/lib/tooltipUtils';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

interface AttributeDisplayProps {
  label: string;
  value: string | number;
  factionId: FactionId;
  isDetailed: boolean;
  className?: string;
  path?: string;
  suffix?: string;
}

const GrayUnit = ({ children }: { children: React.ReactNode }) => (
  <span className='text-xs text-gray-400 dark:text-gray-500'>{children}</span>
);

export default function AttributeDisplay({
  label,
  value,
  factionId,
  isDetailed,
  className = 'text-sm text-gray-700 dark:text-gray-300 py-1',
  path,
  suffix,
}: AttributeDisplayProps) {
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const { isEditMode } = useEditMode();

  const getRankablePropertyKey = (): RankableProperty | undefined => {
    if (path && RANKABLE_PROPERTIES.some((p) => p.key === path)) {
      return path as RankableProperty;
    }
    return undefined;
  };

  const rankablePropertyKey = getRankablePropertyKey();
  const isLinkable = !isEditMode && !!rankablePropertyKey;
  const linkHref = isLinkable ? `/ranks/${rankablePropertyKey}?faction=${factionId}` : '';

  const renderValue = (val: string | number, sfx: string | undefined, href?: string) =>
    !!href ? (
      <>
        {' '}
        <Link href={href} className='cursor-pointer hover:underline'>
          <span>{val}</span>
        </Link>
        {sfx && <GrayUnit>{sfx}</GrayUnit>}
      </>
    ) : (
      <>
        {' '}
        <span>{val}</span>
        {sfx && <GrayUnit>{sfx}</GrayUnit>}
      </>
    );

  const renderClawKnifeCD = () =>
    isEditMode ? (
      <>
        {' '}
        <EditableField
          tag='span'
          path='clawKnifeCdUnhit'
          initialValue={localCharacter.clawKnifeCdUnhit || 0}
          className='inline'
        />
        <span className='italic'>
          {' '}
          (
          <EditableField
            tag='span'
            path='specialClawKnifeCdUnhit'
            initialValue={
              localCharacter.specialClawKnifeCdUnhit || localCharacter.clawKnifeCdUnhit || 0
            }
          />
          )
        </span>
        <GrayUnit> / </GrayUnit>
        <EditableField
          tag='span'
          path='clawKnifeCdHit'
          initialValue={localCharacter.clawKnifeCdHit || 0}
          className='inline'
        />
        <span className='italic'>
          {' '}
          (
          <EditableField
            tag='span'
            path='specialClawKnifeCdHit'
            initialValue={
              localCharacter.specialClawKnifeCdHit || localCharacter.clawKnifeCdHit || 0
            }
          />
          )
        </span>
        <GrayUnit> 秒</GrayUnit>
        {suffix && <GrayUnit>{suffix}</GrayUnit>}
      </>
    ) : (
      <>
        {' '}
        <Link
          href={`/ranks/clawKnifeCdUnhit?faction=cat`}
          className='cursor-pointer hover:underline'
        >
          {localCharacter.clawKnifeCdUnhit}
        </Link>
        {!!localCharacter.specialClawKnifeCdUnhit && (
          <span className='italic'> ({localCharacter.specialClawKnifeCdUnhit})</span>
        )}
        <GrayUnit> / </GrayUnit>
        <Link href={`/ranks/clawKnifeCdHit?faction=cat`} className='cursor-pointer hover:underline'>
          {localCharacter.clawKnifeCdHit}
        </Link>
        {!!localCharacter.specialClawKnifeCdHit && (
          <span className='italic'> ({localCharacter.specialClawKnifeCdHit})</span>
        )}
        <GrayUnit> 秒</GrayUnit>
        {suffix && <GrayUnit>{suffix}</GrayUnit>}
      </>
    );

  const renderAliases = () => (
    <>
      {' '}
      {(localCharacter.aliases ?? []).map((alias, index) => (
        <Fragment key={alias}>
          <EditableField
            tag='span'
            initialValue={alias}
            path={`aliases.${index}`}
            onSave={(newValue) => {
              const character = characters[characterId]!;
              if (newValue.trim() === '') {
                // Remove empty alias
                character.aliases = character.aliases!.filter((_, i) => i !== index);
              } else {
                // Update alias
                character.aliases![index] = newValue.trim();
              }
            }}
          />
          {index < localCharacter.aliases!.length - 1 && <span className='text-gray-400'>、</span>}
        </Fragment>
      ))}
      <button
        type='button'
        aria-label='添加别名'
        onClick={() => {
          const character = characters[characterId]!;
          if (!character.aliases) {
            character.aliases = [];
          }
          if (character.aliases.indexOf('新别名') === -1) {
            character.aliases.push('新别名');
          }
        }}
        className='ml-2 flex h-4 w-4 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
        key='new-weapon-button'
      >
        <PlusIcon className='h-3 w-3' aria-hidden='true' />
      </button>
      {suffix && <GrayUnit>{suffix}</GrayUnit>}
    </>
  );

  return (
    <p className={className}>
      <Tooltip content={getTooltipContent(label, factionId, isDetailed)}>{label}</Tooltip>:
      {path && isEditMode ? (
        <>
          {' '}
          <EditableField tag='span' path={path} initialValue={value} className='inline' />
          {suffix && <GrayUnit>{suffix}</GrayUnit>}
        </>
      ) : label === '爪刀CD' && isEditMode ? (
        renderClawKnifeCD()
      ) : label === '别名' && isEditMode ? (
        renderAliases()
      ) : isLinkable ? (
        renderValue(value, suffix, linkHref)
      ) : label === '爪刀CD' ? (
        renderClawKnifeCD()
      ) : label === '别名' ? (
        renderAliases()
      ) : (
        renderValue(value, suffix)
      )}
    </p>
  );
}
