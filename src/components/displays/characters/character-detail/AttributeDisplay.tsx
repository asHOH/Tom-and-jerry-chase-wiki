import React from 'react';
import Tooltip from '../../../ui/Tooltip';
import { getTooltipContent } from '@/lib/tooltipUtils';
import EditableField from '@/components/ui/EditableField';

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
  return (
    <p className={className}>
      <Tooltip content={getTooltipContent(label, factionId, isDetailed)}>{label}</Tooltip>:
      {path ? (
        <>
          {' '}
          <EditableField tag='span' path={path} initialValue={value} className='inline' />
          {suffix && ` ${suffix}`}
        </>
      ) : (
        ` ${value}${suffix ? ` ${suffix}` : ''}`
      )}
    </p>
  );
}
