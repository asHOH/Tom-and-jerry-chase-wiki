import React, { Fragment } from 'react';
import Tooltip from '../../../ui/Tooltip';
import { getTooltipContent } from '@/lib/tooltipUtils';
import EditableField from '@/components/ui/EditableField';
import { useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { characters } from '@/data';

interface AttributeDisplayProps {
  label: string;
  value: string | number;
  factionId: 'cat' | 'mouse';
  isDetailed: boolean;
  className?: string;
  path?: string;
  suffix?: string;
}

const GrayUnit = ({ children }: { children: React.ReactNode }) => (
  <span className='text-gray-400 dark:text-gray-500 text-xs'>{children}</span>
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
  return (
    <p className={className}>
      <Tooltip content={getTooltipContent(label, factionId, isDetailed)}>{label}</Tooltip>:
      {path ? (
        <>
          {' '}
          <EditableField tag='span' path={path} initialValue={value} className='inline' />
          {suffix && <GrayUnit>{suffix}</GrayUnit>}
        </>
      ) : label == '爪刀CD' ? (
        <>
          {' '}
          <EditableField
            tag='span'
            path='clawKnifeCdUnhit'
            initialValue={localCharacter.clawKnifeCdUnhit || 0}
            className='inline'
          />
          <GrayUnit> / </GrayUnit>
          <EditableField
            tag='span'
            path='clawKnifeCdHit'
            initialValue={localCharacter.clawKnifeCdHit || 0}
            className='inline'
          />
          <GrayUnit> 秒</GrayUnit>
          {suffix && <GrayUnit>{suffix}</GrayUnit>}
        </>
      ) : label == '别名' ? (
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
              {index < localCharacter.aliases!.length - 1 && (
                <span className='text-gray-400'>、</span>
              )}
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
            className='w-4 h-4 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 ml-2'
            key='new-weapon-button'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              className='w-3 h-3'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
            </svg>
          </button>
          {suffix && <GrayUnit>{suffix}</GrayUnit>}
        </>
      ) : (
        <>
          {' '}
          <span>{value}</span>
          {suffix && <GrayUnit>{suffix}</GrayUnit>}
        </>
      )}
    </p>
  );
}
