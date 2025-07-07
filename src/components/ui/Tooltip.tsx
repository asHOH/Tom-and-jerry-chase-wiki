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
  const [triggerCenter, setTriggerCenter] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const triggerCenterX = rect.left + rect.width / 2;
    const navBarHeight = 84;
    const tooltipGap = 8;
    const viewportPadding = 10;
    const tooltipHeight = 40; // Estimated tooltip height

    let x = triggerCenterX;
    let y: number;
    let showBelow = false;

    if (rect.top - tooltipHeight - tooltipGap < navBarHeight) {
      y = rect.bottom + tooltipGap;
      showBelow = true;
    } else {
      y = rect.top - tooltipHeight - tooltipGap;
    }

    if (x < viewportPadding) {
      x = viewportPadding;
    } else if (x > window.innerWidth - viewportPadding) {
      x = window.innerWidth - viewportPadding;
    }

    setPosition({ x, y });
    setIsBelow(showBelow);
    setTriggerCenter(triggerCenterX);

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

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
            className='fixed px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-opacity duration-200 ease-in-out max-w-xs break-words'
            style={{
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%)',
              opacity: isVisible ? 1 : 0,
              zIndex: 10000,
            }}
          >
            {content}
            <div
              className='absolute w-1 h-1 bg-gray-800'
              style={{
                left: `calc(50% + ${triggerCenter - position.x}px)`,
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
