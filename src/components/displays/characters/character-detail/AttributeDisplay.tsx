import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { getTooltipContent } from '@/lib/tooltipUtils';
import EditableField from '@/components/ui/EditableField';
import { useLocalCharacter } from '@/context/EditModeContext';

interface AttributeDisplayProps {
  label: string;
  value: string | number;
  factionId: 'cat' | 'mouse';
  isDetailed: boolean;
  className?: string;
  path?: string;
  suffix?: string;
}

export default function AttributeDisplay({
  label,
  value,
  factionId,
  isDetailed,
  className = 'text-sm text-gray-700 py-1',
  path,
  suffix,
}: AttributeDisplayProps) {
  const { localCharacter } = useLocalCharacter();
  return (
    <p className={className}>
      <Tooltip content={getTooltipContent(label, factionId, isDetailed)}>{label}</Tooltip>:
      {path ? (
        <>
          {' '}
          <EditableField tag='span' path={path} initialValue={value} className='inline' />
          {suffix && ` ${suffix}`}
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
          {' / '}
          <EditableField
            tag='span'
            path='clawKnifeCdHit'
            initialValue={localCharacter.clawKnifeCdHit || 0}
            className='inline'
          />
          {' 秒'}
          {suffix && ` ${suffix}`}
        </>
      ) : (
        ` ${value}${suffix ? ` ${suffix}` : ''}`
      )}
    </p>
  );
}
