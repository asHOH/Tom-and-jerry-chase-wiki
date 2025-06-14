import React from 'react';
import Tooltip from '../../ui/Tooltip';
import { getTooltipContent } from '@/lib/tooltipUtils';

interface AttributeDisplayProps {
  label: string;
  value: string | number;
  factionId: 'cat' | 'mouse';
  isDetailed: boolean;
  className?: string;
}

export default function AttributeDisplay({
  label,
  value,
  factionId,
  isDetailed,
  className = 'text-sm text-gray-700 py-1',
}: AttributeDisplayProps) {
  return (
    <p className={className}>
      <Tooltip content={getTooltipContent(label, factionId, isDetailed)}>{label}</Tooltip>: {value}
    </p>
  );
}
