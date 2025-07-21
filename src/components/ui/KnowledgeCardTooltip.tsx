'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import clsx from 'clsx';

interface KnowledgeCardTooltipProps {
  children: React.ReactNode;
  cardName: string;
  imageUrl: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Specialized tooltip component for knowledge cards showing image
 */
export default function KnowledgeCardTooltip({
  children,
  cardName,
  imageUrl,
  className = '',
  disabled = false,
}: KnowledgeCardTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disabled) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 120; // Card image width
    const tooltipHeight = 150; // Card image height + padding

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

    // Set tooltip to show after delay
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
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
        className={clsx('cursor-pointer transition-colors', className)}
      >
        {children}
      </span>
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className='fixed z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 pointer-events-none transition-opacity duration-200 ease-in-out'
            style={{
              left: position.x,
              top: position.y,
              transform: 'translateX(-50%)',
              opacity: isVisible ? 1 : 0,
            }}
          >
            <div className='relative w-24 h-24'>
              <Image src={imageUrl} alt={cardName} fill className='object-contain' />
            </div>
            <div className='text-center mt-1 text-xs text-gray-600 dark:text-gray-300 font-medium'>
              {cardName}
            </div>
            <div
              className='absolute w-2 h-2 bg-white dark:bg-slate-800 transform rotate-45 border-r border-b border-gray-200 dark:border-slate-700'
              style={{
                left: '50%',
                bottom: '-5px',
                transform: 'translateX(-50%)',
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
