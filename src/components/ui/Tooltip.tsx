import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

/**
 * Reusable Tooltip component for displaying contextual help
 * Consolidates tooltip logic previously duplicated across components
 */
export default function Tooltip({ children, content, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 200; // Estimated tooltip width
    const tooltipHeight = 40; // Estimated tooltip height

    // Calculate position to avoid going off-screen
    let x = rect.left + rect.width / 2;
    let y = rect.top - tooltipHeight - 8; // 8px gap above the element

    // Adjust horizontal position if tooltip would go off-screen
    if (x + tooltipWidth / 2 > window.innerWidth) {
      x = window.innerWidth - tooltipWidth / 2 - 10;
    } else if (x - tooltipWidth / 2 < 0) {
      x = tooltipWidth / 2 + 10;
    }

    // If tooltip would go above viewport, show it below instead
    if (y < 0) {
      y = rect.bottom + 8;
    }

    setPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

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
            className='fixed z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-opacity duration-200 ease-in-out'
            style={{
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%)',
              opacity: isVisible ? 1 : 0,
            }}
          >
            {content}
            <div
              className='absolute w-2 h-2 bg-gray-800 transform rotate-45'
              style={{
                left: '50%',
                bottom: '-4px',
                transform: 'translateX(-50%) rotate(45deg)',
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
