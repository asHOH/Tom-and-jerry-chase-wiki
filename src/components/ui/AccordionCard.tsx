import React, { startTransition, useState } from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';

import {
  disclosureTitleSizeClasses,
  disclosureToneClasses,
  disclosureTriggerFocusClasses,
  type DisclosureSize,
  type DisclosureTone,
} from './disclosureStyles';

type AccordionItem = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  color?: DisclosureTone;
  activeColor?: DisclosureTone;
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  titleClassName?: string;
  defaultOpenId?: string;
  size?: DisclosureSize;
  useDefaultButtonColors?: boolean;
  buttonClassName?: string;
  activeButtonClassName?: string;
  contentContainerClassName?: string;
  contentPanelClassName?: string;
};

const titleSpacingClasses: Record<DisclosureSize, string> = {
  xs: '',
  sm: 'mx-1',
  md: 'mx-2',
} as const;

export default function AccordionCard({
  items,
  className,
  titleClassName,
  defaultOpenId,
  size,
  useDefaultButtonColors = true,
  buttonClassName,
  activeButtonClassName,
  contentContainerClassName,
  contentPanelClassName,
}: AccordionProps) {
  const resolvedSize = size ?? 'md';
  const titleClassNames = cn(
    disclosureTitleSizeClasses[resolvedSize],
    titleSpacingClasses[resolvedSize]
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(defaultOpenId ?? null);
  const [renderedItemId, setRenderedItemId] = useState<string | null>(defaultOpenId ?? null);

  const toggleItem = (itemId: string) => {
    const nextItemId = activeItemId === itemId ? null : itemId;

    setActiveItemId(nextItemId);
    startTransition(() => {
      setRenderedItemId(nextItemId);
    });
  };

  return (
    <div className={className}>
      <div
        className={cn(
          'flex scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-x-auto',
          'dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800',
          titleClassName
        )}
      >
        {items.map((item) => {
          const isExpanded = activeItemId === item.id;
          const colorToUse =
            isExpanded && item.activeColor ? item.activeColor : item.color || 'default';

          return (
            <Button
              variant='unstyled'
              key={item.id}
              type='button'
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center px-1 py-1 font-bold text-black dark:text-white',
                disclosureTriggerFocusClasses,
                'whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-200',
                useDefaultButtonColors && 'border-2',
                useDefaultButtonColors && disclosureToneClasses[colorToUse],
                useDefaultButtonColors &&
                  isExpanded &&
                  colorToUse === 'default' &&
                  'bg-control-hover',
                useDefaultButtonColors && isExpanded && 'shadow-inner',
                buttonClassName,
                isExpanded && activeButtonClassName
              )}
              aria-expanded={isExpanded}
            >
              <span className={titleClassNames}>{item.title}</span>
            </Button>
          );
        })}
      </div>

      <div className={contentContainerClassName}>
        {items.map((item) => {
          const isExpanded = renderedItemId === item.id;

          return (
            isExpanded && (
              <div key={`content-${item.id}`} className={cn(contentPanelClassName, item.className)}>
                {item.children}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
