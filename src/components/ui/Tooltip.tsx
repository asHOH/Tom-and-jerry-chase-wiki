'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
  disabled?: boolean;
  delay?: number;
}

/**
 * Reusable Tooltip component for displaying contextual help
 * Consolidates tooltip logic previously duplicated across components
 */
export default function Tooltip({
  children,
  content,
  className = '',
  disabled = false,
  delay = 0,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isBelow, setIsBelow] = useState(false);
  const [arrowOffset, setArrowOffset] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disabled) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    // More accurate width estimation based on content length
    const tooltipWidth = Math.max(120, Math.min(300, content.length * 8 + 40));
    const tooltipHeight = 40; // Estimated tooltip height
    const navBarHeight = 84; // Navigation bar height (adjust based on actual height)

    // Calculate position to avoid going off-screen
    let x = rect.left + rect.width / 2;
    let y;
    let showBelow = false;

    // Determine vertical position - try above first, then below if needed
    // Also check if tooltip would be hidden by navigation bar
    if (rect.top - tooltipHeight - 8 < navBarHeight) {
      y = rect.bottom + 8;
      showBelow = true;
    } else {
      y = rect.top - tooltipHeight - 8;
    }

    // Store original x position for arrow calculation
    const originalX = x;

    // Adjust horizontal position if tooltip would go off-screen
    // Priority: Keep tooltip connected to arrow, then handle viewport constraints
    const tooltipLeft = x - tooltipWidth / 2;
    const tooltipRight = x + tooltipWidth / 2;
    const padding = 10;

    if (tooltipRight > window.innerWidth - padding) {
      // Right edge collision - shift left minimally
      const overflow = tooltipRight - (window.innerWidth - padding);
      x = x - overflow;
    } else if (tooltipLeft < padding) {
      // Left edge collision - shift right minimally
      const overflow = padding - tooltipLeft;
      x = x + overflow;
    }

    // Calculate arrow offset based on how much we shifted the tooltip
    const arrowOffsetValue = originalX - x;

    // Don't clamp arrow offset - let it move to maintain connection
    // Only ensure it doesn't go completely outside tooltip bounds
    const maxArrowOffset = tooltipWidth / 2 - 10; // Allow arrow to be close to edge
    const clampedArrowOffset = Math.max(
      -maxArrowOffset,
      Math.min(maxArrowOffset, arrowOffsetValue)
    );

    setPosition({ x, y });
    setIsBelow(showBelow);
    setArrowOffset(clampedArrowOffset);

    // Set tooltip to show after delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    // Clear timeout and hide tooltip
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`cursor-help border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors ${className}`}
      >
        {children}
      </span>
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className='fixed px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-opacity duration-200 ease-in-out'
            style={{
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%)',
              opacity: isVisible ? 1 : 0,
              zIndex: 10000, // Higher than navigation bar (9999)
            }}
          >
            {content}
            <div
              className='absolute w-1 h-1 bg-gray-800'
              style={{
                left: `calc(50% + ${arrowOffset}px)`,
                [isBelow ? 'top' : 'bottom']: '-2px',
                transform: `translateX(-50%) rotate(45deg)`,
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
