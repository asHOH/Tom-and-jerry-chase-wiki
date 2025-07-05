import React, { useState, useCallback, useRef, useEffect } from 'react';
import { getCardCostColors } from '@/lib/design-tokens';

interface CostRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

type DraggedHandle = 0 | 1 | null;

export default function CostRangeSlider({
  min,
  max,
  value,
  onChange,
  className = '',
}: CostRangeSliderProps) {
  // Maintain the physical handle positions independently
  const [handlePositions, setHandlePositions] = useState<[number, number]>(() => {
    // Initialize with the provided values
    return [value[0], value[1]];
  });
  const [draggedHandle, setDraggedHandle] = useState<DraggedHandle>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Update handle positions when value prop changes (but not during drag)
  useEffect(() => {
    if (draggedHandle === null) {
      setHandlePositions([value[0], value[1]]);
    }
  }, [value, draggedHandle]);

  // Calculate the actual min/max from the handle positions
  const minValue = Math.min(handlePositions[0], handlePositions[1]);
  const maxValue = Math.max(handlePositions[0], handlePositions[1]);

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

  const updateValueFromEvent = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || draggedHandle === null) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = Math.round(min + percentage * (max - min));

      // Update the dragged handle position
      const newPositions: [number, number] = [...handlePositions];
      newPositions[draggedHandle] = newValue;
      setHandlePositions(newPositions);

      // Always send values in sorted order (min, max) to parent
      const sortedValues: [number, number] = [
        Math.min(newPositions[0], newPositions[1]),
        Math.max(newPositions[0], newPositions[1]),
      ];
      onChange(sortedValues);
    },
    [draggedHandle, min, max, handlePositions, onChange]
  );

  const handleStart = useCallback((handle: DraggedHandle, e?: React.TouchEvent) => {
    if (e) {
      e.preventDefault();
    }
    setDraggedHandle(handle);
  }, []);

  // Handle document-level events when dragging
  useEffect(() => {
    if (draggedHandle === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateValueFromEvent(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        updateValueFromEvent(touch.clientX);
      }
    };

    const handleEnd = () => {
      setDraggedHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [draggedHandle, updateValueFromEvent]);

  const getPositionPercentage = (cost: number) => 8.5 + ((cost - min) / (max - min)) * 83;

  const handleTrackClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); // Prevent default touch/mouse behavior
      if (!sliderRef.current) return;

      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0]?.clientX || 0;
      } else {
        clientX = e.clientX;
      }
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const clickedValue = Math.round(min + percentage * (max - min));

      const currentMinHandleValue = handlePositions[0];
      const currentMaxHandleValue = handlePositions[1];

      const distToMin = Math.abs(clickedValue - currentMinHandleValue);
      const distToMax = Math.abs(clickedValue - currentMaxHandleValue);

      const newPositions: [number, number] = [...handlePositions];

      if (distToMin <= distToMax) {
        // Click is closer to the min handle or equally close, move min handle
        newPositions[0] = clickedValue;
      } else {
        // Click is closer to the max handle, move max handle
        newPositions[1] = clickedValue;
      }

      setHandlePositions(newPositions);

      const sortedValues: [number, number] = [
        Math.min(newPositions[0], newPositions[1]),
        Math.max(newPositions[0], newPositions[1]),
      ];
      onChange(sortedValues);
    },
    [min, max, handlePositions, onChange]
  );

  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={sliderRef}
        className='relative w-full h-8'
        onMouseDown={handleTrackClick}
        onTouchStart={handleTrackClick}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Track segments with cost colors */}
        <div className='absolute top-1/2 transform -translate-y-1/2 w-[83%] left-[8.5%] h-2 rounded-full overflow-hidden flex pointer-events-none'>
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

        {/* Handle 1 */}
        <div
          className='absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-10'
          style={{
            left: `${getPositionPercentage(handlePositions[0])}%`,
            backgroundColor: getCardCostColors(handlePositions[0]).backgroundColor,
            borderColor: getCardCostColors(handlePositions[0]).color,
          }}
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent track click when handle is dragged
            handleStart(0);
          }}
          onTouchStart={(e) => {
            e.stopPropagation(); // Prevent track click when handle is dragged
            handleStart(0, e);
          }}
        />

        {/* Handle 2 */}
        <div
          className='absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-10'
          style={{
            left: `${getPositionPercentage(handlePositions[1])}%`,
            backgroundColor: getCardCostColors(handlePositions[1]).backgroundColor,
            borderColor: getCardCostColors(handlePositions[1]).color,
          }}
          onMouseDown={(e) => {
            e.stopPropagation(); // Prevent track click when handle is dragged
            handleStart(1);
          }}
          onTouchStart={(e) => {
            e.stopPropagation(); // Prevent track click when handle is dragged
            handleStart(1, e);
          }}
        />
      </div>

      {/* Cost labels */}
      <div className='flex justify-between mt-1 text-xs text-gray-500 select-none'>
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const cost = min + i;
          const isInRange = cost >= minValue && cost <= maxValue;
          return (
            <span
              key={cost}
              className={`flex-1 text-center transition-all duration-150 cursor-default ${
                isInRange
                  ? 'text-gray-700 text-xs font-medium'
                  : 'text-gray-400 text-[10px] font-normal'
              }`}
            >
              {cost}
            </span>
          );
        })}
      </div>
    </div>
  );
}
