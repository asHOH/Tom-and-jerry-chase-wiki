import React from 'react';
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
