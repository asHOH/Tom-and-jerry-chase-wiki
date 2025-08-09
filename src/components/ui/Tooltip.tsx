'use client';

import React from 'react';
import clsx from 'clsx';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useMobile } from '../../hooks/useMediaQuery';

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
  const isMobile = useMobile();
  const [open, setOpen] = React.useState<boolean>(false);
  const effectiveDelay = isMobile ? 0 : delay;

  const trigger = (
    <span
      className={clsx(
        'cursor-help border-b border-dotted border-gray-400 dark:border-gray-500 hover:border-gray-600 dark:hover:border-gray-400 transition-colors',
        className
      )}
    >
      {children}
    </span>
  );

  if (disabled) {
    return trigger;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={effectiveDelay}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger
          asChild
          onClick={(e) => {
            if (isMobile) {
              e.preventDefault();
              setOpen((prev) => !prev);
            }
          }}
        >
          {trigger}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side='top'
            align='center'
            sideOffset={8}
            collisionPadding={{ top: 92, bottom: 8, left: 8, right: 8 }}
            className='z-[10000] px-3 py-2 text-sm text-white bg-gray-800 dark:bg-black dark:text-gray-200 rounded-md shadow-lg pointer-events-none max-w-xs break-words whitespace-pre-wrap'
          >
            {content}
            <TooltipPrimitive.Arrow
              className='fill-gray-800 dark:fill-black'
              width={8}
              height={8}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
