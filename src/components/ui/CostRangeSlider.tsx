import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getCardCostColors } from '@/lib/design-tokens';

interface CostRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

type DraggedHandle = 'min' | 'max' | null;

export default function CostRangeSlider({
  min,
  max,
  value,
  onChange,
  className = '',
}: CostRangeSliderProps) {
  const [minValue, maxValue] = value;
  const [draggedHandle, setDraggedHandle] = useState<DraggedHandle>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getColorForCost = useCallback((cost: number) => {
    const colors = getCardCostColors(cost);
    return colors.backgroundColor;
  }, []);

  const getSegmentStyle = useCallback(
    (segmentStart: number, segmentEnd: number) => {
      // Use the color of the start point of the segment (n for segment n to n+1)
      return {
        backgroundColor: getColorForCost(segmentStart),
        opacity: segmentStart >= minValue && segmentEnd <= maxValue ? 1 : 0.3,
      };
    },
    [minValue, maxValue, getColorForCost]
  );

  const updateValueFromMouseEvent = useCallback(
    (e: MouseEvent) => {
      if (!sliderRef.current || draggedHandle === null) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newValue = Math.round(min + percentage * (max - min));

      // Update only the dragged handle, keep the other handle fixed
      if (draggedHandle === 'min') {
        // Dragging the min handle: update min, keep max fixed, ensure min ≤ max
        const newMin = Math.min(newValue, maxValue);
        onChange([newMin, maxValue]);
      } else if (draggedHandle === 'max') {
        // Dragging the max handle: update max, keep min fixed, ensure min ≤ max
        const newMax = Math.max(newValue, minValue);
        onChange([minValue, newMax]);
      }
    },
    [draggedHandle, min, max, minValue, maxValue, onChange]
  );

  const handleMouseDown = useCallback((handle: DraggedHandle) => {
    setDraggedHandle(handle);
  }, []);

  // Handle document-level mouse events when dragging
  useEffect(() => {
    if (draggedHandle === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateValueFromMouseEvent(e);
    };

    const handleMouseUpGlobal = () => {
      setDraggedHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUpGlobal);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [draggedHandle, updateValueFromMouseEvent]);

  const getPositionPercentage = (cost: number) => 8.5 + ((cost - min) / (max - min)) * 83;

  return (
    <div className={`relative w-full ${className}`}>
      <div ref={sliderRef} className='relative w-full h-8'>
        {/* Track segments with cost colors */}
        <div className='absolute top-1/2 transform -translate-y-1/2 w-[83%] left-[8.5%] h-2 rounded-full overflow-hidden flex'>
          {Array.from({ length: max - min }, (_, i) => {
            const segmentStart = min + i;
            const segmentEnd = min + i + 1;
            return (
              <div
                key={i}
                className='flex-1 border-r border-white border-opacity-50 last:border-r-0'
                style={getSegmentStyle(segmentStart, segmentEnd)}
              />
            );
          })}
        </div>

        {/* Min handle */}
        <div
          className='absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-10'
          style={{
            left: `${getPositionPercentage(minValue)}%`,
            backgroundColor: getCardCostColors(minValue).backgroundColor,
            borderColor: getCardCostColors(minValue).color,
          }}
          onMouseDown={() => handleMouseDown('min')}
        />

        {/* Max handle */}
        <div
          className='absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-10'
          style={{
            left: `${getPositionPercentage(maxValue)}%`,
            backgroundColor: getCardCostColors(maxValue).backgroundColor,
            borderColor: getCardCostColors(maxValue).color,
          }}
          onMouseDown={() => handleMouseDown('max')}
        />
      </div>

      {/* Cost labels */}
      <div className='flex justify-between mt-1 text-xs text-gray-500'>
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const cost = min + i;
          return (
            <span key={cost} className='flex-1 text-center'>
              {cost}
            </span>
          );
        })}
      </div>
    </div>
  );
}
